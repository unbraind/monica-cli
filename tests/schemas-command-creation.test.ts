import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { createSchemasCommand } from '../src/commands/schemas';

describe('schemas command creation', () => {
  it('creates schemas command', () => {
    const cmd = createSchemasCommand();
    expect(cmd).toBeInstanceOf(Command);
    expect(cmd.name()).toBe('schemas');
    expect(cmd.description()).toBe('Machine-readable output schemas for automation and agents');
  });
});
