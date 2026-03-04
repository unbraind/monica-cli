import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createComplianceCommand(): Command {
  const cmd = new Command('compliance')
    .description('View compliance terms and policies')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all compliance terms and policies')
    .action(async (_options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.listCompliance({
          page: parentOpts.page,
          limit: parentOpts.limit,
        });
        console.log(fmt.formatPaginatedResponse(result, format, ['id', 'name', 'created_at']));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific compliance term/policy')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getCompliance(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('status [id]')
    .description('Get compliance status for current user (optionally for a specific term)')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (id) {
          const result = await api.getUserComplianceStatusForTerm(parseInt(id));
          console.log(fmt.formatOutput(result.data, format));
        } else {
          const result = await api.getUserComplianceStatus();
          console.log(fmt.formatOutput(result.data, format));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('sign')
    .description('Sign the latest compliance policy')
    .requiredOption('--ip-address <ip>', 'IP address to associate with signature')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.signCompliance({ ip_address: options.ipAddress });
        console.log(fmt.formatSuccess('Compliance policy signed'));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
