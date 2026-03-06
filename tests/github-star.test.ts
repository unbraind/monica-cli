import { beforeEach, describe, expect, it, vi } from 'vitest';
import { maybePromptGitHubStar, maybePromptGitHubStarOnCliRun } from '../src/commands/github-star';

describe('github star prompt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('returns unchanged settings when already marked as starred', async () => {
    const settings = { githubRepoStarred: true };
    const result = await maybePromptGitHubStar(settings, undefined, {
      hasPromptTty: () => true,
      runGh: () => ({ success: false }),
      askYesNo: async () => true,
    });
    expect(result).toBe(settings);
  });

  it('returns unchanged settings when prompt was already handled previously', async () => {
    const settings = { githubStarPrompted: true };
    const result = await maybePromptGitHubStar(settings, undefined, {
      hasPromptTty: () => true,
      runGh: () => ({ success: false }),
      askYesNo: async () => true,
    });
    expect(result).toBe(settings);
  });

  it('skips in non-interactive mode', async () => {
    const result = await maybePromptGitHubStar({}, { nonInteractive: true }, {
      hasPromptTty: () => true,
      runGh: () => ({ success: true }),
      askYesNo: async () => true,
    });
    expect(result.githubRepoStarred).toBeUndefined();
    expect(result.githubStarPrompted).toBeUndefined();
  });

  it('skips when no prompt TTY is available', async () => {
    const result = await maybePromptGitHubStar({}, undefined, {
      hasPromptTty: () => false,
      runGh: () => ({ success: true }),
      askYesNo: async () => true,
    });
    expect(result.githubRepoStarred).toBeUndefined();
    expect(result.githubStarPrompted).toBeUndefined();
  });

  it('prints manual repo link and marks prompt handled when gh is unavailable', async () => {
    const runGh = vi.fn(() => ({ success: false }));
    const result = await maybePromptGitHubStar({}, undefined, {
      hasPromptTty: () => true,
      runGh,
      askYesNo: async () => true,
    });
    expect(runGh).toHaveBeenCalledWith(['--version']);
    expect(result.githubRepoStarred).toBeUndefined();
    expect(result.githubStarPrompted).toBe(true);
    const output = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls.flat().join('\n');
    expect(output).toContain('https://github.com/unbraind/monica-cli');
    expect(output).toContain('not installed or not authenticated');
  });

  it('prints manual repo link and marks prompt handled when gh is unauthenticated', async () => {
    const runGh = vi.fn((args: string[]) => {
      if (args[0] === '--version') return { success: true };
      if (args[0] === 'auth') return { success: false };
      return { success: false };
    });
    const result = await maybePromptGitHubStar({}, undefined, {
      hasPromptTty: () => true,
      runGh,
      askYesNo: async () => true,
    });
    expect(result.githubRepoStarred).toBeUndefined();
    expect(result.githubStarPrompted).toBe(true);
    const output = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls.flat().join('\n');
    expect(output).toContain('https://github.com/unbraind/monica-cli');
    expect(output).toContain('not installed or not authenticated');
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
    expect(result.githubStarPrompted).toBe(true);
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
    expect(result.githubStarPrompted).toBe(true);
  });

  it('marks prompt handled when user declines prompt', async () => {
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
    expect(result.githubStarPrompted).toBe(true);
  });

  it('marks prompt handled when gh star command fails', async () => {
    const result = await maybePromptGitHubStar({}, undefined, {
      hasPromptTty: () => true,
      runGh: (args) => {
        if (args[0] === '--version') return { success: true };
        if (args[0] === 'auth') return { success: true };
        if (args[0] === 'api') return { success: false };
        if (args[0] === 'repo') return { success: false };
        return { success: false };
      },
      askYesNo: async () => true,
    });
    expect(result.githubRepoStarred).toBeUndefined();
    expect(result.githubStarPrompted).toBe(true);
    const output = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls.flat().join('\n');
    expect(output).toContain('Could not star repository via gh');
  });
});

describe('github star startup hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('persists prompt outcome on normal command runs', async () => {
    const saveSettings = vi.fn();
    await maybePromptGitHubStarOnCliRun(
      ['node', 'monica', 'info', 'me'],
      {
        loadSettings: () => ({}),
        saveSettings,
        hasPromptTty: () => true,
        runGh: (args) => {
          if (args[0] === '--version') return { success: true };
          if (args[0] === 'auth') return { success: true };
          if (args[0] === 'api') return { success: false };
          return { success: false };
        },
        askYesNo: async () => false,
      }
    );

    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({
      githubStarPrompted: true,
    }));
  });

  it('does not run for help/version invocations', async () => {
    const runGh = vi.fn(() => ({ success: true }));
    const saveSettings = vi.fn();
    const deps = {
      loadSettings: () => ({}),
      saveSettings,
      hasPromptTty: () => true,
      runGh,
      askYesNo: async () => true,
    };

    await maybePromptGitHubStarOnCliRun(['node', 'monica', '--help'], deps);
    await maybePromptGitHubStarOnCliRun(['node', 'monica', '--version'], deps);
    await maybePromptGitHubStarOnCliRun(['node', 'monica', 'info', '--help'], deps);
    await maybePromptGitHubStarOnCliRun(['node', 'monica', '-h'], deps);
    await maybePromptGitHubStarOnCliRun(['node', 'monica', '-V'], deps);

    expect(runGh).not.toHaveBeenCalled();
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it('does not run when --non-interactive is present', async () => {
    const runGh = vi.fn(() => ({ success: true }));
    const saveSettings = vi.fn();
    await maybePromptGitHubStarOnCliRun(
      ['node', 'monica', 'setup', '--non-interactive'],
      {
        loadSettings: () => ({}),
        saveSettings,
        hasPromptTty: () => true,
        runGh,
        askYesNo: async () => true,
      }
    );

    expect(runGh).not.toHaveBeenCalled();
    expect(saveSettings).not.toHaveBeenCalled();
  });

  it('does not persist when settings already indicate handled flow', async () => {
    const runGh = vi.fn(() => ({ success: true }));
    const saveSettings = vi.fn();
    await maybePromptGitHubStarOnCliRun(
      ['node', 'monica', 'contacts', 'list'],
      {
        loadSettings: () => ({ githubStarPrompted: true }),
        saveSettings,
        hasPromptTty: () => true,
        runGh,
        askYesNo: async () => true,
      }
    );

    expect(runGh).not.toHaveBeenCalled();
    expect(saveSettings).not.toHaveBeenCalled();
  });
});
