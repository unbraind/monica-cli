import { describe, expect, it } from 'vitest';
import { createProgram } from '../src/program';

describe('program format validation', () => {
  it('rejects invalid --format values with a clear error', async () => {
    const program = createProgram(['node', 'monica', 'contacts', 'list', '--format', 'invalid']);
    program.exitOverride();

    let stderr = '';
    program.configureOutput({
      writeOut: () => undefined,
      writeErr: (str) => {
        stderr += str;
      },
    });

    await expect(program.parseAsync(['contacts', 'list', '--format', 'invalid'], { from: 'user' })).rejects.toMatchObject({
      code: 'commander.invalidArgument',
      exitCode: 1,
    });

    expect(stderr).toContain('Invalid format "invalid"');
    expect(stderr).toContain('toon, json, yaml, table, md');
  });
});
