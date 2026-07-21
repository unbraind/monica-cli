import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  MonicaApiError: class MonicaApiError extends Error {
    public readonly errorCode: number;
    public readonly statusCode: number;
    
    constructor(message: string, errorCode: number, statusCode: number) {
      super(message);
      this.errorCode = errorCode;
      this.statusCode = statusCode;
    }
  },
}));

import * as client from '../src/api/client';
import { probeApiCapabilities, formatCapabilityHints, getCapabilityState, getSupportedCommands } from '../src/api/capabilities';

describe('capabilities API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks probes as supported when endpoints respond', async () => {
    const mockGet = client.get as unknown as { mockResolvedValue: (value: unknown) => void };
    mockGet.mockResolvedValue({});
    const report = await probeApiCapabilities();

    expect(report.summary.total).toBeGreaterThan(0);
    expect(report.summary.unsupported).toBe(0);
    expect(report.probes.every((probe) => probe.supported)).toBe(true);
    expect(report.probes.some((probe) => probe.key === 'tags')).toBe(true);
    expect(report.probes.some((probe) => probe.key === 'user')).toBe(true);
    expect(report.probes.some((probe) => probe.key === 'relationships')).toBe(true);
    expect(report.probes.some((probe) => probe.key === 'relationshipTypeGroups')).toBe(true);
  });

  it('marks probes as unsupported when endpoint returns MonicaApiError data', async () => {
    const mockGet = client.get as unknown as { mockRejectedValue: (value: unknown) => void };
    mockGet.mockRejectedValue({ statusCode: 404, message: 'Not Found' });
    const report = await probeApiCapabilities();
    const firstProbe = report.probes[0];

    expect(firstProbe.supported).toBe(false);
    expect(firstProbe.statusCode).toBe(404);
    expect(firstProbe.message).toBe('Not Found');
  });

  it('formats hints for unsupported probes', async () => {
    const mockGet = client.get as unknown as { mockRejectedValue: (value: unknown) => void };
    mockGet.mockRejectedValue({ statusCode: 404, message: 'Not Found' });
    const report = await probeApiCapabilities();
    const hints = formatCapabilityHints(report);

    expect(hints.length).toBe(report.summary.unsupported);
    expect(hints[0]).toContain('HTTP 404');
  });

  it('separates systemic failures from unsupported endpoints', async () => {
    const mockGet = client.get as unknown as { mockRejectedValue: (value: unknown) => void };
    mockGet.mockRejectedValue({ statusCode: 500, message: 'Server failure' });
    const report = await probeApiCapabilities();

    expect(report.summary.supported).toBe(0);
    expect(report.summary.unsupported).toBe(0);
    expect(report.summary.unavailable).toBe(report.summary.total);
    expect(report.summary.healthy).toBe(false);
    expect(report.probes.every((probe) => probe.state === 'unavailable')).toBe(true);
    expect(formatCapabilityHints(report)[0]).toContain('endpoint support is unknown');
  });

  it('treats known compatibility fallbacks as supported when primary endpoint is unavailable', async () => {
    const mockGet = client.get as unknown as { mockImplementation: (value: (endpoint: string) => Promise<unknown>) => void };
    mockGet.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/groups') || endpoint.startsWith('/contactfields') || endpoint.startsWith('/petcategories')) {
        return Promise.reject({ statusCode: 404, message: 'Not Found' });
      }
      return Promise.resolve({});
    });

    const report = await probeApiCapabilities();
    const groups = report.probes.find((probe) => probe.key === 'groups');
    const contactFields = report.probes.find((probe) => probe.key === 'contactFields');
    const petCategories = report.probes.find((probe) => probe.key === 'petCategories');

    expect(groups?.supported).toBe(true);
    expect(groups?.nativeSupported).toBe(false);
    expect(groups?.fallbackSupported).toBe(true);
    expect(contactFields?.supported).toBe(true);
    expect(contactFields?.fallbackSupported).toBe(true);
    expect(petCategories?.supported).toBe(true);
    expect(petCategories?.fallbackSupported).toBe(true);
  });

  it('returns sorted supported command hints', () => {
    const commands = getSupportedCommands({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 3, supported: 2, unsupported: 1 },
      probes: [
        { key: 'a', command: 'tasks list', endpoint: '/tasks', supported: true, statusCode: 200, message: 'OK' },
        { key: 'b', command: 'contacts list', endpoint: '/contacts', supported: true, statusCode: 200, message: 'OK' },
        { key: 'c', command: 'groups list', endpoint: '/groups', supported: false, statusCode: 404, message: 'Not Found' },
      ],
    });

    expect(commands).toEqual(['contacts list', 'tasks list']);
  });

  it('classifies legacy states and formats healthy or status-less hints', () => {
    expect(getCapabilityState({ supported: false, statusCode: 405 } as never)).toBe('unsupported');
    expect(getCapabilityState({ supported: false, statusCode: 500 } as never)).toBe('unavailable');
    expect(formatCapabilityHints({
      generatedAt: '', summary: { total: 0, supported: 0, unsupported: 0 }, probes: [],
    })).toEqual(['All probed Monica API resources are available on this instance.']);
    const hints = formatCapabilityHints({
      generatedAt: '', summary: { total: 2, supported: 0, unsupported: 1 }, probes: [
        { key: 'a', command: 'a', endpoint: '/a', supported: null, state: 'unavailable', statusCode: 0, message: '' },
        { key: 'b', command: 'b', endpoint: '/b', supported: false, statusCode: 404, message: 'missing' },
      ],
    });
    expect(hints[0]).toContain('request failed');
    expect(hints[1]).toContain('HTTP 404');
  });

  it('normalizes unknown thrown values during probes', async () => {
    const mockGet = client.get as unknown as ReturnType<typeof vi.fn>;
    mockGet.mockRejectedValue({});
    const report = await probeApiCapabilities();
    expect(report.probes[0]).toMatchObject({ statusCode: 0, message: 'Unknown error', state: 'unavailable' });
  });
});
