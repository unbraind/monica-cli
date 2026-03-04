import { Command } from 'commander';
import type { OutputFormat } from '../types';
import { resolveOutputFormat } from '../formatters';

export function resolveCommandOutputFormat(command: Command, fallback: OutputFormat = 'toon'): OutputFormat {
  const globals = (command as Command & { optsWithGlobals?: () => Record<string, unknown> }).optsWithGlobals?.() || {};
  const rawFormat =
    (globals.format as string | undefined) ||
    (command.opts().format as string | undefined) ||
    (command.parent?.opts().format as string | undefined) ||
    fallback;
  return resolveOutputFormat(rawFormat);
}
