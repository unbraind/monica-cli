#!/usr/bin/env node

import { createProgram } from './program';
import { maybePromptGitHubStarOnCliRun } from './commands/github-star';

/** Runs the Monica CLI startup hooks and parses the supplied process arguments. */
export async function main(argv: string[] = process.argv): Promise<void> {
  await maybePromptGitHubStarOnCliRun(argv);
  await createProgram(argv).parseAsync(argv);
}

/** Reports a fatal CLI startup error and terminates with a failure status. */
export function reportFatalError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}

void main().catch(reportFatalError);
