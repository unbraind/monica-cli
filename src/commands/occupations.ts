import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createOccupationsCommand(): Command {
  const cmd = new Command('occupations')
    .description('Manage occupations')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  const OccupationFields = ['id', 'company', 'job', 'active', 'start_date', 'end_date', 'created_at'];

  cmd
    .command('list')
    .description('List all occupations')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (options.all) {
          const occupations = await api.listAllOccupations();
          console.log(fmt.formatOutput(occupations, format, { fields: OccupationFields }));
        } else {
          const result = await api.listOccupations({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, OccupationFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific occupation')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getOccupation(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new occupation')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .option('--company <name>', 'Company name')
    .option('--job <title>', 'Job title')
    .option('--active', 'Is current job')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.createOccupation({
          contact_id: options.contact,
          company: options.company,
          job: options.job,
          active: options.active,
          start_date: options.startDate,
          end_date: options.endDate,
        });
        console.log(fmt.formatSuccess('Occupation created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update an occupation')
    .option('--company <name>', 'Company name')
    .option('--job <title>', 'Job title')
    .option('--active', 'Is current job')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const current = await api.getOccupation(parseInt(id));
        const result = await api.updateOccupation(parseInt(id), {
          contact_id: current.data.contact?.id || 0,
          company: options.company ?? current.data.company,
          job: options.job ?? current.data.job,
          active: options.active ?? current.data.active,
          start_date: options.startDate ?? current.data.start_date,
          end_date: options.endDate ?? current.data.end_date,
        });
        console.log(fmt.formatSuccess('Occupation updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete an occupation')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deleteOccupation(parseInt(id));
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
