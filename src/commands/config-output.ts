import { Command } from 'commander';
import type { MonicaConfig, OutputFormat } from '../types';
import { GLOBAL_SETTINGS_PATH, getSettingsStats, maskApiKey } from '../utils/settings';
import { resolveCommandOutputFormat } from './output-format';

export interface ConfigDisplay {
  apiUrl: string | null;
  apiKey: string | null;
  userEmail: string | null;
  userPassword: '[hidden]' | null;
  defaultFormat: OutputFormat;
  readOnlyMode: boolean;
  githubRepoStarred: boolean;
}

export function getConfigOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}

export function toDisplayConfig(settings: Partial<MonicaConfig>): ConfigDisplay {
  return {
    apiUrl: settings.apiUrl || null,
    apiKey: settings.apiKey ? maskApiKey(settings.apiKey) : null,
    userEmail: settings.userEmail || null,
    userPassword: settings.userPassword ? '[hidden]' : null,
    defaultFormat: settings.defaultFormat || 'toon',
    readOnlyMode: settings.readOnlyMode === true,
    githubRepoStarred: settings.githubRepoStarred === true,
  };
}

export function getConfigValue(settings: Partial<MonicaConfig>, key: string): { key: string; value: unknown } | null {
  switch (key) {
    case 'api-url':
    case 'apiUrl':
      return { key: 'api-url', value: settings.apiUrl || null };
    case 'api-key':
    case 'apiKey':
      return { key: 'api-key', value: settings.apiKey ? maskApiKey(settings.apiKey) : null };
    case 'user-email':
    case 'userEmail':
      return { key: 'user-email', value: settings.userEmail || null };
    case 'user-password':
    case 'userPassword':
      return { key: 'user-password', value: settings.userPassword ? '[hidden]' : null };
    case 'read-only-mode':
    case 'readOnlyMode':
      return { key: 'read-only-mode', value: settings.readOnlyMode === true };
    case 'default-format':
    case 'defaultFormat':
      return { key: 'default-format', value: settings.defaultFormat || 'toon' };
    case 'github-repo-starred':
    case 'githubRepoStarred':
      return { key: 'github-repo-starred', value: settings.githubRepoStarred === true };
    case 'all':
      return { key: 'all', value: toDisplayConfig(settings) };
    default:
      return null;
  }
}

export function getLocationPayload(): { path: string; exists: boolean; modifiedAt: string | null } {
  const stats = getSettingsStats();
  return {
    path: GLOBAL_SETTINGS_PATH,
    exists: Boolean(stats),
    modifiedAt: stats ? stats.mtime.toISOString() : null,
  };
}

export function buildConnectionPayload(
  settings: Partial<MonicaConfig>,
  user: { id?: number; name?: string; email?: string; account?: { id?: number } }
): Record<string, unknown> {
  return {
    ok: true,
    apiUrl: settings.apiUrl || null,
    user: {
      id: user.id ?? null,
      name: user.name ?? null,
      email: user.email ?? null,
      accountId: user.account?.id ?? null,
    },
  };
}

export function missingConfigPayload(): { ok: false; message: string } {
  return {
    ok: false,
    message: 'No configuration found. Run: monica config setup',
  };
}
