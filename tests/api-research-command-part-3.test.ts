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
});
