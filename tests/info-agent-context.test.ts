import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import * as capabilityCache from '../src/utils/capability-cache';
import { createInfoCommand } from '../src/commands/info';

vi.mock('../src/utils/capability-cache', () => ({
  loadCachedCapabilityReport: vi.fn(() => null),
  saveCapabilityReport: vi.fn(),
}));

describe('info agent-context command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let loadCacheMock: ReturnType<typeof vi.fn>;
  let saveCacheMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED_CONTEXT');
    loadCacheMock = capabilityCache.loadCachedCapabilityReport as unknown as ReturnType<typeof vi.fn>;
    saveCacheMock = capabilityCache.saveCapabilityReport as unknown as ReturnType<typeof vi.fn>;
    loadCacheMock.mockReturnValue(null);
    saveCacheMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints sanitized context with capabilities and supported commands', async () => {
    vi.spyOn(api, 'probeApiCapabilities').mockResolvedValue({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 3, supported: 2, unsupported: 1 },
      probes: [
        { key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true, statusCode: 200, message: 'OK' },
        { key: 'groups', command: 'groups list', endpoint: '/groups', supported: false, statusCode: 404, message: 'HTTP 404' },
        { key: 'activities', command: 'activities list', endpoint: '/activities', supported: true, statusCode: 200, message: 'OK' },
      ],
    });
    vi.spyOn(api, 'getSupportedCommands').mockReturnValue(['activities list', 'contacts list']);
    vi.spyOn(api, 'getConfig').mockReturnValue({
      apiUrl: 'http://instance.local/api',
      apiKey: 'secret-token',
      readOnlyMode: true,
    } as never);

    const cmd = createInfoCommand();
    await cmd.parseAsync(['agent-context', '--format', 'json'], { from: 'user' });

    expect(fmt.formatOutput).toHaveBeenCalled();
    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.instance).toEqual({
      apiUrl: 'http://instance.local/api',
      readOnlyMode: true,
    });
    expect(payload.defaults).toEqual({
      outputFormat: 'toon',
      safeGlobalFlags: ['--json', '--yaml', '--yml', '--table', '--md', '--markdown', '--raw', '--request-timeout-ms'],
    });
    expect(payload.capabilities).toMatchObject({
      source: 'live',
      total: 3,
      supported: 2,
      unsupported: 1,
    });
    expect(JSON.stringify(payload)).not.toContain('secret-token');
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_CONTEXT');
  });

  it('accepts markdown alias output format', async () => {
    vi.spyOn(api, 'probeApiCapabilities').mockResolvedValue({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 1, supported: 1, unsupported: 0 },
      probes: [
        { key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true, statusCode: 200, message: 'OK' },
      ],
    });
    vi.spyOn(api, 'getSupportedCommands').mockReturnValue(['contacts list']);
    vi.spyOn(api, 'getConfig').mockReturnValue({
      apiUrl: 'http://instance.local/api',
      apiKey: 'secret-token',
      readOnlyMode: true,
    } as never);

    const cmd = createInfoCommand();
    await cmd.parseAsync(['agent-context', '--format', 'markdown'], { from: 'user' });

    const calls = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(calls.at(-1)?.[1]).toBe('md');
  });

  it('uses cached capability report when available', async () => {
    const cachedReport = {
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 1, supported: 1, unsupported: 0 },
      probes: [
        { key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true, statusCode: 200, message: 'OK' },
      ],
    };

    loadCacheMock.mockReturnValue(cachedReport);
    const probeSpy = vi.spyOn(api, 'probeApiCapabilities');
    vi.spyOn(api, 'getSupportedCommands').mockReturnValue(['contacts list']);
    vi.spyOn(api, 'getConfig').mockReturnValue({
      apiUrl: 'http://instance.local/api',
      apiKey: 'secret-token',
      readOnlyMode: true,
    } as never);

    const cmd = createInfoCommand();
    await cmd.parseAsync(['agent-context', '--format', 'json'], { from: 'user' });

    expect(probeSpy).not.toHaveBeenCalled();
    expect(saveCacheMock).not.toHaveBeenCalled();
    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.capabilities).toMatchObject({ source: 'cache' });
  });
});
