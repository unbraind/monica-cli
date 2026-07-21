import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = { settings: null as Record<string, unknown> | null };
vi.mock('../src/api', () => ({ setConfig: vi.fn(), getUser: vi.fn() }));
vi.mock('../src/commands/config-capability-probe', () => ({
  runSetupCapabilityProbe: vi.fn(async () => ({ attempted: false, cached: false })),
}));
vi.mock('../src/commands/github-star', () => ({
  maybePromptGitHubStar: vi.fn(async (settings: unknown) => settings),
  maybePromptGitHubStarOnCliRun: vi.fn(),
}));
vi.mock('../src/utils/settings', () => ({
  GLOBAL_SETTINGS_PATH: '/tmp/.monica-cli/settings.json',
  loadSettings: vi.fn(() => state.settings),
  saveSettings: vi.fn(),
  deleteSettingsFile: vi.fn(() => true),
  getSettingsStats: vi.fn(() => null),
  maskApiKey: vi.fn(() => '[hidden]'),
  VALID_UNSET_KEYS: ['user-email', 'read-only-mode'],
  KEY_MAP: { 'user-email': 'userEmail', 'read-only-mode': 'readOnlyMode' },
}));
vi.mock('../src/utils/capability-cache', () => ({
  getCapabilityCachePath: vi.fn(() => '/tmp/cache.json'),
  getCapabilityCacheStats: vi.fn(() => null),
}));

import * as api from '../src/api';
import { Command } from 'commander';
import { createConfigCommand, runConfigSetup } from '../src/commands/config';
import * as settings from '../src/utils/settings';

describe('config command edge contracts', () => {
  let log: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;
  const load = settings.loadSettings as unknown as ReturnType<typeof vi.fn>;
  const save = settings.saveSettings as unknown as ReturnType<typeof vi.fn>;
  const getUser = api.getUser as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    state.settings = null;
    load.mockImplementation(() => state.settings);
    log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getUser.mockResolvedValue({ data: { id: 1, account: { id: 2 } } });
  });
  afterEach(() => vi.restoreAllMocks());

  function payload(): Record<string, unknown> {
    return JSON.parse(String(log.mock.calls.at(-1)?.[0])) as Record<string, unknown>;
  }

  it('reports missing, unknown, and all-key config reads', async () => {
    await createConfigCommand().parseAsync(['--format', 'json', 'get'], { from: 'user' });
    expect(payload().ok).toBe(false);
    state.settings = { apiUrl: 'https://example.test/api', apiKey: 'secret' };
    await createConfigCommand().parseAsync(['--format', 'json', 'get', 'unknown'], { from: 'user' });
    expect(payload().message).toBe('Unknown key: unknown');
    await createConfigCommand().parseAsync(['--format', 'json', 'get', 'all'], { from: 'user' });
    expect(payload().key).toBe('all');
  });

  it('handles show without config and with a healthy connection', async () => {
    await createConfigCommand().parseAsync(['--format', 'json', 'show'], { from: 'user' });
    expect(payload().ok).toBe(false);
    state.settings = { apiUrl: 'https://example.test/api', apiKey: 'secret' };
    await createConfigCommand().parseAsync(['--format', 'json', 'show'], { from: 'user' });
    expect(payload().ok).toBe(true);
  });

  it('fails connection tests for missing config and request errors', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);
    await expect(createConfigCommand().parseAsync(
      ['--format', 'json', 'test'], { from: 'user' },
    )).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
    state.settings = { apiUrl: 'https://example.test/api', apiKey: 'secret' };
    getUser.mockRejectedValueOnce(new Error('offline'));
    await expect(createConfigCommand().parseAsync(
      ['--format', 'json', 'test'], { from: 'user' },
    )).rejects.toThrow('exit');
    expect(payload().ok).toBe(false);
    expect(exit).toHaveBeenCalledTimes(2);
  });

  it('prints set usage and updates every supported setting', async () => {
    await createConfigCommand().parseAsync(['--format', 'json', 'set'], { from: 'user' });
    expect(payload().ok).toBe(false);
    await createConfigCommand().parseAsync([
      '--format', 'json', 'set', '--api-url', 'https://example.test', '--api-key', ' token ',
      '--user-email', ' user@example.test ', '--user-password', 'password', '--read-write',
      '--non-interactive',
    ], { from: 'user' });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      apiUrl: 'https://example.test/api', apiKey: 'token', userEmail: 'user@example.test',
      userPassword: 'password', readOnlyMode: false,
    }));
  });

  it('does not save contradictory safety modes', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await createConfigCommand().parseAsync([
      'set', '--read-only', '--read-write', '--non-interactive',
    ], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(1);
    expect(error).toHaveBeenCalled();
  });

  it('updates read-only mode without requiring connection credentials', async () => {
    state.settings = {};
    await createConfigCommand().parseAsync([
      'set', '--read-only', '--non-interactive',
    ], { from: 'user' });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ readOnlyMode: true }));
  });

  it('supports reset confirmation, forced reset, and location output', async () => {
    await createConfigCommand().parseAsync(['--format', 'json', 'reset'], { from: 'user' });
    expect(payload().ok).toBe(false);
    await createConfigCommand().parseAsync(['--format', 'json', 'reset', '--force'], { from: 'user' });
    expect(payload().deleted).toBe(true);
    await createConfigCommand().parseAsync(['--format', 'json', 'location'], { from: 'user' });
    expect(payload()).toMatchObject({ path: '/tmp/.monica-cli/settings.json', exists: false });
  });

  it('handles unset without config, invalid keys, and valid values', async () => {
    await createConfigCommand().parseAsync(['--format', 'json', 'unset', 'user-email'], { from: 'user' });
    expect(payload().ok).toBe(false);
    state.settings = { userEmail: 'user@example.test', readOnlyMode: true };
    await createConfigCommand().parseAsync(['--format', 'json', 'unset', 'api-key'], { from: 'user' });
    expect(payload().message).toBe('Cannot unset: api-key');
    await createConfigCommand().parseAsync(['--format', 'json', 'unset', 'user-email'], { from: 'user' });
    expect(save).toHaveBeenCalledWith({ readOnlyMode: true });
    expect(payload().removed).toBe('user-email');
  });

  it('reports invalid setup input through the standard error path', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await createConfigCommand().parseAsync([
      'setup', '--api-url', 'invalid', '--api-key', 'token', '--non-interactive',
    ], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('runs the exported setup workflow', async () => {
    await runConfigSetup({
      apiUrl: 'https://example.test', apiKey: 'token', nonInteractive: true,
    }, new Command().option('--format <format>', '', 'json'));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      apiUrl: 'https://example.test/api', apiKey: 'token',
    }));
  });
});
