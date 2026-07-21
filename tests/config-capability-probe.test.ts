import { afterEach, describe, expect, it, vi } from 'vitest';
import * as capabilities from '../src/api/capabilities';
import * as client from '../src/api/client';
import { runSetupCapabilityProbe } from '../src/commands/config-capability-probe';
import * as cache from '../src/utils/capability-cache';

describe('setup capability probe', () => {
  afterEach(() => vi.restoreAllMocks());

  it('skips disabled and incomplete setup probes', async () => {
    await expect(runSetupCapabilityProbe({}, { enabled: false })).resolves.toEqual({
      attempted: false, cached: false,
    });
    await expect(runSetupCapabilityProbe({ apiUrl: 'https://example.test' }, { enabled: true }))
      .resolves.toEqual({
        attempted: false, cached: false,
        error: 'Capability probe skipped: missing API URL or API key.',
      });
  });

  it('configures the client, probes, and caches a successful report', async () => {
    const report = {
      generatedAt: '2026-07-21T00:00:00.000Z',
      summary: { total: 1, supported: 1, unsupported: 0 },
      probes: [],
    };
    const setConfig = vi.spyOn(client, 'setConfig').mockImplementation(() => undefined);
    vi.spyOn(capabilities, 'probeApiCapabilities').mockResolvedValue(report);
    const save = vi.spyOn(cache, 'saveCapabilityReport').mockImplementation(() => undefined);
    await expect(runSetupCapabilityProbe({
      apiUrl: 'https://example.test/api', apiKey: 'secret', userEmail: 'user@example.test',
      userPassword: 'password', readOnlyMode: true,
    }, { enabled: true })).resolves.toEqual({
      attempted: true, cached: true, summary: report.summary, generatedAt: report.generatedAt,
    });
    expect(setConfig).toHaveBeenCalledWith({
      apiUrl: 'https://example.test/api', apiKey: 'secret', userEmail: 'user@example.test',
      userPassword: 'password', readOnlyMode: true,
    });
    expect(save).toHaveBeenCalledWith(report);
  });

  it('returns a sanitized probe error', async () => {
    vi.spyOn(client, 'setConfig').mockImplementation(() => undefined);
    vi.spyOn(capabilities, 'probeApiCapabilities').mockRejectedValue(new Error('offline'));
    await expect(runSetupCapabilityProbe({
      apiUrl: 'https://example.test/api', apiKey: 'secret',
    }, { enabled: true })).resolves.toEqual({
      attempted: true, cached: false, error: 'offline',
    });
  });
});
