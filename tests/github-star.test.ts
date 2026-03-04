import { describe, it, expect } from 'vitest';
import { maybePromptGitHubStar } from '../src/commands/github-star';

describe('github star prompt', () => {
  it('returns unchanged settings when already marked as starred', async () => {
    const settings = { githubRepoStarred: true };
    const result = await maybePromptGitHubStar(settings, undefined, {
      hasPromptTty: () => true,
      runGh: () => ({ success: false }),
      askYesNo: async () => true,
    });
    expect(result.githubRepoStarred).toBe(true);
  });

  it('skips in non-interactive mode', async () => {
    const result = await maybePromptGitHubStar({}, { nonInteractive: true }, {
      hasPromptTty: () => true,
      runGh: () => ({ success: true }),
      askYesNo: async () => true,
    });
    expect(result.githubRepoStarred).toBeUndefined();
  });

  it('marks as starred when gh reports repo already starred', async () => {
    const calls: string[][] = [];
    const result = await maybePromptGitHubStar({}, undefined, {
      hasPromptTty: () => true,
      runGh: (args) => {
        calls.push(args);
        if (args[0] === '--version') return { success: true };
        if (args[0] === 'auth') return { success: true };
        if (args[0] === 'api') return { success: true };
        return { success: false };
      },
      askYesNo: async () => false,
    });
    expect(result.githubRepoStarred).toBe(true);
    expect(calls.some((args) => args[0] === 'api')).toBe(true);
  });

  it('stars via gh when user accepts prompt', async () => {
    const result = await maybePromptGitHubStar({}, undefined, {
      hasPromptTty: () => true,
      runGh: (args) => {
        if (args[0] === '--version') return { success: true };
        if (args[0] === 'auth') return { success: true };
        if (args[0] === 'api') return { success: false };
        if (args[0] === 'repo') return { success: true };
        return { success: false };
      },
      askYesNo: async () => true,
    });
    expect(result.githubRepoStarred).toBe(true);
  });

  it('leaves settings unchanged when user declines prompt', async () => {
    const result = await maybePromptGitHubStar({}, undefined, {
      hasPromptTty: () => true,
      runGh: (args) => {
        if (args[0] === '--version') return { success: true };
        if (args[0] === 'auth') return { success: true };
        if (args[0] === 'api') return { success: false };
        return { success: false };
      },
      askYesNo: async () => false,
    });
    expect(result.githubRepoStarred).toBeUndefined();
  });
});
