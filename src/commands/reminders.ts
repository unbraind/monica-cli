import { InvalidArgumentError, type Command } from 'commander';
import type { Reminder, ReminderCreateInput, ReminderFrequencyType, ReminderUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand, runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

/** Parse a Monica reminder frequency. */
export function parseReminderFrequency(value: string): ReminderFrequencyType {
  if (value === 'one_time' || value === 'week' || value === 'month' || value === 'year') return value;
  throw new InvalidArgumentError('Invalid reminder frequency. Use: one_time, week, month, or year');
}

/** Parse a zero-based upcoming-reminder month offset. */
export function parseMonthOffset(value: string): number {
  if (!/^\d+$/u.test(value.trim())) {
    throw new InvalidArgumentError('Invalid month offset. Expected a non-negative integer');
  }
  const offset = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(offset)) {
    throw new InvalidArgumentError('Invalid month offset. Expected a non-negative integer');
  }
  return offset;
}

/** Build the reminder CRUD and upcoming-outbox command family. */
export function createRemindersCommand(): Command {
  const command = createCrudCommand<Reminder, ReminderCreateInput, ReminderUpdateInput>({
    name: 'reminders', description: 'Manage reminders', singular: 'reminder', label: 'Reminder',
    fields: fmt.ReminderFields,
    listPage: api.listReminders,
    listAll: () => api.listAllReminders(),
    get: api.getReminder,
    create: api.createReminder,
    update: api.updateReminder,
    remove: api.deleteReminder,
    configureCreate: (candidate) => candidate
      .requiredOption('--title <title>', 'Reminder title')
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
      .requiredOption('--date <date>', 'Initial reminder date (YYYY-MM-DD)')
      .requiredOption('--frequency <type>', 'Frequency (one_time|week|month|year)', parseReminderFrequency)
      .option('--description <text>', 'Description')
      .option('--interval <number>', 'Frequency interval', parsePositiveInteger),
    configureUpdate: (candidate) => candidate
      .option('--title <title>', 'Reminder title').option('--date <date>', 'Initial reminder date')
      .option('--frequency <type>', 'Frequency (one_time|week|month|year)', parseReminderFrequency)
      .option('--description <text>', 'Description')
      .option('--interval <number>', 'Frequency interval', parsePositiveInteger),
    buildCreateInput: (options) => ({
      title: options.title as string,
      description: options.description as string | undefined,
      contact_id: options.contact as number,
      initial_date: options.date as string,
      frequency_type: options.frequency as ReminderFrequencyType,
      frequency_number: options.interval as number | undefined,
    }),
    buildUpdateInput: (options, current) => ({
      title: (options.title as string | undefined) ?? current.title,
      description: (options.description as string | undefined) ?? current.description ?? undefined,
      contact_id: current.contact?.id ?? 0,
      initial_date: (options.date as string | undefined)
        ?? (current.initial_date ?? current.next_expected_date ?? '').split('T')[0],
      frequency_type: (options.frequency as ReminderFrequencyType | undefined) ?? current.frequency_type,
      frequency_number: (options.interval as number | undefined) ?? current.frequency_number ?? undefined,
    }),
  });

  command.command('upcoming [month-offset]')
    .description('List reminders for a month offset (0=current month, 1=next month)')
    .action(async function (this: Command, monthOffset?: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.listUpcomingReminders(
          monthOffset === undefined ? 0 : parseMonthOffset(monthOffset),
        );
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this), {
          fields: fmt.ReminderFields,
        }));
      });
    });
  return command;
}
