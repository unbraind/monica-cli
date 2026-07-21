import type { Command } from 'commander';
import { Command as CommanderCommand } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { resolveCommandOutputFormat } from './output-format';

/** Build the country reference-list command. */
export function createCountriesCommand(): Command {
  const command = new CommanderCommand('countries').description('List countries')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');
  command.command('list').description('List all countries')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.listCountries();
        console.log(fmt.formatOutput(Object.values(result.data), resolveCommandOutputFormat(this), {
          fields: ['id', 'iso', 'name'],
        }));
      });
    });
  return command;
}
