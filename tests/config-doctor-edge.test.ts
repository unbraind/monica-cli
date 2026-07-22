import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const doctor = vi.hoisted(() => ({
  cacheStats: vi.fn(),
  connection: vi.fn(),
  settingsStats: vi.fn(),
}));
vi.mock('../src/utils/settings', () => ({
  GLOBAL_SETTINGS_PATH: '/private/settings.json',
  getSettingsStats: doctor.settingsStats,
}));
vi.mock('../src/utils/capability-cache', () => ({
  getCapabilityCachePath: () => '/private/cache.json',
  getCapabilityCacheStats: doctor.cacheStats,
}));
vi.mock('../src/commands/config-connection', () => ({
  verifyConfigConnection: doctor.connection,
}));

import { runConfigDoctor } from '../src/commands/config-doctor';

describe('configuration doctor edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS;
  });
  afterEach(() => {
    delete process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS;
    vi.restoreAllMocks();
  });

  it('warns for open settings, absent cache, disabled safety, and failed connection', async () => {
    doctor.settingsStats.mockReturnValue({ mode: 0o100644 });
    doctor.cacheStats.mockReturnValue(null);
    doctor.connection.mockRejectedValue(new Error('offline'));
    const result = await runConfigDoctor({ apiUrl: 'https://example.test/api', apiKey: 'key' });
    expect(result.ok).toBe(false);
    expect(result.summary).toEqual({ pass: 0, warn: 3, fail: 1 });
    const connection = (result.checks as Array<Record<string, unknown>>)
      .find((check) => check.id === 'connection');
    expect(connection?.details).toMatchObject({ diagnostic: null });
  });

  it('adds a typed diagnosis for the Monica Cloudflare proxy loader failure', async () => {
    doctor.settingsStats.mockReturnValue({ mode: 0o100600 });
    doctor.cacheStats.mockReturnValue(null);
    doctor.connection.mockRejectedValue(new Error('Failed to load trust proxies from Cloudflare server.'));
    const result = await runConfigDoctor({
      apiUrl: 'https://example.test/api', apiKey: 'key', readOnlyMode: true,
    });
    const connection = (result.checks as Array<Record<string, unknown>>)
      .find((check) => check.id === 'connection');
    expect(connection?.details).toMatchObject({
      diagnostic: {
        code: 'monica_cloudflare_trust_proxy_fetch_failed',
        retryable: false,
      },
    });
  });

  it('fails the settings check when stats disappear after configuration loads', async () => {
    doctor.settingsStats.mockReturnValue(null);
    doctor.cacheStats.mockReturnValue(null);
    doctor.connection.mockResolvedValue({ data: {} });
    const result = await runConfigDoctor({ apiUrl: 'https://example.test/api', apiKey: 'key' });
    expect(result.summary).toMatchObject({ fail: 1 });
  });

  it('reports fresh private state and nullable user identity', async () => {
    doctor.settingsStats.mockReturnValue({ mode: 0o100600 });
    doctor.cacheStats.mockReturnValue({ mtimeMs: Date.now(), mtime: new Date() });
    doctor.connection.mockResolvedValue({ data: {} });
    const result = await runConfigDoctor({
      apiUrl: 'https://example.test/api', apiKey: 'key', readOnlyMode: true,
    });
    expect(result.ok).toBe(true);
    expect(result.summary).toEqual({ pass: 4, warn: 0, fail: 0 });
  });

  it('marks caches stale for zero TTL and accepts invalid TTL as the default', async () => {
    doctor.settingsStats.mockReturnValue({ mode: 0o100600 });
    doctor.cacheStats.mockReturnValue({ mtimeMs: 0, mtime: new Date(0) });
    doctor.connection.mockResolvedValue({ data: { id: 1, email: 'u@example.test' } });
    process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS = '0';
    let result = await runConfigDoctor({ apiUrl: 'https://example.test/api', apiKey: 'key' });
    expect(result.summary).toMatchObject({ warn: 2 });
    process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS = 'invalid';
    result = await runConfigDoctor({ apiUrl: 'https://example.test/api', apiKey: 'key' });
    expect(result.summary).toMatchObject({ warn: 2 });
  });

  it.each([
    [{ apiKey: 'key' }, ['apiUrl']],
    [{ apiUrl: 'https://example.test/api' }, ['apiKey']],
    [{}, ['apiUrl', 'apiKey']],
  ])('identifies each missing credential', async (settings, missing) => {
    doctor.settingsStats.mockReturnValue({ mode: 0o100600 });
    doctor.cacheStats.mockReturnValue(null);
    const result = await runConfigDoctor(settings);
    const check = (result.checks as Array<Record<string, unknown>>)
      .find((candidate) => candidate.id === 'connection');
    expect((check?.details as Record<string, unknown>).missing).toEqual(missing);
  });
});
