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

  it('builds summary from api-reference document', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      version: '1.0.0',
      generated: '2026-03-03',
      baseUrl: 'https://example/api',
      endpoints: {
        activities: {
          description: 'Activities',
          methods: {
            list: { method: 'GET', path: '/activities' },
            get: { method: 'GET', path: '/activities/:id' },
            create: { method: 'POST', path: '/activities' },
          },
        },
        contacts: {
          description: 'Contacts',
          methods: {
            list: { method: 'GET', path: '/contacts' },
          },
        },
      },
    }));

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.sourceFormat).toBe('api-reference');
    expect(payload.summary.resources).toBe(2);
    expect(payload.summary.endpoints).toBe(4);
    expect(payload.summary.methodsByVerb.GET).toBe(3);
    expect(payload.summary.methodsByVerb.POST).toBe(1);
    expect(payload.cliCoverage).toEqual({
      mappedResources: 2,
      unmappedResources: 0,
      unmappedResourceNames: [],
    });
    expect(payload.resources[0].cliCommand).toBe('activities');
    expect(payload.resources[0].cliMapping).toBe('mapped');
    expect(payload.resources[1].cliCommand).toBe('contacts');
    expect(payload.resources[1].cliMapping).toBe('mapped');
  });

  it('supports resource filter and endpoint expansion', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        activityTypes: {
          description: 'Activity Types',
          methods: {
            list: { method: 'GET', path: '/activitytypes' },
          },
        },
        contacts: {
          description: 'Contacts',
          methods: {
            list: { method: 'GET', path: '/contacts' },
          },
        },
      },
    }));

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary', '--resource', 'activity', '--with-endpoints'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.resources).toBe(1);
    expect(payload.cliCoverage).toEqual({
      mappedResources: 1,
      unmappedResources: 0,
      unmappedResourceNames: [],
    });
    expect(payload.resources[0].resource).toBe('activityTypes');
    expect(payload.resources[0].cliCommand).toBe('activity-types');
    expect(payload.resources[0].cliMapping).toBe('mapped');
    expect(payload.resources[0].endpoints).toEqual([
      { key: 'list', method: 'GET', path: '/activitytypes' },
    ]);
  });

  it('normalizes sparse references and leaves unmatched capability probes unassigned', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({ endpoints: { custom: {} } }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'cache',
      report: {
        generatedAt: '2026-03-03T00:00:00.000Z',
        summary: { total: 1, supported: 1, unsupported: 0 },
        probes: [{
          key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true,
          statusCode: 200, message: 'OK',
        }],
      },
    });
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'summary', '--instance-aware', '--source', 'api-reference',
    ], { from: 'user' });
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.resources[0].instanceSupport).toBeUndefined();
    expect(payload.summary.endpoints).toBe(0);
    expect(payload.summary.methodsByVerb).toEqual({});
  });

  it('builds coverage defaults for an instance-aware sparse summary', () => {
    const payload = buildCoveragePayload({
      generatedAt: '', sourceFile: '', sourceFormat: 'api-reference',
      apiReference: { version: '', generated: '', baseUrl: '' },
      instanceCapabilities: { enabled: true },
      summary: { resources: 0, endpoints: 0, methodsByVerb: {} },
      cliCoverage: { mappedResources: 0, unmappedResources: 0, unmappedResourceNames: [] },
      resources: [],
    });
    expect(payload.instanceSupport).toEqual({
      supportedResources: 0, unsupportedResources: 0, supportedPercent: 0, unsupported: [],
    });
  });

  it('builds a summary when the selected document omits endpoints', async () => {
    (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue('{}');
    const payload = await buildSummaryPayload({}, new Command());
    expect(payload.summary).toEqual({ resources: 0, endpoints: 0, methodsByVerb: {} });
    (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify({
      endpoints: { sparse: { methods: { unknown: {} } } },
    }));
    expect((await buildSummaryPayload({ source: 'api' }, new Command())).summary.methodsByVerb)
      .toEqual({ UNKNOWN: 1 });
  });

  it('attaches live instance support when instance-aware is enabled', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        groups: {
          description: 'Groups',
          methods: {
            list: { method: 'GET', path: '/groups' },
          },
        },
      },
    }));

    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-03T00:00:00.000Z',
        summary: { total: 1, supported: 0, unsupported: 1 },
        probes: [
          {
            key: 'groups',
            command: 'groups list',
            endpoint: '/groups',
            supported: false,
            statusCode: 404,
            message: 'HTTP 404',
          },
        ],
      },
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary', '--instance-aware'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.instanceCapabilities.enabled).toBe(true);
    expect(payload.instanceCapabilities.source).toBe('live');
    expect(payload.resources[0].instanceSupport).toEqual({
      supportedOnInstance: false,
      state: 'unsupported',
      statusCode: 404,
      endpoint: '/groups',
      message: 'HTTP 404',
    });
    expect(payload.commandSupport).toEqual({
      total: 1,
      supported: 0,
      unsupported: 1,
      supportedCommands: [],
      unsupportedCommands: ['groups'],
    });
    expect(payload.supportedResourcesByInstance).toEqual([]);
    expect(payload.unsupportedResourcesByInstance).toEqual([
      {
        resource: 'groups',
        cliCommand: 'groups',
        statusCode: 404,
        endpoint: '/groups',
        message: 'HTTP 404',
      },
    ]);
  });

  it('maps relationship metadata and users resources to valid CLI command roots', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        relationshipTypes: {
          description: 'Relationship Types',
          methods: {
            list: { method: 'GET', path: '/relationshiptypes' },
          },
        },
        relationshipTypeGroups: {
          description: 'Relationship Type Groups',
          methods: {
            list: { method: 'GET', path: '/relationshiptypegroups' },
          },
        },
        users: {
          description: 'Users',
          methods: {
            getMe: { method: 'GET', path: '/me' },
          },
        },
      },
    }));

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    const byResource = new Map(payload.resources.map((resource: { resource: string; cliCommand: string }) => [resource.resource, resource.cliCommand]));
    expect(byResource.get('relationshipTypes')).toBe('relationships types');
    expect(byResource.get('relationshipTypeGroups')).toBe('relationships groups');
    expect(byResource.get('users')).toBe('user');
  });
});
