import type { Command } from 'commander';
import { Command as CommanderCommand } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

/** Build compliance policy, status, and signing commands. */
export function createComplianceCommand(): Command {
  const command = new CommanderCommand('compliance').description('View compliance terms and policies')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);
  command.command('list').description('List all compliance terms and policies')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.listCompliance({ page, limit });
        console.log(fmt.formatPaginatedResponse(
          result, resolveCommandOutputFormat(this), ['id', 'name', 'created_at'],
        ));
      });
    });
  command.command('get <id>').description('Get a specific compliance policy')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.getCompliance(parsePositiveInteger(id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  command.command('status [id]').description('Get current-user compliance status')
    .action(async function (this: Command, id?: string): Promise<void> {
      await runCommandAction(async () => {
        const result = id === undefined
          ? await api.getUserComplianceStatus()
          : await api.getUserComplianceStatusForTerm(parsePositiveInteger(id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  command.command('sign').description('Sign the latest compliance policy')
    .requiredOption('--ip-address <ip>', 'IP address associated with the signature')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.signCompliance({
          ip_address: (this.opts() as { ipAddress: string }).ipAddress,
        });
        console.log(fmt.formatSuccess('Compliance policy signed'));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  return command;
}
