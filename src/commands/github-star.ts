import { spawnSync } from 'child_process';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import type { MonicaConfig } from '../types';

const GITHUB_REPO = 'unbraind/monica-cli';
const GITHUB_REPO_URL = 'https://github.com/unbraind/monica-cli';

interface GhRunResult {
  success: boolean;
}

export interface GitHubStarDependencies {
  hasPromptTty: () => boolean;
  runGh: (args: string[]) => GhRunResult;
  askYesNo: (question: string, defaultValue: boolean) => Promise<boolean>;
}

function runGhDefault(args: string[]): GhRunResult {
  const result = spawnSync('gh', args, { stdio: 'ignore' });
  return { success: result.status === 0 };
}

async function askYesNoDefault(question: string, defaultValue: boolean): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const label = defaultValue ? 'Y/n' : 'y/N';
    const raw = await rl.question(`${question} (${label}): `);
    const answer = raw.trim().toLowerCase();
    if (!answer) return defaultValue;
    if (['y', 'yes', 'true', '1'].includes(answer)) return true;
    if (['n', 'no', 'false', '0'].includes(answer)) return false;
    return defaultValue;
  } finally {
    rl.close();
  }
}

const defaultDependencies: GitHubStarDependencies = {
  hasPromptTty: () => input.isTTY && output.isTTY,
  runGh: runGhDefault,
  askYesNo: askYesNoDefault,
};

function isGhAvailableAndLoggedIn(deps: GitHubStarDependencies): boolean {
  const hasGh = deps.runGh(['--version']).success;
  if (!hasGh) return false;
  return deps.runGh(['auth', 'status']).success;
}

function isRepoAlreadyStarred(deps: GitHubStarDependencies): boolean {
  return deps.runGh(['api', `user/starred/${GITHUB_REPO}`, '--silent']).success;
}

export async function maybePromptGitHubStar(
  settings: Partial<MonicaConfig>,
  options?: { nonInteractive?: boolean },
  deps: GitHubStarDependencies = defaultDependencies
): Promise<Partial<MonicaConfig>> {
  if (settings.githubRepoStarred) return settings;
  if (options?.nonInteractive) return settings;
  if (!deps.hasPromptTty()) return settings;
  if (!isGhAvailableAndLoggedIn(deps)) return settings;

  if (isRepoAlreadyStarred(deps)) {
    return { ...settings, githubRepoStarred: true };
  }

  console.log(`\nSupport the project: ${GITHUB_REPO_URL}`);
  const shouldStar = await deps.askYesNo('Would you like to star the repo now with gh?', true);
  if (!shouldStar) return settings;

  const starred = deps.runGh(['repo', 'star', GITHUB_REPO]).success;
  if (!starred) {
    console.log('Could not star repository via gh. You can run: gh repo star unbraind/monica-cli');
    return settings;
  }

  console.log('Thanks for starring monica-cli on GitHub.');
  return { ...settings, githubRepoStarred: true };
}
