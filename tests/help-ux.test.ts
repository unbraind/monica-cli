import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { addGlobalHelpFooters } from '../src/commands/help-ux';

describe('global help footer', () => {
  it('prints inherited options for nested command help', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const program = new Command('monica');
    program.addCommand(new Command('contacts').addCommand(new Command('list')));
    addGlobalHelpFooters(program);
    program.commands[0].commands[0].emit('--help');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Inherited global options:'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('--request-timeout-ms'));
  });
});
