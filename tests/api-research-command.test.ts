import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as fmt from '../src/formatters';
import * as infoCapabilities from '../src/commands/info-capabilities';
import * as client from '../src/api/client';
import { createApiResearchCommand } from '../src/commands/api-research';

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

  it('maps capability probe subcommands to command roots for instance-aware summaries', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        relationships: {
          description: 'Relationships',
          methods: {
            list: { method: 'GET', path: '/contacts/:id/relationships' },
          },
        },
      },
    }));

    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-03T00:00:00.000Z',
        summary: { total: 1, supported: 1, unsupported: 0 },
        probes: [
          {
            key: 'relationships',
            command: 'relationships types',
            endpoint: '/relationshiptypes?limit=1',
            supported: true,
            statusCode: 200,
            message: 'OK',
          },
        ],
      },
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary', '--instance-aware'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.resources[0].instanceSupport).toEqual({
      supportedOnInstance: true,
      statusCode: 200,
      endpoint: '/relationshiptypes?limit=1',
      message: 'OK',
    });
    expect(payload.commandSupport.supportedCommands).toEqual(['relationships']);
  });

  it('prefers exact capability probe matches before command-root fallback', async () => {
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
      },
    }));

    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-04T00:00:00.000Z',
        summary: { total: 2, supported: 1, unsupported: 1 },
        probes: [
          {
            key: 'relationships',
            command: 'relationships types',
            endpoint: '/relationshiptypes?limit=1',
            supported: true,
            statusCode: 200,
            message: 'OK',
          },
          {
            key: 'relationshipTypeGroups',
            command: 'relationships groups',
            endpoint: '/relationshiptypegroups?limit=1',
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
    const byResource = new Map(payload.resources.map((resource: { resource: string; instanceSupport: unknown }) => [resource.resource, resource.instanceSupport]));
    expect(byResource.get('relationshipTypes')).toEqual({
      supportedOnInstance: true,
      statusCode: 200,
      endpoint: '/relationshiptypes?limit=1',
      message: 'OK',
    });
    expect(byResource.get('relationshipTypeGroups')).toEqual({
      supportedOnInstance: false,
      statusCode: 404,
      endpoint: '/relationshiptypegroups?limit=1',
      message: 'HTTP 404',
    });
    expect(payload.commandSupport).toEqual({
      total: 1,
      supported: 1,
      unsupported: 0,
      supportedCommands: ['relationships'],
      unsupportedCommands: [],
    });
  });

  it('filters summary to only unsupported resources with instance metadata', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: {
          description: 'Contacts',
          methods: { list: { method: 'GET', path: '/contacts' } },
        },
        groups: {
          description: 'Groups',
          methods: { list: { method: 'GET', path: '/groups' } },
        },
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
    await cmd.parseAsync(['--format', 'json', 'summary', '--instance-aware', '--unsupported-only'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.resources).toBe(1);
    expect(payload.resources).toHaveLength(1);
    expect(payload.resources[0].resource).toBe('groups');
    expect(payload.resources[0].instanceSupport.supportedOnInstance).toBe(false);
    expect(payload.supportedResourcesByInstance).toEqual([]);
    expect(payload.unsupportedResourcesByInstance).toEqual([
      {
        resource: 'groups',
        cliCommand: 'groups',
        statusCode: 404,
        endpoint: '/groups?limit=1',
        message: 'HTTP 404',
      },
    ]);
  });

  it('omits instance support resource lists when instance-aware is disabled', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: {
          methods: {
            list: { method: 'GET', path: '/contacts' },
          },
        },
      },
    }));

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.supportedResourcesByInstance).toBeUndefined();
    expect(payload.unsupportedResourcesByInstance).toBeUndefined();
  });

  it('fails filtering flags without instance-aware summary', async () => {
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
      cmd.parseAsync(['--format', 'json', 'summary', '--unsupported-only'], { from: 'user' }),
    ).rejects.toThrow('process.exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('supports monica reference schema when source is monica', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      version: 'v1',
      baseUrl: 'https://example/api',
      resources: {
        relationshipTypeGroups: {
          endpoints: [
            { method: 'GET', path: '/relationshiptypegroups' },
          ],
        },
        users: {
          endpoints: [
            { method: 'GET', path: '/me' },
          ],
        },
      },
    }));

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary', '--source', 'monica', '--with-endpoints'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.sourceFormat).toBe('monica-api-reference');
    expect(payload.summary.resources).toBe(2);
    const byResource = new Map(payload.resources.map((resource: { resource: string; cliCommand: string; endpoints: Array<{ method: string; path: string }> }) => [resource.resource, resource]));
    expect(byResource.get('relationshipTypeGroups')?.cliCommand).toBe('relationships groups');
    expect(byResource.get('relationshipTypeGroups')?.endpoints).toEqual([
      { key: 'get_1', method: 'GET', path: '/relationshiptypegroups' },
    ]);
    expect(byResource.get('users')?.cliCommand).toBe('user');
  });

  it('reports unmapped resources for agent planning', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
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

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.cliCoverage).toEqual({
      mappedResources: 1,
      unmappedResources: 1,
      unmappedResourceNames: ['customResourceX'],
    });
    const byResource = new Map(payload.resources.map((resource: { resource: string; cliMapping: string }) => [resource.resource, resource.cliMapping]));
    expect(byResource.get('contacts')).toBe('mapped');
    expect(byResource.get('customResourceX')).toBe('unmapped');
  });

  it('filters summary to only unmapped resources', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
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

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'summary', '--unmapped-only'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.resources).toBe(1);
    expect(payload.cliCoverage).toEqual({
      mappedResources: 0,
      unmappedResources: 1,
      unmappedResourceNames: ['customResourceX'],
    });
    expect(payload.resources).toHaveLength(1);
    expect(payload.resources[0].resource).toBe('customResourceX');
    expect(payload.resources[0].cliMapping).toBe('unmapped');
  });

  it('fails when mapped-only and unmapped-only are both enabled', async () => {
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
      cmd.parseAsync(['--format', 'json', 'summary', '--mapped-only', '--unmapped-only'], { from: 'user' }),
    ).rejects.toThrow('process.exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('builds backlog with missing CLI mapping items', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
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

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'backlog'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.backlog).toEqual({
      total: 1,
      high: 1,
      medium: 0,
    });
    expect(payload.items).toEqual([
      {
        resource: 'customResourceX',
        cliCommand: 'customResourceX',
        type: 'missing-cli-mapping',
        priority: 'high',
        reason: 'Resource is present in API reference but lacks a direct CLI command mapping.',
        recommendedAction: 'List all unmapped resources before implementing new command families. Suggested command: monica --json api-research summary --unmapped-only',
        agentActions: [
          {
            command: 'monica --json api-research summary --unmapped-only',
            reason: 'List all unmapped resources before implementing new command families.',
            safety: 'planning',
          },
          {
            command: 'monica --json info supported-commands',
            reason: 'Check whether an existing command root already covers the resource indirectly.',
            safety: 'read-only',
          },
        ],
      },
    ]);
  });

  it('builds flattened actions payload from backlog guidance', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
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

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'actions'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary).toEqual({
      actions: 2,
      readOnlyActions: 1,
      planningActions: 1,
      uniqueCommands: 2,
    });
    expect(payload.actions).toEqual([
      {
        resource: 'customResourceX',
        cliCommand: 'customResourceX',
        type: 'missing-cli-mapping',
        priority: 'high',
        command: 'monica --json api-research summary --unmapped-only',
        commandShape: {
          executable: 'monica',
          root: 'api-research',
          subcommand: 'summary',
          args: ['--json', 'api-research', 'summary', '--unmapped-only'],
          options: ['--json', '--unmapped-only'],
        },
        reason: 'List all unmapped resources before implementing new command families.',
        safety: 'planning',
      },
      {
        resource: 'customResourceX',
        cliCommand: 'customResourceX',
        type: 'missing-cli-mapping',
        priority: 'high',
        command: 'monica --json info supported-commands',
        commandShape: {
          executable: 'monica',
          root: 'info',
          subcommand: 'supported-commands',
          args: ['--json', 'info', 'supported-commands'],
          options: ['--json'],
        },
        reason: 'Check whether an existing command root already covers the resource indirectly.',
        safety: 'read-only',
      },
    ]);
    expect(payload.commands).toEqual([
      'monica --json api-research summary --unmapped-only',
      'monica --json info supported-commands',
    ]);
  });

  it('filters actions payload to read-only commands when requested', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
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

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'actions', '--read-only-only'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary).toEqual({
      actions: 1,
      readOnlyActions: 1,
      planningActions: 0,
      uniqueCommands: 1,
    });
    expect(payload.actions).toEqual([
      expect.objectContaining({
        command: 'monica --json info supported-commands',
        commandShape: {
          executable: 'monica',
          root: 'info',
          subcommand: 'supported-commands',
          args: ['--json', 'info', 'supported-commands'],
          options: ['--json'],
        },
        safety: 'read-only',
      }),
    ]);
    expect(payload.commands).toEqual(['monica --json info supported-commands']);
  });

  it('builds backlog with instance unsupported items when instance-aware', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        groups: {
          methods: {
            list: { method: 'GET', path: '/groups' },
          },
        },
      },
    }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-04T00:00:00.000Z',
        summary: { total: 1, supported: 0, unsupported: 1 },
        probes: [
          {
            key: 'groups',
            command: 'groups list',
            endpoint: '/groups?limit=1',
            supported: false,
            statusCode: 404,
            message: 'HTTP 404',
          },
        ],
      },
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'backlog', '--instance-aware'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.backlog).toEqual({
      total: 1,
      high: 0,
      medium: 1,
    });
    expect(payload.items[0]).toMatchObject({
      resource: 'groups',
      cliCommand: 'groups',
      type: 'instance-unsupported',
      priority: 'medium',
      recommendedAction: 'Tags are commonly available and can substitute grouping for read-only segmentation. Suggested command: monica --json tags list --limit 100',
      agentActions: [
        {
          command: 'monica --json tags list --limit 100',
          reason: 'Tags are commonly available and can substitute grouping for read-only segmentation.',
          safety: 'read-only',
        },
        {
          command: 'monica --json contacts list --limit 100',
          reason: 'Direct contact listing is a safe fallback when groups endpoints are unavailable.',
          safety: 'read-only',
        },
      ],
    });
  });

  it('adds capability-only unsupported command families to backlog when absent from reference source', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      resources: {
        groups: {
          endpoints: [{ method: 'GET', path: '/groups' }],
        },
      },
    }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-04T00:00:00.000Z',
        summary: { total: 2, supported: 0, unsupported: 2 },
        probes: [
          {
            key: 'groups',
            command: 'groups list',
            endpoint: '/groups?limit=1',
            supported: false,
            statusCode: 404,
            message: 'HTTP 404',
          },
          {
            key: 'petCategories',
            command: 'pet-categories list',
            endpoint: '/petcategories?limit=1',
            supported: false,
            statusCode: 404,
            message: 'HTTP 404',
          },
        ],
      },
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'backlog', '--source', 'monica', '--instance-aware'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.backlog).toEqual({
      total: 2,
      high: 0,
      medium: 2,
    });
    expect(payload.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        resource: 'groups',
        cliCommand: 'groups',
        type: 'instance-unsupported',
        recommendedAction: 'Tags are commonly available and can substitute grouping for read-only segmentation. Suggested command: monica --json tags list --limit 100',
        agentActions: [
          {
            command: 'monica --json tags list --limit 100',
            reason: 'Tags are commonly available and can substitute grouping for read-only segmentation.',
            safety: 'read-only',
          },
          {
            command: 'monica --json contacts list --limit 100',
            reason: 'Direct contact listing is a safe fallback when groups endpoints are unavailable.',
            safety: 'read-only',
          },
        ],
      }),
      expect.objectContaining({
        resource: 'pet-categories',
        cliCommand: 'pet-categories',
        type: 'instance-unsupported',
        reason: 'Command family is unsupported on this instance but is not represented in the selected API reference source.',
        recommendedAction: 'Fallback scan mode derives categories from pets when /petcategories is missing. Suggested command: monica --json pet-categories list --scan-pets --pet-max-pages 2',
        agentActions: [
          {
            command: 'monica --json pet-categories list --scan-pets --pet-max-pages 2',
            reason: 'Fallback scan mode derives categories from pets when /petcategories is missing.',
            safety: 'read-only',
          },
          {
            command: 'monica --json pets list --limit 100 --max-pages 2',
            reason: 'Direct pet listing provides category metadata even on older instances.',
            safety: 'read-only',
          },
        ],
      }),
    ]));
  });

  it('probes only non-parameterized GET endpoints by default', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const getMock = client.get as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        activities: {
          methods: {
            list: { method: 'GET', path: '/activities' },
            get: { method: 'GET', path: '/activities/:id' },
          },
        },
      },
    }));
    getMock.mockResolvedValue({ data: [] });
    getMock.mockClear();

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'probe'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.total).toBe(1);
    expect(payload.summary.supported).toBe(1);
    expect(payload.summary.unsupported).toBe(0);
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('/activities');
  });

  it('uses safe default query params for known GET endpoints that require query input', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const getMock = client.get as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: {
          methods: {
            search: { method: 'GET', path: '/contacts/search' },
          },
        },
      },
    }));
    getMock.mockResolvedValue({ data: [] });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'probe'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.total).toBe(1);
    expect(payload.summary.supported).toBe(1);
    expect(payload.summary.unsupported).toBe(0);
    expect(payload.probes[0].probeParams).toEqual({ query: 'a', limit: 1 });
    expect(getMock).toHaveBeenCalledWith('/contacts', { query: 'a', limit: 1 });
  });

  it('classifies parameterized GET 404 responses as unknown-id when enabled', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const getMock = client.get as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        activities: {
          methods: {
            get: { method: 'GET', path: '/activities/:id' },
          },
        },
      },
    }));
    getMock.mockRejectedValue({
      message: 'HTTP 404',
      statusCode: 404,
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'probe', '--include-parameterized', '--id-replacement', '999999'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.total).toBe(1);
    expect(payload.summary.unknownId).toBe(1);
    expect(payload.summary.unsupported).toBe(0);
    expect(payload.probes[0].status).toBe('unknown-id');
    expect(payload.probes[0].supported).toBeNull();
    expect(getMock).toHaveBeenCalledWith('/activities/999999');
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
});
