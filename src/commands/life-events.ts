import { Command } from 'commander';
import type { LifeEventCreateInput, LifeEventUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

const LIFE_EVENT_FIELDS = ['id', 'name', 'happened_at', 'life_event_type', 'contact'];

interface LifeEventOptions {
  typeId: number;
  date: string;
  name?: string;
  note?: string;
}

function commonOptions(command: Command): Command {
  return command
    .requiredOption('--type-id <id>', 'Life event type ID', parsePositiveInteger)
    .requiredOption('--date <date>', 'Event date (YYYY-MM-DD)')
    .option('--name <name>', 'Custom event name')
    .option('--note <text>', 'Event note');
}

/** Build the source-backed Monica 4.x life-event command tree. */
export function createLifeEventsCommand(): Command {
  const cmd = new Command('life-events')
    .description('Manage Monica contact life events')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);

  cmd.command('list')
    .description('List life events')
    .option('--all', 'Fetch all pages')
    .option('--sort <field>', 'Sort criterion')
    .action(async function (this: Command): Promise<void> {
      const options = this.opts() as { all?: boolean; sort?: string };
      try {
        const format = resolveCommandOutputFormat(this);
        if (options.all) {
          const events = await api.listAllLifeEvents({ sort: options.sort });
          console.log(fmt.formatOutput(events, format, { fields: LIFE_EVENT_FIELDS }));
          return;
        }
        const parentOptions = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.listLifeEvents({
          page: parentOptions.page,
          limit: parentOptions.limit,
          sort: options.sort,
        });
        console.log(fmt.formatPaginatedResponse(result, format, LIFE_EVENT_FIELDS));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd.command('get <id>')
    .description('Get one life event')
    .action(async function (this: Command, id: string): Promise<void> {
      try {
        const result = await api.getLifeEvent(parsePositiveInteger(id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  commonOptions(cmd.command('create').description('Create a life event'))
    .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
    .option('--reminder', 'Create a yearly reminder')
    .option('--month-unknown', 'The event month is unknown')
    .option('--day-unknown', 'The event day is unknown')
    .action(async function (this: Command): Promise<void> {
      const options = this.opts() as LifeEventOptions & {
        contact: number;
        reminder?: boolean;
        monthUnknown?: boolean;
        dayUnknown?: boolean;
      };
      const data: LifeEventCreateInput = {
        contact_id: options.contact,
        life_event_type_id: options.typeId,
        happened_at: options.date,
        name: options.name,
        note: options.note,
        has_reminder: options.reminder === true,
        happened_at_month_unknown: options.monthUnknown === true,
        happened_at_day_unknown: options.dayUnknown === true,
      };
      try {
        const result = await api.createLifeEvent(data);
        console.log(fmt.formatSuccess('Life event created', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  commonOptions(cmd.command('update <id>').description('Update a life event'))
    .action(async function (this: Command, id: string): Promise<void> {
      const options = this.opts() as LifeEventOptions;
      const data: LifeEventUpdateInput = {
        life_event_type_id: options.typeId,
        happened_at: options.date,
        name: options.name,
        note: options.note,
      };
      try {
        const result = await api.updateLifeEvent(parsePositiveInteger(id), data);
        console.log(fmt.formatSuccess('Life event updated', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd.command('delete <id>')
    .description('Delete a life event')
    .action(async function (this: Command, id: string): Promise<void> {
      try {
        const result = await api.deleteLifeEvent(parsePositiveInteger(id));
        const output = resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result)
          : fmt.formatDeleted(result.id);
        console.log(output);
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
