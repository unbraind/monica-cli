import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

const CountryFields = ['id', 'iso', 'name'];

export function createCountriesCommand(): Command {
  const cmd = new Command('countries')
    .description('List countries')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  cmd
    .command('list')
    .description('List all countries')
    .action(async (_options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.listCountries();
        const countries = Object.values(result.data);
        console.log(fmt.formatOutput(countries, format, { fields: CountryFields }));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
