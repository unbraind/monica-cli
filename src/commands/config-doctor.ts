import type { Stats } from 'fs';
import type { MonicaConfig } from '../types';
import { GLOBAL_SETTINGS_PATH, getSettingsStats } from '../utils/settings';
import { getCapabilityCachePath, getCapabilityCacheStats } from '../utils/capability-cache';
import { verifyConfigConnection } from './config-connection';

type DoctorStatus = 'pass' | 'warn' | 'fail';

interface DoctorCheck {
  id: string;
  status: DoctorStatus;
  message: string;
  details?: Record<string, unknown>;
}

interface DoctorSummary {
  pass: number;
  warn: number;
  fail: number;
}

function buildCheck(
  id: string,
  status: DoctorStatus,
  message: string,
  details?: Record<string, unknown>
): DoctorCheck {
  return { id, status, message, details };
}

function getModeInfo(stats: Stats | null): { mode: string | null; worldReadable: boolean } {
  if (!stats) return { mode: null, worldReadable: false };
  const mode = stats.mode & 0o777;
  return {
    mode: `0o${mode.toString(8).padStart(3, '0')}`,
    worldReadable: (mode & 0o077) !== 0,
  };
}

function parseCapabilityCacheTtlSeconds(): number {
  const envValue = Number.parseInt(process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS || '', 10);
  if (Number.isFinite(envValue) && envValue >= 0) {
    return envValue;
  }
  return 300;
}

function summarize(checks: DoctorCheck[]): DoctorSummary {
  return checks.reduce<DoctorSummary>(
    (result, check) => {
      result[check.status] += 1;
      return result;
    },
    { pass: 0, warn: 0, fail: 0 }
  );
}

function evaluateSettingsFileCheck(stats: Stats | null): DoctorCheck {
  if (!stats) {
    return buildCheck('settings-file', 'fail', 'Settings file is missing', { path: GLOBAL_SETTINGS_PATH });
  }

  const modeInfo = getModeInfo(stats);
  if (modeInfo.worldReadable) {
    return buildCheck('settings-file', 'warn', 'Settings file permissions are too open; expected 0o600', {
      path: GLOBAL_SETTINGS_PATH,
      mode: modeInfo.mode,
      expectedMode: '0o600',
    });
  }

  return buildCheck('settings-file', 'pass', 'Settings file exists with private permissions', {
    path: GLOBAL_SETTINGS_PATH,
    mode: modeInfo.mode,
  });
}

function evaluateReadOnlyModeCheck(settings: Partial<MonicaConfig>): DoctorCheck {
  if (settings.readOnlyMode === true) {
    return buildCheck('read-only-mode', 'pass', 'Read-only safety mode is enabled');
  }
  return buildCheck(
    'read-only-mode',
    'warn',
    'Read-only safety mode is disabled; write operations are allowed',
    { recommendedCommand: 'monica config set --read-only' }
  );
}

function evaluateCapabilityCacheCheck(): DoctorCheck {
  const stats = getCapabilityCacheStats();
  if (!stats) {
    return buildCheck('capability-cache', 'warn', 'Capability cache not found; run info capabilities to prime it', {
      path: getCapabilityCachePath(),
    });
  }

  const ageSeconds = Math.max(0, Math.floor((Date.now() - stats.mtimeMs) / 1000));
  const ttlSeconds = parseCapabilityCacheTtlSeconds();
  const stale = ttlSeconds === 0 || ageSeconds > ttlSeconds;

  return buildCheck(
    'capability-cache',
    stale ? 'warn' : 'pass',
    stale ? 'Capability cache is stale; refresh recommended' : 'Capability cache is fresh',
    {
      path: getCapabilityCachePath(),
      modifiedAt: stats.mtime.toISOString(),
      ageSeconds,
      ttlSeconds,
      stale,
      refreshCommand: 'monica info capabilities --refresh',
    }
  );
}

async function evaluateConnectionCheck(settings: Partial<MonicaConfig>): Promise<DoctorCheck> {
  if (!settings.apiUrl || !settings.apiKey) {
    return buildCheck('connection', 'fail', 'Missing required credentials for connection test', {
      missing: [
        !settings.apiUrl ? 'apiUrl' : null,
        !settings.apiKey ? 'apiKey' : null,
      ].filter((value): value is string => value !== null),
    });
  }

  try {
    const user = await verifyConfigConnection(settings);
    return buildCheck('connection', 'pass', 'Connection test succeeded', {
      apiUrl: settings.apiUrl,
      user: {
        id: user.data.id ?? null,
        email: user.data.email ?? null,
      },
    });
  } catch (error) {
    return buildCheck('connection', 'fail', 'Connection test failed', {
      apiUrl: settings.apiUrl,
      error: (error as Error).message,
    });
  }
}

export async function runConfigDoctor(settings: Partial<MonicaConfig> | null): Promise<Record<string, unknown>> {
  if (!settings) {
    return {
      ok: false,
      message: 'No configuration found. Run: monica config setup',
      checks: [evaluateSettingsFileCheck(getSettingsStats())],
      summary: { pass: 0, warn: 0, fail: 1 },
      location: {
        settingsPath: GLOBAL_SETTINGS_PATH,
        capabilityCachePath: getCapabilityCachePath(),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  const checks: DoctorCheck[] = [
    evaluateSettingsFileCheck(getSettingsStats()),
    evaluateReadOnlyModeCheck(settings),
    evaluateCapabilityCacheCheck(),
    await evaluateConnectionCheck(settings),
  ];
  const summary = summarize(checks);
  return {
    ok: summary.fail === 0,
    generatedAt: new Date().toISOString(),
    summary,
    checks,
    location: {
      settingsPath: GLOBAL_SETTINGS_PATH,
      capabilityCachePath: getCapabilityCachePath(),
    },
  };
}
