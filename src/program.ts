import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import {
  createContactsCommand,
  createActivitiesCommand,
  createNotesCommand,
  createTasksCommand,
  createRemindersCommand,
  createTagsCommand,
  createCompaniesCommand,
  createInfoCommand,
  createCallsCommand,
  createGiftsCommand,
  createDebtsCommand,
  createAddressesCommand,
  createJournalCommand,
  createGroupsCommand,
  createDocumentsCommand,
  createPhotosCommand,
  createOccupationsCommand,
  createConversationsCommand,
  createRelationshipsCommand,
  createUserCommand,
  createGendersCommand,
  createCountriesCommand,
  createCurrenciesCommand,
  createActivityTypesCommand,
  createActivityTypeCategoriesCommand,
  createContactFieldTypesCommand,
  createContactFieldsCommand,
  createAuditLogsCommand,
  createPetsCommand,
  createPetCategoriesCommand,
  createConfigCommand,
  createSetupCommand,
  createSearchCommand,
  createBulkCommand,
  createComplianceCommand,
  createSchemasCommand,
  createAgentToolsCommand,
  createAgentRunbookCommand,
  createAuditCommand,
  createApiResearchCommand,
} from './commands';
import {
  applyRequestTimeoutOverride,
  parseFieldsOption,
  parseOutputFormat,
  parsePositiveInteger,
  parseRequestTimeoutMs,
} from './commands/global-options';
import { addGlobalHelpFooters } from './commands/help-ux';
import { resolveOutputFormat } from './formatters';
import { setRuntimeFieldSelection } from './formatters/runtime-fields';
import type { OutputFormat } from './types';
import { loadSettings } from './utils/settings';

interface PackageJsonVersion {
  version: string;
}

function applyFormatToCommandChain(start: Command, format: OutputFormat): void {
  let current: Command | null = start;
  while (current) {
    current.setOptionValue('format', format);
    current = current.parent || null;
  }
}

function inheritOptionFromParents(command: Command, key: string): void {
  if (command.getOptionValue(key) !== undefined) return;
  let current = command.parent;
  while (current) {
    const value = current.getOptionValue(key);
    if (value !== undefined) {
      command.setOptionValue(key, value);
      return;
    }
    current = current.parent;
  }
}

function hasExplicitFormatFlag(argv: string[]): boolean {
  const flags = new Set([
    '--format',
    '-f',
    '--json',
    '--yaml',
    '--yml',
    '--table',
    '--md',
    '--markdown',
  ]);
  return argv.some((arg) => flags.has(arg));
}

function applyGlobalArgParsers(root: Command): void {
  const stack: Command[] = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    for (const option of current.options) {
      if (option.long === '--format') {
        option.argParser(parseOutputFormat);
      } else if (option.long === '--page' || option.long === '--limit') {
        option.argParser(parsePositiveInteger);
      } else if (option.long === '--fields') {
        option.argParser(parseFieldsOption);
      }
    }
    stack.push(...current.commands);
  }
}

function loadPackageVersion(): string {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJsonVersion;
    if (typeof packageJson.version === 'string' && packageJson.version.trim().length > 0) {
      return packageJson.version;
    }
  } catch {
    // Fall through to deterministic fallback for test environments with mocked fs.
  }
  return '0.0.0';
}

export function createProgram(argv: string[] = process.argv): Command {
  const settings = loadSettings();
  const defaultFormat = settings?.defaultFormat ? resolveOutputFormat(settings.defaultFormat) : 'toon';
  const program = new Command();

  program
    .name('monica')
    .description('CLI interface for Monica CRM API - optimized for agents')
    .version(loadPackageVersion())
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', defaultFormat)
    .option('--json', 'Output as JSON (shorthand for --format json)')
    .option('--yaml', 'Output as YAML (shorthand for --format yaml)')
    .option('--yml', 'Output as YAML (shorthand for --format yaml)')
    .option('--table', 'Output as table (shorthand for --format table)')
    .option('--md', 'Output as Markdown (shorthand for --format md)')
    .option('--markdown', 'Output as Markdown (shorthand for --format md)')
    .option('--raw', 'Output raw JSON data only (no pagination info)')
    .option('-v, --verbose', 'Enable verbose output')
    .option('-q, --quiet', 'Suppress non-essential output (dotenv logs)')
    .option('--fields <fields>', 'Comma-separated list of fields to display', parseFieldsOption)
    .option('--request-timeout-ms <ms>', 'Request timeout in milliseconds (overrides MONICA_REQUEST_TIMEOUT_MS)', parseRequestTimeoutMs)
    .hook('preAction', (thisCommand: Command, actionCommand: Command) => {
      const target = actionCommand || thisCommand;
      if (!hasExplicitFormatFlag(argv) && defaultFormat !== 'toon') {
        applyFormatToCommandChain(target, defaultFormat);
      }
      const opts = (target as Command & { optsWithGlobals?: () => Record<string, unknown> }).optsWithGlobals?.() || target.opts();
      setRuntimeFieldSelection(opts.fields as string[] | undefined);
      if (hasExplicitFormatFlag(argv) && typeof opts.format === 'string') {
        applyFormatToCommandChain(target, parseOutputFormat(opts.format));
      }
      applyRequestTimeoutOverride(opts.requestTimeoutMs as number | undefined);
      if (opts.raw) {
        target.setOptionValue('raw', true);
        applyFormatToCommandChain(target, 'json');
        return;
      }
      if (opts.json) {
        applyFormatToCommandChain(target, 'json');
      } else if (opts.yaml) {
        applyFormatToCommandChain(target, 'yaml');
      } else if (opts.yml) {
        applyFormatToCommandChain(target, 'yaml');
      } else if (opts.table) {
        applyFormatToCommandChain(target, 'table');
      } else if (opts.md) {
        applyFormatToCommandChain(target, 'md');
      } else if (opts.markdown) {
        applyFormatToCommandChain(target, 'md');
      }

      ['format', 'page', 'limit', 'raw', 'fields', 'verbose', 'quiet', 'requestTimeoutMs'].forEach((key) => {
        inheritOptionFromParents(target, key);
      });
    });

  program.addCommand(createContactsCommand());
  program.addCommand(createActivitiesCommand());
  program.addCommand(createNotesCommand());
  program.addCommand(createTasksCommand());
  program.addCommand(createRemindersCommand());
  program.addCommand(createTagsCommand());
  program.addCommand(createCompaniesCommand());
  program.addCommand(createInfoCommand());
  program.addCommand(createCallsCommand());
  program.addCommand(createGiftsCommand());
  program.addCommand(createDebtsCommand());
  program.addCommand(createAddressesCommand());
  program.addCommand(createJournalCommand());
  program.addCommand(createGroupsCommand());
  program.addCommand(createDocumentsCommand());
  program.addCommand(createPhotosCommand());
  program.addCommand(createOccupationsCommand());
  program.addCommand(createConversationsCommand());
  program.addCommand(createRelationshipsCommand());
  program.addCommand(createUserCommand());
  program.addCommand(createGendersCommand());
  program.addCommand(createCountriesCommand());
  program.addCommand(createCurrenciesCommand());
  program.addCommand(createActivityTypesCommand());
  program.addCommand(createActivityTypeCategoriesCommand());
  program.addCommand(createContactFieldTypesCommand());
  program.addCommand(createContactFieldsCommand());
  program.addCommand(createAuditLogsCommand());
  program.addCommand(createPetsCommand());
  program.addCommand(createPetCategoriesCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createSetupCommand());
  program.addCommand(createSearchCommand());
  program.addCommand(createBulkCommand());
  program.addCommand(createComplianceCommand());
  program.addCommand(createSchemasCommand());
  program.addCommand(createAgentToolsCommand());
  program.addCommand(createAgentRunbookCommand());
  program.addCommand(createAuditCommand());
  program.addCommand(createApiResearchCommand());

  applyGlobalArgParsers(program);
  addGlobalHelpFooters(program);
  return program;
}
