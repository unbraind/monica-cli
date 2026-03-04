import type { MonicaConfig } from '../types';
import { probeApiCapabilities } from '../api/capabilities';
import { setConfig } from '../api/client';
import { saveCapabilityReport } from '../utils/capability-cache';

export interface SetupCapabilityProbeResult {
  attempted: boolean;
  cached: boolean;
  summary?: {
    total: number;
    supported: number;
    unsupported: number;
  };
  generatedAt?: string;
  error?: string;
}

export interface SetupCapabilityProbeOptions {
  enabled: boolean;
}

export async function runSetupCapabilityProbe(
  settings: Partial<MonicaConfig>,
  options: SetupCapabilityProbeOptions
): Promise<SetupCapabilityProbeResult> {
  if (!options.enabled) {
    return {
      attempted: false,
      cached: false,
    };
  }
  if (!settings.apiUrl || !settings.apiKey) {
    return {
      attempted: false,
      cached: false,
      error: 'Capability probe skipped: missing API URL or API key.',
    };
  }

  try {
    setConfig({
      apiUrl: settings.apiUrl,
      apiKey: settings.apiKey,
      userEmail: settings.userEmail,
      userPassword: settings.userPassword,
      readOnlyMode: settings.readOnlyMode,
    });
    const report = await probeApiCapabilities();
    saveCapabilityReport(report);
    return {
      attempted: true,
      cached: true,
      summary: report.summary,
      generatedAt: report.generatedAt,
    };
  } catch (error) {
    return {
      attempted: true,
      cached: false,
      error: (error as Error).message,
    };
  }
}
