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
      state: 'supported',
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
      state: 'supported',
      statusCode: 200,
      endpoint: '/relationshiptypes?limit=1',
      message: 'OK',
    });
    expect(byResource.get('relationshipTypeGroups')).toEqual({
      supportedOnInstance: false,
      state: 'unsupported',
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

  it('rejects contradictory instance support filters', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({ endpoints: {} }));
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as never);
    await expect(createApiResearchCommand().parseAsync([
      'summary', '--instance-aware', '--supported-only', '--unsupported-only',
    ], { from: 'user' })).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
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
});
