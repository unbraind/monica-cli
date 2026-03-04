import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const settingsState = {
  value: {
    apiUrl: 'http://example.local/api',
    apiKey: 'abcdefghijklmnopqrstuvwxyz0123456789',
    userEmail: 'user@example.local',
    userPassword: 'secret',
    defaultFormat: 'toon',
    readOnlyMode: true,
    githubRepoStarred: false,
  } as Record<string, unknown> | null,
};

vi.mock('../src/api', () => ({
  setConfig: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('../src/commands/config-capability-probe', () => ({
  runSetupCapabilityProbe: vi.fn(async () => ({
    attempted: true,
    cached: true,
    summary: { total: 30, supported: 27, unsupported: 3 },
    generatedAt: '2026-03-04T00:00:00.000Z',
  })),
}));

vi.mock('../src/utils/settings', () => ({
  GLOBAL_SETTINGS_PATH: '/tmp/.monica-cli/settings.json',
  loadSettings: vi.fn(() => settingsState.value),
  saveSettings: vi.fn(),
  deleteSettingsFile: vi.fn(() => true),
  getSettingsStats: vi.fn(() => ({ mtime: new Date('2026-03-02T00:00:00.000Z') })),
  maskApiKey: (key: string) => `[hidden:${key.length}:sha256:testhash]`,
  VALID_UNSET_KEYS: [
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
  ],
  KEY_MAP: {
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
  },
}));

vi.mock('../src/utils/capability-cache', () => ({
  getCapabilityCachePath: vi.fn(() => '/tmp/.monica-cli/cache/capabilities.json'),
  getCapabilityCacheStats: vi.fn(() => ({ mtime: new Date('2026-03-04T00:00:00.000Z'), mtimeMs: Date.parse('2026-03-04T00:00:00.000Z') })),
  saveCapabilityReport: vi.fn(),
}));

import * as api from '../src/api';
import * as settings from '../src/utils/settings';
import * as capabilityCache from '../src/utils/capability-cache';
import * as setupCapabilityProbe from '../src/commands/config-capability-probe';
import { createConfigCommand } from '../src/commands/config';

describe('config command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  const getUserMock = api.getUser as unknown as ReturnType<typeof vi.fn>;
  const setConfigMock = api.setConfig as unknown as ReturnType<typeof vi.fn>;
  const runSetupCapabilityProbeMock = setupCapabilityProbe.runSetupCapabilityProbe as unknown as ReturnType<typeof vi.fn>;
  const loadSettingsMock = settings.loadSettings as unknown as ReturnType<typeof vi.fn>;
  const deleteSettingsFileMock = settings.deleteSettingsFile as unknown as ReturnType<typeof vi.fn>;
  const saveSettingsMock = settings.saveSettings as unknown as ReturnType<typeof vi.fn>;
  const getSettingsStatsMock = settings.getSettingsStats as unknown as ReturnType<typeof vi.fn>;
  const getCapabilityCacheStatsMock = capabilityCache.getCapabilityCacheStats as unknown as ReturnType<typeof vi.fn>;
  const saveCapabilityReportMock = capabilityCache.saveCapabilityReport as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    settingsState.value = {
      apiUrl: 'http://example.local/api',
      apiKey: 'abcdefghijklmnopqrstuvwxyz0123456789',
      userEmail: 'user@example.local',
      userPassword: 'secret',
      defaultFormat: 'toon',
      readOnlyMode: true,
      githubRepoStarred: false,
    };
    loadSettingsMock.mockImplementation(() => settingsState.value);
    getSettingsStatsMock.mockReturnValue({ mode: 0o100600, mtime: new Date('2026-03-02T00:00:00.000Z') });
    getCapabilityCacheStatsMock.mockReturnValue({
      mtime: new Date('2026-03-04T00:00:00.000Z'),
      mtimeMs: Date.parse('2026-03-04T00:00:00.000Z'),
    });
    saveCapabilityReportMock.mockImplementation(() => undefined);
    deleteSettingsFileMock.mockReturnValue(true);
    saveSettingsMock.mockImplementation(() => undefined);
    runSetupCapabilityProbeMock.mockImplementation(async (_settings, options) => {
      if (!options?.enabled) {
        return { attempted: false, cached: false };
      }
      return {
        attempted: true,
        cached: true,
        summary: { total: 30, supported: 27, unsupported: 3 },
        generatedAt: '2026-03-04T00:00:00.000Z',
      };
    });
    getUserMock.mockResolvedValue({
      data: {
        id: 1,
        name: 'Test User',
        email: 'user@example.local',
        account: { id: 42 },
      },
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints structured JSON for config get', async () => {
    const cmd = createConfigCommand();
    await cmd.parseAsync(['--format', 'json', 'get'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.config.apiUrl).toBe('http://example.local/api');
    expect(payload.config.apiKey).toBe('[hidden:36:sha256:testhash]');
    expect(payload.config.userPassword).toBe('[hidden]');
    expect(payload.config.defaultFormat).toBe('toon');
    expect(payload.config.readOnlyMode).toBe(true);
  });

  it('prints structured JSON for config get <key>', async () => {
    const cmd = createConfigCommand();
    await cmd.parseAsync(['--format', 'json', 'get', 'api-key'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload).toEqual({ key: 'api-key', value: '[hidden:36:sha256:testhash]' });
  });

  it('updates default format with config set', async () => {
    const cmd = createConfigCommand();
    await cmd.parseAsync(['--format', 'json', 'set', '--default-format', 'markdown', '--non-interactive'], { from: 'user' });

    expect(saveSettingsMock).toHaveBeenCalledWith(expect.objectContaining({
      defaultFormat: 'md',
    }));
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.config.defaultFormat).toBe('md');
  });

  it('prints structured JSON for config test', async () => {
    const cmd = createConfigCommand();
    await cmd.parseAsync(['--format', 'json', 'test'], { from: 'user' });

    expect(setConfigMock).toHaveBeenCalled();
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.apiUrl).toBe('http://example.local/api');
    expect(payload.user.accountId).toBe(42);
  });

  it('prints structured JSON for config show when connection fails', async () => {
    getUserMock.mockRejectedValueOnce(new Error('Network down'));

    const cmd = createConfigCommand();
    await cmd.parseAsync(['--format', 'json', 'show'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(false);
    expect(payload.connection.ok).toBe(false);
    expect(payload.connection.error).toContain('Connection to http://example.local/api failed');
  });

  it('saves setup config in non-interactive mode with normalized URL and read-only mode', async () => {
    const cmd = createConfigCommand();
    await cmd.parseAsync([
      '--format', 'json',
      'setup',
      '--api-url', 'http://example.local/',
      '--api-key', '  token123  ',
      '--user-email', '  user@example.local ',
      '--default-format', 'yaml',
      '--non-interactive',
      '--read-only',
    ], { from: 'user' });

    expect(saveSettingsMock).toHaveBeenCalledWith(expect.objectContaining({
      apiUrl: 'http://example.local/api',
      apiKey: 'token123',
      userEmail: 'user@example.local',
      defaultFormat: 'yaml',
      readOnlyMode: true,
    }));

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.config.apiUrl).toBe('http://example.local/api');
    expect(payload.config.defaultFormat).toBe('yaml');
    expect(payload.config.readOnlyMode).toBe(true);
    expect(payload.capabilityProbe.cached).toBe(true);
    expect(runSetupCapabilityProbeMock).toHaveBeenCalledTimes(1);
  });

  it('validates setup config in dry-run mode without persisting settings', async () => {
    saveSettingsMock.mockClear();
    const cmd = createConfigCommand();
    await cmd.parseAsync([
      '--format', 'json',
      'setup',
      '--api-url', 'http://example.local/',
      '--api-key', 'token123',
      '--non-interactive',
      '--dry-run',
    ], { from: 'user' });

    expect(saveSettingsMock).not.toHaveBeenCalled();

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.persisted).toBe(false);
    expect(payload.message).toContain('dry-run');
    expect(payload.config.apiUrl).toBe('http://example.local/api');
    expect(runSetupCapabilityProbeMock).toHaveBeenCalledTimes(1);
    expect(runSetupCapabilityProbeMock.mock.calls[0]?.[1]).toEqual({ enabled: false });
    expect(payload.capabilityProbe.attempted).toBe(false);
  });

  it('skips setup capability probing when explicitly requested', async () => {
    const cmd = createConfigCommand();
    await cmd.parseAsync([
      '--format', 'json',
      'setup',
      '--api-url', 'http://example.local/',
      '--api-key', 'token123',
      '--non-interactive',
      '--skip-capability-probe',
    ], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(runSetupCapabilityProbeMock).toHaveBeenCalledTimes(1);
    expect(runSetupCapabilityProbeMock.mock.calls[0]?.[1]).toEqual({ enabled: false });
  });

  it('prints structured JSON for config doctor', async () => {
    const cmd = createConfigCommand();
    await cmd.parseAsync(['--format', 'json', 'doctor'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.summary.fail).toBe(0);
    expect(payload.summary.pass).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(payload.checks)).toBe(true);
    expect(payload.checks.some((check: { id: string; status: string }) => check.id === 'connection' && check.status === 'pass')).toBe(true);
  });

  it('reports warning for disabled read-only mode in config doctor', async () => {
    settingsState.value = {
      ...settingsState.value,
      readOnlyMode: false,
    };

    const cmd = createConfigCommand();
    await cmd.parseAsync(['--format', 'json', 'doctor'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    const readOnlyCheck = payload.checks.find((check: { id: string }) => check.id === 'read-only-mode');
    expect(readOnlyCheck.status).toBe('warn');
  });

  it('reports missing configuration for config doctor', async () => {
    settingsState.value = null;
    loadSettingsMock.mockReturnValueOnce(null);
    getSettingsStatsMock.mockReturnValueOnce(null);

    const cmd = createConfigCommand();
    await cmd.parseAsync(['--format', 'json', 'doctor'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(false);
    expect(payload.message).toContain('No configuration found');
    expect(payload.summary.fail).toBe(1);
  });

});
