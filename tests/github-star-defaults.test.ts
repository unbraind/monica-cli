import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const defaults = vi.hoisted(() => ({
  close: vi.fn(),
  question: vi.fn(async () => 'yes'),
  spawn: vi.fn(() => ({ status: 0 })),
}));

vi.mock('child_process', () => ({ spawnSync: defaults.spawn }));
vi.mock('readline/promises', () => ({
  createInterface: vi.fn(() => ({ question: defaults.question, close: defaults.close })),
}));

import { maybePromptGitHubStar } from '../src/commands/github-star';

describe('default GitHub star adapters', () => {
  const stdinTty = process.stdin.isTTY;
  const stdoutTty = process.stdout.isTTY;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true });
    Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: true });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    defaults.spawn.mockImplementation((_, args: string[]) => ({
      status: args[0] === 'api' ? 1 : 0,
    }));
  });

  afterAll(() => {
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: stdinTty });
    Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: stdoutTty });
  });

  it.each([
    ['yes', true],
    ['y', true],
    ['true', true],
    ['1', true],
    ['no', false],
    ['n', false],
    ['false', false],
    ['0', false],
    ['', true],
    ['unknown', true],
  ])('parses interactive answer %j', async (answer, expectedStarred) => {
    defaults.question.mockResolvedValueOnce(answer);
    const result = await maybePromptGitHubStar({});
    expect(result.githubRepoStarred === true).toBe(expectedStarred);
    expect(defaults.close).toHaveBeenCalledOnce();
  });
});
