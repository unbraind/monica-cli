import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash } from 'crypto';
import type { MonicaConfig } from '../types';

export const GLOBAL_SETTINGS_PATH = path.join(os.homedir(), '.monica-cli', 'settings.json');

export function ensureSettingsDir(): void {
  const dir = path.dirname(GLOBAL_SETTINGS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

export function loadSettings(): Partial<MonicaConfig> | null {
  try {
    if (fs.existsSync(GLOBAL_SETTINGS_PATH)) {
      const content = fs.readFileSync(GLOBAL_SETTINGS_PATH, 'utf-8');
      return normalizeSettings(JSON.parse(content) as Partial<MonicaConfig>);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function saveSettings(config: Partial<MonicaConfig>): void {
  ensureSettingsDir();
  fs.writeFileSync(GLOBAL_SETTINGS_PATH, JSON.stringify(normalizeSettings(config), null, 2), { mode: 0o600 });
}

export function normalizeSettings(config: Partial<MonicaConfig>): Partial<MonicaConfig> {
  const normalized: Partial<MonicaConfig> = { ...config };
  if (normalized.readOnlyMode === undefined && normalized.readOnly !== undefined) {
    normalized.readOnlyMode = normalized.readOnly === true;
  }
  delete normalized.readOnly;
  return normalized;
}

export function maskApiKey(key: string): string {
  if (!key) return '[hidden]';
  const fingerprint = createHash('sha256').update(key).digest('hex').slice(0, 8);
  return `[hidden:${key.length}:sha256:${fingerprint}]`;
}

export function maskPassword(password: string): string {
  return '*'.repeat(Math.min(password.length, 8));
}

export function settingsFileExists(): boolean {
  return fs.existsSync(GLOBAL_SETTINGS_PATH);
}

export function getSettingsStats(): fs.Stats | null {
  if (settingsFileExists()) {
    return fs.statSync(GLOBAL_SETTINGS_PATH);
  }
  return null;
}

export function deleteSettingsFile(): boolean {
  if (fs.existsSync(GLOBAL_SETTINGS_PATH)) {
    fs.unlinkSync(GLOBAL_SETTINGS_PATH);
    return true;
  }
  return false;
}

export function outputSingleKey(settings: Partial<MonicaConfig>, key: string): void {
  switch (key) {
    case 'api-url':
    case 'apiUrl':
      console.log(settings.apiUrl || 'Not set');
      break;
    case 'api-key':
    case 'apiKey':
      console.log(settings.apiKey ? maskApiKey(settings.apiKey) : 'Not set');
      break;
    case 'user-email':
    case 'userEmail':
      console.log(settings.userEmail || 'Not set');
      break;
    case 'user-password':
    case 'userPassword':
      console.log(settings.userPassword ? maskPassword(settings.userPassword) : 'Not set');
      break;
    case 'read-only-mode':
    case 'readOnlyMode':
      console.log(settings.readOnlyMode ? 'true' : 'false');
      break;
    case 'default-format':
    case 'defaultFormat':
      console.log(settings.defaultFormat || 'toon');
      break;
    case 'github-repo-starred':
    case 'githubRepoStarred':
      console.log(settings.githubRepoStarred ? 'true' : 'false');
      break;
    case 'all':
      console.log(JSON.stringify({
        apiUrl: settings.apiUrl || 'Not set',
        apiKey: settings.apiKey ? maskApiKey(settings.apiKey) : 'Not set',
        userEmail: settings.userEmail || 'Not set',
        userPassword: settings.userPassword ? '[hidden]' : 'Not set',
        defaultFormat: settings.defaultFormat || 'toon',
        readOnlyMode: settings.readOnlyMode || false,
        githubRepoStarred: settings.githubRepoStarred || false,
      }, null, 2));
      break;
    default:
      console.log(`Unknown key: ${key}`);
      console.log('Valid keys: api-url, api-key, user-email, user-password, default-format, read-only-mode, github-repo-starred, all');
  }
}

export function printConfig(settings: Partial<MonicaConfig>): void {
  console.log(`api-url:       ${settings.apiUrl || 'Not set'}`);
  console.log(`api-key:       ${settings.apiKey ? maskApiKey(settings.apiKey) : 'Not set'}`);
  console.log(`user-email:    ${settings.userEmail || 'Not set'}`);
  console.log(`user-password: ${settings.userPassword ? '[hidden]' : 'Not set'}`);
  console.log(`default-format:${settings.defaultFormat ? ` ${settings.defaultFormat}` : ' toon'}`);
  console.log(`read-only-mode:${settings.readOnlyMode ? ' true' : ' false'}`);
  console.log(`github-starred:${settings.githubRepoStarred ? ' true' : ' false'}`);
}

export const VALID_UNSET_KEYS = [
  'user-email',
  'userEmail',
  'user-password',
  'userPassword',
  'default-format',
  'defaultFormat',
  'read-only-mode',
  'readOnlyMode',
  'github-repo-starred',
  'githubRepoStarred',
];

export const KEY_MAP: Record<string, string> = {
  'user-email': 'userEmail',
  'userEmail': 'userEmail',
  'user-password': 'userPassword',
  'userPassword': 'userPassword',
  'default-format': 'defaultFormat',
  'defaultFormat': 'defaultFormat',
  'read-only-mode': 'readOnlyMode',
  'readOnlyMode': 'readOnlyMode',
  'github-repo-starred': 'githubRepoStarred',
  'githubRepoStarred': 'githubRepoStarred',
};
