import type { Command } from 'commander';
import { Command as CommanderCommand } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

const CURRENCY_FIELDS = ['id', 'iso', 'name', 'symbol'];

/** Build currency reference-list and detail commands. */
export function createCurrenciesCommand(): Command {
  const command = new CommanderCommand('currencies').description('List currencies')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);
  command.command('list').description('List all currencies')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.listCurrencies({ page, limit });
        console.log(fmt.formatPaginatedResponse(
          result, resolveCommandOutputFormat(this), CURRENCY_FIELDS,
        ));
      });
    });
  command.command('get <id>').description('Get a specific currency')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.getCurrency(parsePositiveInteger(id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  return command;
}
