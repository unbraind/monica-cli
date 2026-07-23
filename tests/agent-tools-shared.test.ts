import { describe, expect, it } from 'vitest';
import {
  collectExecutableCommandContracts,
  collectLeafCommands,
  commandToOpenAIFunction,
  walkCommandCatalog,
} from '../src/commands/agent-tools-shared';
import type { CommandCatalogNode } from '../src/commands/command-catalog';

describe('agent tool schema utilities', () => {
  it('maps option value types, enums, defaults, required values, and ignored short flags', () => {
    const schema = commandToOpenAIFunction('demo-command', 'D'.repeat(1100), [
      { flags: '-q', description: 'short only' },
      { flags: '--count <number>', description: 'required count', required: true },
      { flags: '--enabled <boolean>', description: 'required enabled', required: true },
      { flags: '--page <page>', description: 'numeric page' },
      { flags: '--format <format>', description: 'Output format', defaultValue: 'toon' },
      { flags: '--name <name>', description: 'required but optional in practice' },
    ], [
      { name: 'contact-id', required: true, variadic: false },
      { name: 'optional-id', required: false, variadic: false },
      { name: 'labels', required: false, variadic: true },
      { name: 'required-labels', required: true, variadic: true },
    ]);
    expect(schema.name).toBe('monica_demo_command');
    expect(schema.description).toHaveLength(1024);
    expect(schema.parameters.properties.count.type).toBe('number');
    expect(schema.parameters.properties.enabled.type).toBe('boolean');
    expect(schema.parameters.properties.page.type).toBe('number');
    expect(schema.parameters.properties.format.enum).toEqual(['toon', 'json', 'yaml', 'table', 'md']);
    expect(schema.parameters.properties.format.default).toBe('toon');
    expect(schema.parameters.required).toEqual(['contact_id', 'required_labels', 'count', 'enabled']);
    expect(schema.parameters.properties.contact_id).toEqual({
      type: 'string',
      description: 'Required positional argument <contact-id>',
    });
    expect(schema.parameters.properties.labels).toEqual({
      type: 'array',
      description: 'Optional variadic positional argument <labels>',
      items: { type: 'string' },
    });
    expect(schema.parameters.properties.optional_id.description).toBe(
      'Optional positional argument <optional-id>',
    );
    expect(schema.parameters.properties.required_labels.description).toBe(
      'Required variadic positional argument <required-labels>',
    );
    expect(schema.parameters.properties).not.toHaveProperty('q');
  });

  it('walks a catalog and collects only leaves', () => {
    const leaf = {
      name: 'leaf', fullCommand: 'monica leaf', description: '', options: [], subcommands: [],
      safety: { operation: 'read', mutatesData: false, readOnlyCompatible: true },
    } as CommandCatalogNode;
    const root = {
      ...leaf, name: 'monica', fullCommand: 'monica', subcommands: [leaf],
    } as CommandCatalogNode;
    const visited: string[] = [];
    walkCommandCatalog(root, (node) => visited.push(node.name));
    expect(visited).toEqual(['monica', 'leaf']);
    expect(collectLeafCommands(root)).toEqual([leaf]);
  });

  it('collects executable leaves with inherited options and local overrides', () => {
    const leaf = {
      name: 'get', fullCommand: 'monica contacts get', description: '', arguments: [],
      options: [
        { flags: '--format <format>', description: 'local', defaultValue: 'json' },
        { flags: '--with-fields', description: 'local only' },
      ],
      subcommands: [], safety: { operation: 'read', mutatesData: false, readOnlyCompatible: true },
    } as CommandCatalogNode;
    const root = {
      ...leaf, name: 'monica', fullCommand: 'monica',
      options: [
        { flags: '-V, --version', description: 'skip inherited control flag' },
        { flags: '-q', description: 'short-only inherited flag' },
        { flags: '--format <format>', description: 'global', defaultValue: 'toon' },
        { flags: '--json', description: 'global only' },
      ],
      subcommands: [leaf],
    } as CommandCatalogNode;
    const contracts = collectExecutableCommandContracts(root);
    expect(contracts).toHaveLength(1);
    expect(contracts[0]?.options).toEqual([
      { flags: '-q', description: 'short-only inherited flag' },
      { flags: '--format <format>', description: 'local', defaultValue: 'json' },
      { flags: '--json', description: 'global only' },
      { flags: '--with-fields', description: 'local only' },
    ]);
  });
});
