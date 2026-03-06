import { describe, expect, it } from 'vitest';
import { createInfoCommand } from '../src/commands/info';

describe('info command UX', () => {
  it('requires a subcommand and prints actionable guidance', async () => {
    const cmd = createInfoCommand();
    cmd.exitOverride();

    let stderr = '';
    cmd.configureOutput({
      writeOut: () => undefined,
      writeErr: (str) => {
        stderr += str;
      },
    });

    await expect(cmd.parseAsync([], { from: 'user' })).rejects.toMatchObject({
      code: 'commander.error',
      exitCode: 1,
    });

    expect(stderr).toContain('"info" requires a subcommand');
    expect(stderr).toContain('Available subcommands:');
    expect(stderr).toContain('me');
    expect(stderr).toContain('instance-profile');
    expect(stderr).toContain('Get current user info');
    expect(stderr).toContain('deterministic agent planning');
    expect(stderr).toContain('Example:');
    expect(stderr).toContain('monica info me');
  });
});
