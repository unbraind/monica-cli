import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  GLOBAL_SETTINGS_PATH,
  ensureSettingsDir,
  ensurePrivateDirectory,
  loadSettings,
  saveSettings,
  writePrivateFile,
  normalizeSettings,
  maskApiKey,
  maskPassword,
  settingsFileExists,
  getSettingsStats,
  deleteSettingsFile,
  outputSingleKey,
  printConfig,
  VALID_UNSET_KEYS,
  KEY_MAP,
} from '../src/utils/settings';

const TEST_SETTINGS_DIR = path.join(os.homedir(), '.monica-cli-test');
const TEST_SETTINGS_PATH = path.join(TEST_SETTINGS_DIR, 'settings.json');

describe('settings utility', () => {
  const originalHome = process.env.HOME;
  
  beforeEach(() => {
    if (fs.existsSync(TEST_SETTINGS_PATH)) {
      fs.unlinkSync(TEST_SETTINGS_PATH);
    }
    if (fs.existsSync(TEST_SETTINGS_DIR)) {
      fs.rmdirSync(TEST_SETTINGS_DIR);
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_SETTINGS_PATH)) {
      fs.unlinkSync(TEST_SETTINGS_PATH);
    }
    if (fs.existsSync(TEST_SETTINGS_DIR)) {
      fs.rmdirSync(TEST_SETTINGS_DIR);
    }
  });

  describe('maskApiKey', () => {
    it('handles an empty key', () => {
      expect(maskApiKey('')).toBe('[hidden]');
    });

    it('masks short keys without exposing raw characters', () => {
      expect(maskApiKey('shortkey')).toMatch(/^\[hidden:8:sha256:[0-9a-f]{8}\]$/);
    });

    it('masks long keys', () => {
      const longKey = 'fake.jwt.token.' + 'x'.repeat(100);
      expect(maskApiKey(longKey)).toMatch(/^\[hidden:115:sha256:[0-9a-f]{8}\]$/);
    });
  });

  (process.platform === 'win32' ? describe.skip : describe)('private path permissions', () => {
    it('repairs existing directory and file modes', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'monica-settings-'));
      const settingsDir = path.join(root, 'config');
      const settingsPath = path.join(settingsDir, 'settings.json');

      try {
        fs.mkdirSync(settingsDir, { mode: 0o777 });
        fs.writeFileSync(settingsPath, '{}', { mode: 0o666 });
        fs.chmodSync(settingsDir, 0o777);
        fs.chmodSync(settingsPath, 0o666);

        ensurePrivateDirectory(settingsDir);
        writePrivateFile(settingsPath, '{"readOnlyMode":true}');

        expect(fs.statSync(settingsDir).mode & 0o777).toBe(0o700);
        expect(fs.statSync(settingsPath).mode & 0o777).toBe(0o600);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    });
  });

  describe('maskPassword', () => {
    it('masks passwords with asterisks', () => {
      expect(maskPassword('mysecretpassword')).toBe('********');
    });

    it('masks short passwords', () => {
      expect(maskPassword('abc')).toBe('***');
    });
  });

  describe('VALID_UNSET_KEYS', () => {
    it('contains expected keys', () => {
      expect(VALID_UNSET_KEYS).toContain('user-email');
      expect(VALID_UNSET_KEYS).toContain('userEmail');
      expect(VALID_UNSET_KEYS).toContain('user-password');
      expect(VALID_UNSET_KEYS).toContain('userPassword');
      expect(VALID_UNSET_KEYS).toContain('default-format');
      expect(VALID_UNSET_KEYS).toContain('defaultFormat');
      expect(VALID_UNSET_KEYS).toContain('read-only-mode');
      expect(VALID_UNSET_KEYS).toContain('readOnlyMode');
      expect(VALID_UNSET_KEYS).toContain('github-repo-starred');
      expect(VALID_UNSET_KEYS).toContain('githubRepoStarred');
    });
  });

  describe('KEY_MAP', () => {
    it('maps kebab-case to camelCase', () => {
      expect(KEY_MAP['user-email']).toBe('userEmail');
      expect(KEY_MAP['user-password']).toBe('userPassword');
      expect(KEY_MAP['default-format']).toBe('defaultFormat');
      expect(KEY_MAP['read-only-mode']).toBe('readOnlyMode');
      expect(KEY_MAP['github-repo-starred']).toBe('githubRepoStarred');
    });
  });

  describe('normalizeSettings', () => {
    it('maps legacy readOnly to readOnlyMode', () => {
      const normalized = normalizeSettings({
        apiUrl: 'http://localhost/api',
        apiKey: 'token',
        readOnly: true,
      });
      expect(normalized.readOnlyMode).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(normalized, 'readOnly')).toBe(false);
    });

    it('prefers readOnlyMode when both keys are present', () => {
      const normalized = normalizeSettings({
        apiUrl: 'http://localhost/api',
        apiKey: 'token',
        readOnly: true,
        readOnlyMode: false,
      });
      expect(normalized.readOnlyMode).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(normalized, 'readOnly')).toBe(false);
    });
  });

  describe('safe configuration output', () => {
    const settings = {
      apiUrl: 'https://monica.test/api',
      apiKey: 'private-token',
      userEmail: 'user@example.test',
      userPassword: 'private-password',
      defaultFormat: 'yaml' as const,
      readOnlyMode: true,
      githubRepoStarred: true,
    };

    afterEach(() => vi.restoreAllMocks());

    it.each([
      ['api-url', 'https://monica.test/api'],
      ['apiUrl', 'https://monica.test/api'],
      ['api-key', '[hidden:13:sha256:'],
      ['apiKey', '[hidden:13:sha256:'],
      ['user-email', 'user@example.test'],
      ['userEmail', 'user@example.test'],
      ['user-password', '********'],
      ['userPassword', '********'],
      ['read-only-mode', 'true'],
      ['readOnlyMode', 'true'],
      ['default-format', 'yaml'],
      ['defaultFormat', 'yaml'],
      ['github-repo-starred', 'true'],
      ['githubRepoStarred', 'true'],
    ])('prints %s without exposing raw secrets', (key, expected) => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      outputSingleKey(settings, key);
      const output = String(logSpy.mock.calls[0]?.[0]);
      expect(output).toContain(expected);
      expect(output).not.toContain('private-token');
      expect(output).not.toContain('private-password');
    });

    it('prints sanitized all/default/unknown projections', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      outputSingleKey(settings, 'all');
      outputSingleKey({}, 'all');
      outputSingleKey({}, 'unknown');
      const output = logSpy.mock.calls.flat().join('\n');
      expect(output).toContain('"defaultFormat": "yaml"');
      expect(output).toContain('Not set');
      expect(output).toContain('Unknown key: unknown');
      expect(output).not.toContain('private-token');
      expect(output).not.toContain('private-password');
    });

    it('prints complete and empty config summaries safely', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      printConfig(settings);
      printConfig({});
      const output = logSpy.mock.calls.flat().join('\n');
      expect(output).toContain('https://monica.test/api');
      expect(output).toContain('[hidden:13:sha256:');
      expect(output).toContain('Not set');
      expect(output).not.toContain('private-token');
      expect(output).not.toContain('private-password');
    });

    it('reports the live settings file metadata without mutating it', () => {
      const exists = fs.existsSync(GLOBAL_SETTINGS_PATH);
      expect(settingsFileExists()).toBe(exists);
      if (exists) {
        expect(getSettingsStats()?.isFile()).toBe(true);
        expect(loadSettings()).not.toBeNull();
      } else {
        expect(getSettingsStats()).toBeNull();
        expect(loadSettings()).toBeNull();
      }
    });
  });
});
