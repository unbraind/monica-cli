import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';
import { runCommandAction } from './crud-command';

/** Build the current Monica API account-user command tree. */
export function createUsersCommand(): Command {
  const command = new Command('users')
    .description('Inspect account users from the current Monica API')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);

  command.command('current')
    .description('Get the authenticated user')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.getAuthenticatedUser();
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  command.command('list')
    .description('List account users')
    .option('--all', 'Fetch all pages')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const format = resolveCommandOutputFormat(this) as OutputFormat;
        if ((this.opts() as { all?: boolean }).all) {
          console.log(fmt.formatOutput(
            await api.listAllAccountUsers(),
            format,
            { fields: fmt.AccountUserFields },
          ));
          return;
        }
        const parentOptions = this.parent?.opts() as { page?: number; limit?: number };
        console.log(fmt.formatPaginatedResponse(
          await api.listAccountUsers({
            page: parentOptions.page,
            limit: parentOptions.limit,
          }),
          format,
          fmt.AccountUserFields,
        ));
      });
    });

  command.command('get <id>')
    .description('Get one account user by UUID')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.getAccountUser(id);
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  return command;
}
