import type { Command } from 'commander';
import { Command as CommanderCommand } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

/** Build the audit-log list command. */
export function createAuditLogsCommand(): Command {
  const command = new CommanderCommand('audit-logs').description('List audit logs')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);
  command.command('list').description('List all audit logs')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.listAuditLogs({ page, limit });
        console.log(fmt.formatPaginatedResponse(
          result, resolveCommandOutputFormat(this), ['id', 'action', 'author', 'audited_at'],
        ));
      });
    });
  return command;
}
