import { Command } from 'commander';

const GLOBAL_OPTIONS_HELP = [
  'Inherited global options:',
  '  -f, --format <format>        Output format (toon|json|yaml|table|md)',
  '  --json|--yaml|--yml          Shorthand format overrides',
  '  --table|--md|--markdown      Table/Markdown shorthand format overrides',
  '  --raw                         Force JSON data-only output where supported',
  '  --fields <fields>             Comma-separated field filter',
  '  --request-timeout-ms <ms>     Per-request timeout override',
  '  -v, --verbose                 Verbose logging',
  '  -q, --quiet                   Suppress non-essential logs',
].join('\n');

export function addGlobalHelpFooters(program: Command): void {
  decorateCommand(program, true);
}

function decorateCommand(command: Command, isRoot: boolean): void {
  if (!isRoot && command.name() !== 'help') {
    command.on('--help', () => {
      console.log(`\n${GLOBAL_OPTIONS_HELP}`);
    });
  }
  command.commands.forEach((subcommand) => decorateCommand(subcommand, false));
}
