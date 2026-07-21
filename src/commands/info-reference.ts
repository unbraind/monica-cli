import type { Command } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

const INFO_RESOURCES = [
  { name: 'me', description: 'Get current user info', load: () => api.getUser() },
  { name: 'genders', description: 'List all genders', load: () => api.listGenders() },
  { name: 'countries', description: 'List all countries', load: () => api.listCountries() },
  { name: 'currencies', description: 'List all currencies', load: () => api.listCurrencies() },
  { name: 'activity-types', description: 'List all activity types', load: () => api.listActivityTypes() },
  {
    name: 'relationship-types',
    description: 'List all relationship types',
    load: () => api.listRelationshipTypes(),
  },
];

/** Attach compact read-only reference lookups to the info command. */
export function attachInfoReferenceSubcommands(command: Command): void {
  for (const resource of INFO_RESOURCES) {
    command.command(resource.name)
      .description(resource.description)
      .action(async function (this: Command): Promise<void> {
        await runCommandAction(async () => {
          const result = await resource.load();
          console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
        });
      });
  }

  command.command('contact-field-types')
    .description('List all contact field types')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger)
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const options = this.opts() as { page?: number; limit?: number };
        const result = await api.listContactFieldTypes(options);
        console.log(fmt.formatPaginatedResponse(result, resolveCommandOutputFormat(this)));
      });
    });
}
