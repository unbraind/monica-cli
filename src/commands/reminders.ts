import { Command } from 'commander';
import type { OutputFormat, ReminderFrequencyType } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createRemindersCommand(): Command {
  const cmd = new Command('reminders')
    .description('Manage reminders')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all reminders')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        if (options.all) {
          const reminders = await api.listAllReminders();
          console.log(fmt.formatOutput(reminders, format, { fields: fmt.ReminderFields }));
        } else {
          const result = await api.listReminders({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, fmt.ReminderFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific reminder')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.getReminder(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new reminder')
    .requiredOption('--title <title>', 'Reminder title')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .requiredOption('--date <date>', 'Next expected date (YYYY-MM-DD)')
    .requiredOption('--frequency <type>', 'Frequency type (one_time|week|month|year)')
    .option('--description <text>', 'Description')
    .option('--interval <number>', 'Frequency interval', parseInt)
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.createReminder({
          title: options.title,
          description: options.description,
          contact_id: options.contact,
          next_expected_date: options.date,
          frequency_type: options.frequency as ReminderFrequencyType,
          frequency_number: options.interval,
        });
        console.log(fmt.formatSuccess('Reminder created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a reminder')
    .option('--title <title>', 'Reminder title')
    .option('--date <date>', 'Next expected date (YYYY-MM-DD)')
    .option('--frequency <type>', 'Frequency type (one_time|week|month|year)')
    .option('--description <text>', 'Description')
    .option('--interval <number>', 'Frequency interval', parseInt)
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const current = await api.getReminder(parseInt(id));
        const data = current.data;
        
        const result = await api.updateReminder(parseInt(id), {
          title: options.title || data.title,
          description: options.description ?? data.description,
          contact_id: data.contact?.id || 0,
          next_expected_date: options.date || data.next_expected_date.split('T')[0],
          frequency_type: (options.frequency as ReminderFrequencyType) || data.frequency_type,
          frequency_number: options.interval ?? data.frequency_number ?? undefined,
        });
        console.log(fmt.formatSuccess('Reminder updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a reminder')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.deleteReminder(parseInt(id));
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
