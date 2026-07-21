import { describe, expect, it } from 'vitest';
import {
  collectLeafCommands,
  commandToOpenAIFunction,
  walkCommandCatalog,
} from '../src/commands/agent-tools-shared';
import type { CommandCatalogNode } from '../src/commands/command-catalog';

describe('agent tool schema utilities', () => {
  it('maps option value types, enums, defaults, required values, and ignored short flags', () => {
    const schema = commandToOpenAIFunction('demo-command', 'D'.repeat(1100), [
      { flags: '-q', description: 'short only' },
      { flags: '--count <number>', description: 'required count' },
      { flags: '--enabled <boolean>', description: 'required enabled' },
      { flags: '--format <format>', description: 'Output format', defaultValue: 'toon' },
      { flags: '--name <name>', description: 'required but optional in practice' },
    ]);
    expect(schema.name).toBe('monica_demo_command');
    expect(schema.description).toHaveLength(1024);
    expect(schema.parameters.properties.count.type).toBe('number');
    expect(schema.parameters.properties.enabled.type).toBe('boolean');
    expect(schema.parameters.properties.format.enum).toEqual(['toon', 'json', 'yaml', 'table', 'md']);
    expect(schema.parameters.properties.format.default).toBe('toon');
    expect(schema.parameters.required).toEqual(['count', 'enabled']);
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
});
