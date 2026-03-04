import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { addGlobalHelpFooters } from '../src/commands/help-ux';

describe('help ux', () => {
  it('adds inherited global option guidance to subcommand help output', () => {
    const program = new Command('monica');
    program.option('--json', 'Output as JSON');
    const contacts = new Command('contacts').description('Manage contacts');
    contacts.command('list').description('List contacts');
    program.addCommand(contacts);

    addGlobalHelpFooters(program);

    const handlers = contacts.listeners('--help');
    expect(handlers.length).toBeGreaterThan(0);
  });
});
