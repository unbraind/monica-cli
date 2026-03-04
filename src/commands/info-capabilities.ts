import { Command } from 'commander';
import * as api from '../api';
import { loadCachedCapabilityReport, saveCapabilityReport } from '../utils/capability-cache';

export interface UnsupportedCommandEntry {
  key: string;
  command: string;
  endpoint: string;
  statusCode: number;
  message: string;
  severity: 'unsupported' | 'auth' | 'rate-limited' | 'error';
  recommendedAction: string;
  fallbackCommands: string[];
}

export function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid value "${value}". Expected a non-negative integer.`);
  }
  return parsed;
}

export async function resolveCapabilityReportWithSource(
  command: Command
): Promise<{ report: api.CapabilityReport; source: 'cache' | 'live' }> {
  const options = command.opts() as { refresh?: boolean; cacheTtl?: number };
  const cached = loadCachedCapabilityReport({
    refresh: options.refresh,
    ttlSeconds: options.cacheTtl,
  });
  if (cached) return { report: cached, source: 'cache' };

  const report = await api.probeApiCapabilities();
  saveCapabilityReport(report);
  return { report, source: 'live' };
}

function classifySeverity(statusCode: number): UnsupportedCommandEntry['severity'] {
  if (statusCode === 401 || statusCode === 403) return 'auth';
  if (statusCode === 429) return 'rate-limited';
  if (statusCode === 404 || statusCode === 405) return 'unsupported';
  return 'error';
}

function buildFallbackCommands(key: string): string[] {
  if (key === 'contactFields') {
    return [
      'monica --json contact-fields list <contact-id> --limit 10',
      'monica --json contact-fields list --scan-contacts --contact-max-pages 2 --limit 50',
    ];
  }
  if (key === 'groups') {
    return [
      'monica --json groups list --scan-tags --tag-max-pages 2',
      'monica --json contacts list --limit 50',
      'monica --json tags list --limit 50',
      'monica --json info supported-commands',
    ];
  }
  if (key === 'petCategories') {
    return [
      'monica --json pet-categories list --scan-pets --pet-max-pages 2',
      'monica --json pets list --limit 50',
      'monica --json info supported-commands',
    ];
  }
  return ['monica --json info supported-commands'];
}

function buildRecommendedAction(entry: Pick<UnsupportedCommandEntry, 'key' | 'statusCode'>): string {
  if (entry.statusCode === 401 || entry.statusCode === 403) {
    return 'Verify API token scope and refresh credentials via `monica config test` and `monica config setup`.';
  }
  if (entry.statusCode === 429) {
    return 'Retry with backoff and lower concurrency; set `--request-timeout-ms` if needed.';
  }
  if (entry.key === 'contactFields') {
    return 'Use contact-scoped listing instead of global endpoint on this Monica instance.';
  }
  if (entry.key === 'groups') {
    return 'Groups endpoints are unavailable on this Monica instance/version; use groups tag-scan fallback or tags/contact lists instead.';
  }
  if (entry.key === 'petCategories') {
    return 'Pet category metadata endpoint is unavailable on this Monica instance/version; use --scan-pets fallback or pet records directly.';
  }
  if (entry.statusCode === 404 || entry.statusCode === 405) {
    return 'Treat this command family as unavailable on this Monica instance/version.';
  }
  return 'Treat this as a transient instance/API error and retry once before skipping this command family.';
}

export function getUnsupportedCommands(report: api.CapabilityReport): UnsupportedCommandEntry[] {
  return report.probes
    .filter((probe) => !probe.supported)
    .map((probe) => ({
      key: probe.key,
      command: probe.command,
      endpoint: probe.endpoint,
      statusCode: probe.statusCode,
      message: probe.message,
      severity: classifySeverity(probe.statusCode),
      recommendedAction: buildRecommendedAction({
        key: probe.key,
        statusCode: probe.statusCode,
      }),
      fallbackCommands: buildFallbackCommands(probe.key),
    }));
}
