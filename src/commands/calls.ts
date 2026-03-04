import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createCallsCommand(): Command {
  const cmd = new Command('calls')
    .description('Manage calls with contacts')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  const CallFields = ['id', 'called_at', 'content', 'created_at'];

  cmd
    .command('list')
    .description('List all calls')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (options.all) {
          const calls = await api.listAllCalls();
          console.log(fmt.formatOutput(calls, format, { fields: CallFields }));
        } else {
          const result = await api.listCalls({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, CallFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific call')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getCall(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new call')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .requiredOption('--content <text>', 'Call content/notes')
    .requiredOption('--date <date>', 'Date of call (YYYY-MM-DD)')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.createCall({
          contact_id: options.contact,
          content: options.content,
          called_at: options.date,
        });
        console.log(fmt.formatSuccess('Call created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a call')
    .option('--content <text>', 'Call content/notes')
    .option('--date <date>', 'Date of call (YYYY-MM-DD)')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const current = await api.getCall(parseInt(id));
        const result = await api.updateCall(parseInt(id), {
          contact_id: current.data.contact?.id || 0,
          content: options.content || current.data.content || '',
          called_at: options.date || current.data.called_at,
        });
        console.log(fmt.formatSuccess('Call updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a call')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deleteCall(parseInt(id));
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
