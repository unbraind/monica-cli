import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { createProgram } from '../src/program';

function applyExitOverrideRecursive(command: Command): void {
  command.exitOverride();
  command.commands.forEach(applyExitOverrideRecursive);
}

describe('program pagination validation', () => {
  it('rejects invalid --page values', async () => {
    const program = createProgram(['node', 'monica', 'contacts', 'list', '--page', 'abc']);
    applyExitOverrideRecursive(program);

    let error: unknown;
    try {
      await program.parseAsync(['contacts', 'list', '--page', 'abc'], { from: 'user' });
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({
      code: 'commander.invalidArgument',
      exitCode: 1,
    });

    expect((error as Error).message).toContain('Invalid number "abc"');
  });

  it('rejects non-positive --limit values', async () => {
    const program = createProgram(['node', 'monica', 'contacts', 'list', '--limit', '0']);
    applyExitOverrideRecursive(program);

    let error: unknown;
    try {
      await program.parseAsync(['contacts', 'list', '--limit', '0'], { from: 'user' });
    } catch (caught) {
      error = caught;
    }
    expect(error).toMatchObject({
      code: 'commander.invalidArgument',
      exitCode: 1,
    });

    expect((error as Error).message).toContain('Invalid number "0"');
  });
});
