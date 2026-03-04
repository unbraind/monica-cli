import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fmt from '../src/formatters';
import { createInfoCommand } from '../src/commands/info';
import { buildCommandCatalog } from '../src/commands/command-catalog';
import * as infoCapabilities from '../src/commands/info-capabilities';

interface CatalogNode {
  name: string;
  fullCommand: string;
  usage: string;
  helpCommand: string;
  subcommands: CatalogNode[];
  safety: {
    operation: string;
    mutatesData: boolean;
    readOnlyCompatible: boolean;
  };
  availability?: {
    supportedOnInstance: boolean;
    statusCode: number;
    endpoint: string;
    message: string;
  };
}

function findNode(root: CatalogNode, path: string[]): CatalogNode | undefined {
  let current: CatalogNode | undefined = root;
  for (const part of path) {
    current = current?.subcommands.find((node) => node.name === part);
    if (!current) return undefined;
  }
  return current;
}

describe('info command-catalog command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED_CATALOG');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints command catalog payload for agent planning', async () => {
    const cmd = createInfoCommand();
    await cmd.parseAsync(['command-catalog', '--format', 'json'], { from: 'user' });

    expect(fmt.formatOutput).toHaveBeenCalled();
    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.defaultOutputFormat).toBe('toon');
    expect(payload.instanceCapabilities).toEqual({ enabled: false });
    expect(payload.commandTree).toBeTruthy();

    const commandTree = payload.commandTree as CatalogNode;
    expect(commandTree.name).toBe('info');
    expect(commandTree.subcommands.some((subcommand) => subcommand.name === 'command-catalog')).toBe(true);
    expect(commandTree.safety.operation).toBe('read');
    expect(commandTree.safety.mutatesData).toBe(false);
    expect(commandTree.safety.readOnlyCompatible).toBe(true);

    const infoMe = findNode(commandTree, ['me']);
    expect(infoMe?.safety.operation).toBe('read');
    expect(infoMe?.safety.readOnlyCompatible).toBe(true);
    expect(commandTree.usage.startsWith(commandTree.fullCommand)).toBe(true);
    expect(commandTree.helpCommand).toBe(`${commandTree.fullCommand} --help`);
    expect(infoMe?.usage.startsWith(infoMe?.fullCommand ?? '')).toBe(true);
    expect(infoMe?.helpCommand).toBe(`${infoMe?.fullCommand} --help`);

    expect(logSpy).toHaveBeenCalledWith('FORMATTED_CATALOG');
  });

  it('attaches instance capability availability metadata when requested', async () => {
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'cache',
      report: {
        generatedAt: '2026-03-03T00:00:00.000Z',
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

    const root = new Command('monica');
    const info = createInfoCommand();
    const groups = new Command('groups');
    groups.addCommand(new Command('list'));
    root.addCommand(info);
    root.addCommand(groups);

    await root.parseAsync(['info', 'command-catalog', '--instance-aware', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.instanceCapabilities).toEqual({
      enabled: true,
      source: 'cache',
      generatedAt: '2026-03-03T00:00:00.000Z',
    });

    const commandTree = payload.commandTree as CatalogNode;
    const groupsNode = findNode(commandTree, ['groups']);
    expect(groupsNode?.availability).toEqual({
      supportedOnInstance: false,
      statusCode: 404,
      endpoint: '/groups?limit=1',
      message: 'HTTP 404',
    });
  });

  it('prefers supported capability entry when multiple probes share the same command root', async () => {
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'cache',
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

    const root = new Command('monica');
    const info = createInfoCommand();
    const relationships = new Command('relationships');
    relationships.addCommand(new Command('types'));
    relationships.addCommand(new Command('groups'));
    root.addCommand(info);
    root.addCommand(relationships);

    await root.parseAsync(['info', 'command-catalog', '--instance-aware', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as Record<string, unknown>;
    const commandTree = payload.commandTree as CatalogNode;
    const relationshipsNode = findNode(commandTree, ['relationships']);
    expect(relationshipsNode?.availability).toEqual({
      supportedOnInstance: true,
      statusCode: 200,
      endpoint: '/relationshiptypes?limit=1',
      message: 'OK',
    });
  });

  it('classifies mixed trees with mutating and non-mutating subcommands', () => {
    const root = new Command('monica');
    const contacts = new Command('contacts');
    contacts.addCommand(new Command('list'));
    contacts.addCommand(new Command('create'));
    root.addCommand(contacts);

    const tree = buildCommandCatalog(root);
    const contactsNode = findNode(tree as CatalogNode, ['contacts']);
    const listNode = findNode(tree as CatalogNode, ['contacts', 'list']);
    const createNode = findNode(tree as CatalogNode, ['contacts', 'create']);

    expect(contactsNode?.safety.operation).toBe('mixed');
    expect(contactsNode?.safety.mutatesData).toBe(true);
    expect(contactsNode?.safety.readOnlyCompatible).toBe(false);
    expect(listNode?.safety.operation).toBe('read');
    expect(createNode?.safety.operation).toBe('write');
  });

  it('classifies write-like subcommands used by agent workflows correctly', () => {
    const root = new Command('monica');
    const contacts = new Command('contacts');
    contacts.addCommand(new Command('birthdate'));
    contacts.addCommand(new Command('deceased'));
    contacts.addCommand(new Command('stay-in-touch'));
    root.addCommand(contacts);

    const compliance = new Command('compliance');
    compliance.addCommand(new Command('sign'));
    root.addCommand(compliance);

    const bulk = new Command('bulk');
    bulk.addCommand(new Command('tag'));
    bulk.addCommand(new Command('star'));
    root.addCommand(bulk);

    const tree = buildCommandCatalog(root);

    const contactsBirthdate = findNode(tree as CatalogNode, ['contacts', 'birthdate']);
    const contactsDeceased = findNode(tree as CatalogNode, ['contacts', 'deceased']);
    const contactsStayInTouch = findNode(tree as CatalogNode, ['contacts', 'stay-in-touch']);
    const complianceSign = findNode(tree as CatalogNode, ['compliance', 'sign']);
    const bulkTag = findNode(tree as CatalogNode, ['bulk', 'tag']);
    const bulkStar = findNode(tree as CatalogNode, ['bulk', 'star']);

    expect(contactsBirthdate?.safety.operation).toBe('write');
    expect(contactsDeceased?.safety.operation).toBe('write');
    expect(contactsStayInTouch?.safety.operation).toBe('write');
    expect(complianceSign?.safety.operation).toBe('write');
    expect(bulkTag?.safety.operation).toBe('write');
    expect(bulkStar?.safety.operation).toBe('write');
  });
});
