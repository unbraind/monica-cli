import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { createProgram } from '../src/program';

interface CommandNode {
  path: string;
  command: Command;
}

function flattenCommands(command: Command, parentPath = 'monica'): CommandNode[] {
  const nodes: CommandNode[] = [];
  command.commands
    .filter((subcommand) => subcommand.name() !== 'help')
    .forEach((subcommand) => {
      const path = `${parentPath} ${subcommand.name()}`;
      nodes.push({ path, command: subcommand });
      nodes.push(...flattenCommands(subcommand, path));
    });
  return nodes;
}

describe('help tree', () => {
  it('registers inherited global help hooks for every visible command', () => {
    const program = createProgram(['node', 'monica']);
    const nodes = flattenCommands(program);

    expect(nodes.length).toBeGreaterThan(0);
    nodes.forEach(({ path, command }) => {
      expect(command.listeners('--help').length, `missing --help hook for ${path}`).toBeGreaterThan(0);
    });
  });

  it('provides non-empty descriptions for every visible command', () => {
    const program = createProgram(['node', 'monica']);
    const nodes = flattenCommands(program);

    expect(program.description().trim().length).toBeGreaterThan(0);
    nodes.forEach(({ path, command }) => {
      expect(command.description().trim().length, `missing description for ${path}`).toBeGreaterThan(0);
    });
  });
});
