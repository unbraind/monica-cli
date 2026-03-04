import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createDebtsCommand(): Command {
  const cmd = new Command('debts')
    .description('Manage debts')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  const DebtFields = ['id', 'in_debt', 'status', 'amount', 'reason', 'created_at'];

  cmd
    .command('list')
    .description('List all debts')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (options.all) {
          const debts = await api.listAllDebts();
          console.log(fmt.formatOutput(debts, format, { fields: DebtFields }));
        } else {
          const result = await api.listDebts({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, DebtFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific debt')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getDebt(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new debt')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .requiredOption('--in-debt <yes|no>', 'Are you in debt? (yes|no)')
    .requiredOption('--amount <amount>', 'Amount', parseFloat)
    .requiredOption('--status <status>', 'Status (inprogress|complete)')
    .option('--reason <text>', 'Reason for debt')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.createDebt({
          contact_id: options.contact,
          in_debt: options.inDebt,
          amount: options.amount,
          status: options.status,
          reason: options.reason,
        });
        console.log(fmt.formatSuccess('Debt created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a debt')
    .option('--in-debt <yes|no>', 'Are you in debt? (yes|no)')
    .option('--amount <amount>', 'Amount', parseFloat)
    .option('--status <status>', 'Status (inprogress|complete)')
    .option('--reason <text>', 'Reason for debt')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const current = await api.getDebt(parseInt(id));
        const result = await api.updateDebt(parseInt(id), {
          contact_id: current.data.contact?.id || 0,
          in_debt: options.inDebt || current.data.in_debt,
          amount: options.amount ?? current.data.amount,
          status: options.status || current.data.status,
          reason: options.reason ?? current.data.reason ?? undefined,
        });
        console.log(fmt.formatSuccess('Debt updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a debt')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deleteDebt(parseInt(id));
        if (format === 'json') {
          console.log(JSON.stringify(result));
        } else {
          console.log(fmt.formatDeleted(result.id));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
