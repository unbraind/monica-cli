import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as fmt from '../src/formatters';
import * as infoCapabilities from '../src/commands/info-capabilities';
import { createApiResearchCommand } from '../src/commands/api-research';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('api-research coverage command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockImplementation((value) => JSON.stringify(value));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports mapping coverage and unmapped follow-up command', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: { methods: { list: { method: 'GET', path: '/contacts' } } },
        customResourceX: { methods: { list: { method: 'GET', path: '/custom-resource-x' } } },
      },
    }));

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'coverage'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.totals).toEqual({ resources: 2, endpoints: 2 });
    expect(payload.cliMapping).toEqual({
      mappedResources: 1,
      unmappedResources: 1,
      mappedPercent: 50,
      unmappedResourceNames: ['customResourceX'],
    });
    expect(payload.instanceSupport).toBeUndefined();
    expect(payload.readOnlyActionPlan).toEqual({
      count: 1,
      commands: ['monica --json info supported-commands'],
    });
    expect(payload.recommendedNextCommands).toEqual([
      'monica --json api-research summary --unmapped-only',
    ]);
  });

  it('reports live instance command/resource support percentages', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: { methods: { list: { method: 'GET', path: '/contacts' } } },
        groups: { methods: { list: { method: 'GET', path: '/groups' } } },
      },
    }));

    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-04T00:00:00.000Z',
        summary: { total: 2, supported: 1, unsupported: 1 },
        probes: [
          { key: 'contacts', command: 'contacts list', endpoint: '/contacts?limit=1', supported: true, statusCode: 200, message: 'OK' },
          { key: 'groups', command: 'groups list', endpoint: '/groups?limit=1', supported: false, statusCode: 404, message: 'HTTP 404' },
        ],
      },
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'coverage', '--instance-aware'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.instanceCapabilities.enabled).toBe(true);
    expect(payload.instanceSupport).toEqual({
      supportedResources: 1,
      unsupportedResources: 1,
      supportedPercent: 50,
      unsupported: [
        {
          resource: 'groups',
          cliCommand: 'groups',
          statusCode: 404,
          endpoint: '/groups?limit=1',
          message: 'HTTP 404',
        },
      ],
    });
    expect(payload.commandSupport).toEqual({
      total: 2,
      supported: 1,
      unsupported: 1,
      supportedPercent: 50,
      supportedCommands: ['contacts'],
      unsupportedCommands: ['groups'],
    });
    expect(payload.readOnlyActionPlan).toEqual({
      count: 2,
      commands: [
        'monica --json contacts list --limit 100',
        'monica --json tags list --limit 100',
      ],
    });
    expect(payload.recommendedNextCommands).toEqual([
      'monica --json api-research backlog --instance-aware --unsupported-only',
      'monica --json api-research actions --instance-aware --read-only-only',
    ]);
  });

  it('adds gate metadata and does not fail when thresholds are satisfied', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: { methods: { list: { method: 'GET', path: '/contacts' } } },
      },
    }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-04T00:00:00.000Z',
        summary: { total: 1, supported: 1, unsupported: 0 },
        probes: [
          { key: 'contacts', command: 'contacts list', endpoint: '/contacts?limit=1', supported: true, statusCode: 200, message: 'OK' },
        ],
      },
    });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const cmd = createApiResearchCommand();
    await cmd.parseAsync([
      '--format',
      'json',
      'coverage',
      '--instance-aware',
      '--fail-on-unmapped',
      '--fail-on-unsupported',
    ], { from: 'user' });

    expect(exitSpy).not.toHaveBeenCalled();
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.gate).toEqual({
      enabled: true,
      failed: false,
      failOnUnmapped: true,
      failOnUnsupported: true,
      reasons: [],
    });
  });

  it('exits with code 2 when fail-on-unmapped gate is enabled and unmapped resources exist', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: { methods: { list: { method: 'GET', path: '/contacts' } } },
        customResourceX: { methods: { list: { method: 'GET', path: '/custom-resource-x' } } },
      },
    }));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const cmd = createApiResearchCommand();
    await cmd.parseAsync([
      '--format',
      'json',
      'coverage',
      '--fail-on-unmapped',
    ], { from: 'user' });

    expect(errorSpy).not.toHaveBeenCalled();
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.gate.failed).toBe(true);
    expect(payload.gate.reasons).toEqual(['unmapped resources detected: 1']);
    expect(exitSpy).toHaveBeenCalledWith(2);
  });
});
