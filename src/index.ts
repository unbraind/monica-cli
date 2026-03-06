#!/usr/bin/env node

import { createProgram } from './program';
import { maybePromptGitHubStarOnCliRun } from './commands/github-star';

async function main(): Promise<void> {
  await maybePromptGitHubStarOnCliRun(process.argv);
  await createProgram(process.argv).parseAsync(process.argv);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
