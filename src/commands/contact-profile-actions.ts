import { InvalidArgumentError, type Command } from 'commander';
import type { ApiResponse, Contact, ContactAvatarSource, DeleteResponse } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

type ContactMutation = (
  id: number,
  options: Record<string, unknown>,
) => Promise<ApiResponse<Contact>>;

/** Parse a supported Monica 4.x avatar source. */
export function parseContactAvatarSource(value: string): ContactAvatarSource {
  if (value === 'default' || value === 'adorable' || value === 'gravatar' || value === 'photo') {
    return value;
  }
  throw new InvalidArgumentError('Invalid avatar source. Use: default, adorable, gravatar, or photo');
}

function addMutation(
  command: Command,
  name: string,
  description: string,
  label: string,
  configure: (candidate: Command) => Command,
  mutate: ContactMutation,
): void {
  configure(command.command(`${name} <id>`).description(description))
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await mutate(parsePositiveInteger(id), this.opts());
        console.log(fmt.formatSuccess(label, result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
}

function addDeleteMutation(
  command: Command,
  name: string,
  description: string,
  mutate: (id: number) => Promise<DeleteResponse>,
): void {
  command.command(`${name} <id>`).description(description)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await mutate(parsePositiveInteger(id));
        console.log(resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result) : fmt.formatDeleted(result.id));
      });
    });
}

/** Attach Monica contact profile mutation commands. */
export function attachContactProfileActions(command: Command): void {
  addMutation(command, 'birthdate', 'Update contact birthdate', 'Birthdate updated',
    (candidate) => candidate.requiredOption('--date <date>', 'Birthdate (YYYY-MM-DD)')
      .option('--age-based', 'Date is age-based').option('--year-unknown', 'Year is unknown'),
    (id, options) => api.updateContactBirthdate(id, {
      birthdate_date: options.date as string,
      birthdate_is_age_based: Boolean(options.ageBased),
      birthdate_is_year_unknown: Boolean(options.yearUnknown),
    }));
  addMutation(command, 'deceased', 'Update deceased status', 'Deceased status updated',
    (candidate) => candidate.option('--date <date>', 'Deceased date')
      .option('--add-reminder', 'Add reminder'),
    (id, options) => api.updateContactDeceasedDate(id, {
      is_deceased: true, is_deceased_date_known: Boolean(options.date),
      deceased_date_date: options.date as string | undefined,
      is_deceased_add_reminder: Boolean(options.addReminder),
    }));
  addMutation(command, 'stay-in-touch', 'Update stay-in-touch frequency', 'Stay in touch updated',
    (candidate) => candidate.option('--frequency <days>', 'Frequency in days', parsePositiveInteger)
      .option('--trigger-date <date>', 'Trigger date'),
    (id, options) => api.updateContactStayInTouch(id, {
      stay_in_touch_frequency: options.frequency as number | undefined,
      stay_in_touch_trigger_date: options.triggerDate as string | undefined,
    }));
  addMutation(command, 'first-met', 'Update how you met information', 'First met updated',
    (candidate) => candidate.option('--date <date>', 'First met date')
      .option('--contact <id>', 'Contact met through', parsePositiveInteger)
      .option('--info <text>', 'General information'),
    (id, options) => api.updateContactFirstMet(id, {
      first_met_date: options.date as string | undefined,
      first_met_through_contact_id: options.contact as number | undefined,
      first_met_general_information: options.info as string | undefined,
    }));
  addMutation(command, 'introduction', 'Update Monica 4.x introduction', 'Introduction updated',
    (candidate) => candidate.option('--met-through <id>', 'Contact met through', parsePositiveInteger)
      .option('--info <text>', 'General information').option('--where <text>', 'Where you met')
      .option('--date-known', 'Date is known').option('--age-based', 'Use approximate age')
      .option('--day <day>', 'Day', parsePositiveInteger).option('--month <month>', 'Month', parsePositiveInteger)
      .option('--year <year>', 'Year', parsePositiveInteger).option('--age <years>', 'Years ago', parsePositiveInteger)
      .option('--add-reminder', 'Create a yearly reminder'),
    (id, options) => api.updateContactIntroduction(id, {
      met_through_contact_id: options.metThrough as number | undefined,
      general_information: options.info as string | undefined,
      where: options.where as string | undefined,
      is_date_known: Boolean(options.dateKnown), is_age_based: Boolean(options.ageBased),
      day: options.day as number | undefined, month: options.month as number | undefined,
      year: options.year as number | undefined, age: options.age as number | undefined,
      add_reminder: Boolean(options.addReminder),
    }));
  addMutation(command, 'food-preferences', 'Update food preferences', 'Food preferences updated',
    (candidate) => candidate.requiredOption('--preferences <text>', 'Food preferences'),
    (id, options) => api.updateContactFoodPreferences(id, {
      food_preferences: options.preferences as string,
    }));
  addMutation(command, 'set-avatar', 'Set contact avatar from URL', 'Avatar set',
    (candidate) => candidate.requiredOption('--url <url>', 'Avatar URL'),
    (id, options) => api.setContactAvatar(id, options.url as string));
  addMutation(command, 'avatar', 'Set Monica 4.x avatar source', 'Avatar updated',
    (candidate) => candidate.requiredOption('--source <source>', 'Avatar source', parseContactAvatarSource)
      .option('--photo-id <id>', 'Photo ID', parsePositiveInteger),
    (id, options) => api.updateContactAvatar(
      id, options.source as ContactAvatarSource, options.photoId as number | undefined,
    ));
  addMutation(command, 'career', 'Update career information', 'Career updated',
    (candidate) => candidate.option('--job <title>', 'Job title').option('--company <name>', 'Company'),
    (id, options) => api.updateContactCareer(id, {
      job: options.job as string | undefined, company: options.company as string | undefined,
    }));
  addDeleteMutation(command, 'delete-avatar', 'Delete contact avatar', api.deleteContactAvatar);
}
