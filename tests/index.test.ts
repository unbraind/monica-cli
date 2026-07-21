import { beforeEach, describe, expect, it, vi } from 'vitest';

const startup = vi.hoisted(() => ({
  prompt: vi.fn(async () => undefined),
  parse: vi.fn(async () => undefined),
}));

vi.mock('../src/commands/github-star', () => ({
  maybePromptGitHubStarOnCliRun: startup.prompt,
}));
vi.mock('../src/program', () => ({
  createProgram: vi.fn(() => ({ parseAsync: startup.parse })),
}));

import { main, reportFatalError } from '../src/index';

describe('CLI entrypoint', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('runs startup and parsing with the same argv', async () => {
    const argv = ['node', 'monica', '--version'];
    await main(argv);
    expect(startup.prompt).toHaveBeenCalledWith(argv);
    expect(startup.parse).toHaveBeenCalledWith(argv);
  });

  it('reports Error and non-Error fatal values', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    reportFatalError(new Error('broken'));
    reportFatalError('stopped');
    expect(console.error).toHaveBeenNthCalledWith(1, 'broken');
    expect(console.error).toHaveBeenNthCalledWith(2, 'stopped');
    expect(process.exit).toHaveBeenCalledTimes(2);
  });
});
