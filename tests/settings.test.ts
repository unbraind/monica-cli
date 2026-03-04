import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  GLOBAL_SETTINGS_PATH,
  ensureSettingsDir,
  loadSettings,
  saveSettings,
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
    it('masks short keys without exposing raw characters', () => {
      expect(maskApiKey('shortkey')).toMatch(/^\[hidden:8:sha256:[0-9a-f]{8}\]$/);
    });

    it('masks long keys', () => {
      const longKey = 'fake.jwt.token.' + 'x'.repeat(100);
      expect(maskApiKey(longKey)).toMatch(/^\[hidden:115:sha256:[0-9a-f]{8}\]$/);
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
});
