import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import * as capabilityCache from '../src/utils/capability-cache';
import { createInfoCommand } from '../src/commands/info';

vi.mock('../src/utils/capability-cache', () => ({
  loadCachedCapabilityReport: vi.fn(() => null),
  saveCapabilityReport: vi.fn(),
}));

describe('info instance-profile command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let loadCacheMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED_INSTANCE_PROFILE');
    loadCacheMock = capabilityCache.loadCachedCapabilityReport as unknown as ReturnType<typeof vi.fn>;
    loadCacheMock.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints consolidated instance profile payload without api key leakage', async () => {
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
      apiKey: 'super-secret-token',
      readOnlyMode: true,
    } as never);

    const cmd = createInfoCommand();
    await cmd.parseAsync(['instance-profile', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.instance).toEqual({
      apiUrl: 'http://instance.local/api',
      readOnlyMode: true,
    });
    expect((payload.capabilities as Record<string, unknown>).source).toBe('live');
    expect((payload.supportedCommands as { total: number }).total).toBe(2);
    expect((payload.unsupportedCommands as { total: number }).total).toBe(1);
    expect(JSON.stringify(payload)).not.toContain('super-secret-token');
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_INSTANCE_PROFILE');
  });
});
