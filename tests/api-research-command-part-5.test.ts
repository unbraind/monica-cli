import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as fmt from '../src/formatters';
import * as infoCapabilities from '../src/commands/info-capabilities';
import * as client from '../src/api/client';
import { createApiResearchCommand } from '../src/commands/api-research';
import { buildCoveragePayload, buildSummaryPayload } from '../src/commands/api-research-summary';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));
vi.mock('../src/api/client', () => ({
  get: vi.fn(),
}));

describe('api-research command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockImplementation((value) => JSON.stringify(value));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds snapshot payload with summary, backlog, and probe sections', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const getMock = client.get as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: {
          methods: {
            list: { method: 'GET', path: '/contacts' },
          },
        },
        customResourceX: {
          methods: {
            list: { method: 'GET', path: '/custom-resource-x' },
          },
        },
      },
    }));
    getMock.mockResolvedValue({ data: [] });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'snapshot'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.summary.resources).toBe(2);
    expect(payload.backlog.backlog.total).toBe(1);
    expect(payload.backlog.items[0].type).toBe('missing-cli-mapping');
    expect(payload.probe.summary.total).toBe(2);
    expect(getMock).toHaveBeenCalledWith('/contacts');
    expect(getMock).toHaveBeenCalledWith('/custom-resource-x');
  });

  it('keeps capability-only unsupported backlog items even when supported-only summary filter is set', async () => {
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
    await cmd.parseAsync(['--format', 'json', 'backlog', '--instance-aware', '--supported-only'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.backlog.total).toBe(1);
    expect(payload.items[0]).toMatchObject({
      resource: 'groups',
      type: 'instance-unsupported',
      priority: 'medium',
    });
  });

  it('fails backlog support filters without instance-aware mode', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: { methods: { list: { method: 'GET', path: '/contacts' } } },
      },
    }));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as typeof process.exit);

    const cmd = createApiResearchCommand();
    await expect(
      cmd.parseAsync(['--format', 'json', 'backlog', '--unsupported-only'], { from: 'user' }),
    ).rejects.toThrow('process.exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('applies mapped-only filtering to snapshot summary and backlog sections', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const getMock = client.get as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: { methods: { list: { method: 'GET', path: '/contacts' } } },
        customResourceX: { methods: { list: { method: 'GET', path: '/custom-resource-x' } } },
      },
    }));
    getMock.mockResolvedValue({ data: [] });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'snapshot', '--mapped-only'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.summary.resources).toBe(1);
    expect(payload.summary.resources).toHaveLength(1);
    expect(payload.summary.resources[0].resource).toBe('contacts');
    expect(payload.backlog.backlog.total).toBe(0);
    expect(payload.backlog.items).toEqual([]);
    expect(payload.probe.summary.total).toBe(2);
  });

  it('sorts multi-resource mapping and instance-support collections deterministically', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const resources = ['notes', 'groups', 'contacts', 'activities', 'customZulu', 'customAlpha'];
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: Object.fromEntries(resources.map((resource) => [resource, {
        methods: { list: { method: 'GET', path: `/${resource}` } },
      }])),
    }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-07-21T00:00:00.000Z',
        summary: { total: 6, supported: 3, unsupported: 3 },
        probes: resources.map((resource, index) => ({
          key: resource,
          command: resource,
          endpoint: `/${resource}`,
          supported: index >= 3,
          statusCode: index >= 3 ? 200 : 404,
          message: index >= 3 ? 'OK' : 'HTTP 404',
        })),
      },
    });

    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'summary', '--instance-aware',
    ], { from: 'user' });
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.cliCoverage.unmappedResourceNames).toEqual(['customAlpha', 'customZulu']);
    expect(payload.supportedResourcesByInstance).toEqual(['activities', 'customAlpha', 'customZulu']);
    expect(payload.unsupportedResourcesByInstance.map((item: { resource: string }) => item.resource))
      .toEqual(['contacts', 'groups', 'notes']);
    expect(payload.commandSupport.supportedCommands).toEqual(['activities', 'customalpha', 'customzulu']);
    expect(payload.commandSupport.unsupportedCommands).toEqual(['contacts', 'groups', 'notes']);
  });

  it('uses fatal output handling for actions and snapshot failures', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({ endpoints: {} }));
    vi.spyOn(fmt, 'formatOutput').mockImplementation(() => { throw new Error('render failed'); });
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as never);
    for (const name of ['coverage', 'actions', 'snapshot']) {
      await expect(createApiResearchCommand().parseAsync([
        '--format', 'json', name,
      ], { from: 'user' })).rejects.toThrow('exit');
    }
    expect(exit).toHaveBeenCalledTimes(3);
  });

  it('fails the coverage gate for instance-unsupported commands', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: { groups: { methods: { list: { method: 'GET', path: '/groups' } } } },
    }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live', report: {
        generatedAt: '', summary: { total: 1, supported: 0, unsupported: 1 }, probes: [
          { key: 'groups', command: 'groups list', endpoint: '/groups', supported: false, statusCode: 404, message: 'missing' },
        ],
      },
    });
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'coverage', '--instance-aware', '--fail-on-unsupported',
    ], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(2);
  });

  it('ignores unmatched and unavailable probes in instance mappings', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: { contacts: { methods: { list: { method: 'GET', path: '/contacts' } } } },
    }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live', report: {
        generatedAt: '', summary: { total: 2, supported: 0, unsupported: 0, unavailable: 1 }, probes: [
          { key: 'contacts', command: 'contacts', endpoint: '/contacts', supported: null, state: 'unavailable', statusCode: 500, message: 'offline' },
          { key: 'other', command: 'other', endpoint: '/other', supported: true, statusCode: 200, message: 'OK' },
        ],
      },
    });
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'summary', '--instance-aware',
    ], { from: 'user' });
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.resources[0].instanceSupport).toBeUndefined();
    expect(payload.commandSupport.supportedCommands).toEqual(['other']);
  });
});
