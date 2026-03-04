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
import { probeApiCapabilities, formatCapabilityHints, getSupportedCommands } from '../src/api/capabilities';

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
});
