import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/commands/config', () => ({
  runConfigSetup: vi.fn(async () => undefined),
}));

import { createSetupCommand } from '../src/commands/setup';
import { runConfigSetup } from '../src/commands/config';

describe('setup command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates setup command with expected options', () => {
    const cmd = createSetupCommand();
    const optionNames = cmd.options.map((option) => option.long);
    expect(cmd.name()).toBe('setup');
    expect(optionNames).toEqual(expect.arrayContaining([
      '--api-url',
      '--api-key',
      '--user-email',
      '--user-password',
      '--default-format',
      '--read-only',
      '--read-write',
      '--dry-run',
      '--non-interactive',
      '--probe-capabilities',
      '--skip-capability-probe',
    ]));
  });

  it('delegates to config setup runner', async () => {
    const cmd = createSetupCommand();
    await cmd.parseAsync([
      '--api-url', 'http://localhost:8080',
      '--api-key', 'token',
      '--default-format', 'yaml',
      '--read-only',
      '--dry-run',
      '--non-interactive',
    ], { from: 'user' });

    expect(runConfigSetup).toHaveBeenCalledTimes(1);
    expect(runConfigSetup).toHaveBeenCalledWith(expect.objectContaining({
      apiUrl: 'http://localhost:8080',
      apiKey: 'token',
      defaultFormat: 'yaml',
      readOnly: true,
      dryRun: true,
      nonInteractive: true,
    }), expect.any(Object));
  });
});
