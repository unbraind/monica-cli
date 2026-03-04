import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

const AuditLogFields = ['id', 'action', 'author', 'audited_at'];

export function createAuditLogsCommand(): Command {
  const cmd = new Command('audit-logs')
    .description('List audit logs')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all audit logs')
    .action(async (_options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.listAuditLogs({
          page: parentOpts.page,
          limit: parentOpts.limit,
        });
        console.log(fmt.formatPaginatedResponse(result, format, AuditLogFields));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
