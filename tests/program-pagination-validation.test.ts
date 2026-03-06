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

    const parsePromise = program.parseAsync(['contacts', 'list', '--page', 'abc'], { from: 'user' });
    await expect(parsePromise).rejects.toMatchObject({
      code: 'commander.invalidArgument',
      exitCode: 1,
    });
    await expect(parsePromise).rejects.toThrow('Invalid number "abc"');
  });

  it('rejects non-positive --limit values', async () => {
    const program = createProgram(['node', 'monica', 'contacts', 'list', '--limit', '0']);
    applyExitOverrideRecursive(program);

    const parsePromise = program.parseAsync(['contacts', 'list', '--limit', '0'], { from: 'user' });
    await expect(parsePromise).rejects.toMatchObject({
      code: 'commander.invalidArgument',
      exitCode: 1,
    });
    await expect(parsePromise).rejects.toThrow('Invalid number "0"');
  });
});
