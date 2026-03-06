import { spawnSync } from 'child_process';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import type { MonicaConfig } from '../types';
import { loadSettings, saveSettings } from '../utils/settings';

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

export interface GitHubStarCliDependencies extends GitHubStarDependencies {
  loadSettings: () => Partial<MonicaConfig> | null;
  saveSettings: (settings: Partial<MonicaConfig>) => void;
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

const defaultCliDependencies: GitHubStarCliDependencies = {
  ...defaultDependencies,
  loadSettings,
  saveSettings,
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
  if (settings.githubRepoStarred || settings.githubStarPrompted) return settings;
  if (options?.nonInteractive) return settings;
  if (!deps.hasPromptTty()) return settings;

  const markedPrompted = { ...settings, githubStarPrompted: true };

  if (!isGhAvailableAndLoggedIn(deps)) {
    console.log(`\nSupport the project: ${GITHUB_REPO_URL}`);
    console.log('GitHub CLI is not installed or not authenticated. Open the link to star the repo manually.');
    return markedPrompted;
  }

  if (isRepoAlreadyStarred(deps)) {
    return { ...markedPrompted, githubRepoStarred: true };
  }

  console.log(`\nSupport the project: ${GITHUB_REPO_URL}`);
  const shouldStar = await deps.askYesNo('Would you like to star the repo now with gh?', true);
  if (!shouldStar) return markedPrompted;

  const starred = deps.runGh(['repo', 'star', GITHUB_REPO]).success;
  if (!starred) {
    console.log('Could not star repository via gh. You can run: gh repo star unbraind/monica-cli');
    return markedPrompted;
  }

  console.log('Thanks for starring monica-cli on GitHub.');
  return { ...markedPrompted, githubRepoStarred: true };
}

function shouldPromptOnCliRun(argv: string[]): boolean {
  const args = argv.slice(2);
  if (args.includes('--non-interactive')) return false;
  if (args.includes('--help') || args.includes('-h')) return false;
  if (args.includes('--version') || args.includes('-V')) return false;
  return true;
}

export async function maybePromptGitHubStarOnCliRun(
  argv: string[] = process.argv,
  deps: GitHubStarCliDependencies = defaultCliDependencies
): Promise<void> {
  if (!shouldPromptOnCliRun(argv)) return;
  const settings = deps.loadSettings() || {};
  const maybeUpdated = await maybePromptGitHubStar(settings, undefined, deps);
  if (maybeUpdated !== settings) {
    deps.saveSettings(maybeUpdated);
  }
}
