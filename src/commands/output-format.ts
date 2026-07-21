import { Command } from 'commander';
import type { OutputFormat } from '../types';
import { resolveOutputFormat } from '../formatters';

/** Resolves command output format. */
export function resolveCommandOutputFormat(command: Command, fallback: OutputFormat = 'toon'): OutputFormat {
  const globals = command.optsWithGlobals() as Record<string, unknown>;
  const rawFormat =
    (globals.format as string | undefined) ||
    (command.opts().format as string | undefined) ||
    (command.parent?.opts().format as string | undefined) ||
    fallback;
  return resolveOutputFormat(rawFormat);
}
