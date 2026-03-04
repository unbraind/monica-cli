import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createActivitiesCommand(): Command {
  const cmd = new Command('activities')
    .description('Manage activities')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all activities')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        if (options.all) {
          const activities = await api.listAllActivities();
          console.log(fmt.formatOutput(activities, format, { fields: fmt.ActivityFields }));
        } else {
          const result = await api.listActivities({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, fmt.ActivityFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific activity')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.getActivity(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new activity')
    .requiredOption('--type <id>', 'Activity type ID', parseInt)
    .requiredOption('--summary <text>', 'Summary')
    .requiredOption('--date <date>', 'Date (YYYY-MM-DD)')
    .requiredOption('--contacts <ids>', 'Contact IDs (comma-separated)')
    .option('--description <text>', 'Description')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.createActivity({
          activity_type_id: options.type,
          summary: options.summary,
          description: options.description,
          happened_at: options.date,
          contacts: options.contacts.split(',').map((id: string) => parseInt(id.trim())),
        });
        console.log(fmt.formatSuccess('Activity created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update an activity')
    .option('--type <id>', 'Activity type ID', parseInt)
    .option('--summary <text>', 'Summary')
    .option('--date <date>', 'Date (YYYY-MM-DD)')
    .option('--contacts <ids>', 'Contact IDs (comma-separated)')
    .option('--description <text>', 'Description')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const current = await api.getActivity(parseInt(id));
        const data = current.data;
        
        const result = await api.updateActivity(parseInt(id), {
          activity_type_id: options.type || data.activity_type?.id || 1,
          summary: options.summary || data.summary,
          description: options.description ?? data.description,
          happened_at: options.date || data.happened_at,
          contacts: options.contacts
            ? options.contacts.split(',').map((c: string) => parseInt(c.trim()))
            : data.attendees.contacts.map(c => c.id),
        });
        console.log(fmt.formatSuccess('Activity updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete an activity')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.deleteActivity(parseInt(id));
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
