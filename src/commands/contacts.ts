import type { Command } from 'commander';
import type { Contact, ContactCreateInput, ContactUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand, runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';
import { addContactListCommand } from './contact-related-lists';
import { attachContactProfileActions } from './contact-profile-actions';

async function resolveContactGenderId(
  explicitGenderId: number | undefined,
  contact: Pick<Contact, 'gender' | 'gender_type'>,
): Promise<number> {
  if (explicitGenderId !== undefined) return explicitGenderId;
  const genders = await api.listGenders();
  const byType = contact.gender_type?.trim().toLowerCase();
  const byName = contact.gender?.trim().toLowerCase();
  const matched = genders.data.find((gender) => (
    (byType && gender.type?.trim().toLowerCase() === byType)
    || (byName && gender.name.trim().toLowerCase() === byName)
  ));
  if (matched) return matched.id;
  throw new Error('Unable to infer current gender id. Pass --gender-id explicitly.');
}

/** Build contact CRUD, profile actions, search, logs, and related-list commands. */
export function createContactsCommand(): Command {
  const command = createCrudCommand<Contact, ContactCreateInput, ContactUpdateInput>({
    name: 'contacts', description: 'Manage contacts', singular: 'contact', label: 'Contact',
    fields: fmt.ContactFields,
    listPage: (pagination, options) => api.listContacts({
      page: pagination.page, limit: pagination.limit,
      query: options?.query as string | undefined, sort: options?.sort as string | undefined,
    }),
    listAll: (options) => api.listAllContacts(options),
    get: (id, options) => api.getContact(id, options?.withFields ? 'contactfields' : undefined),
    create: api.createContact,
    update: api.updateContact,
    remove: api.deleteContact,
    configureList: (candidate) => candidate
      .option('-q, --query <query>', 'Search query')
      .option('-s, --sort <field>', 'Sort field (created_at|updated_at)'),
    configureGet: (candidate) => candidate.option('--with-fields', 'Include contact fields'),
    configureCreate: (candidate) => candidate
      .requiredOption('--first-name <name>', 'First name')
      .requiredOption('--gender-id <id>', 'Gender ID', parsePositiveInteger)
      .option('--last-name <name>', 'Last name').option('--nickname <name>', 'Nickname')
      .option('--is-deceased', 'Mark as deceased').option('--is-partial', 'Mark as partial'),
    configureUpdate: (candidate) => candidate
      .option('--first-name <name>', 'First name').option('--last-name <name>', 'Last name')
      .option('--nickname <name>', 'Nickname')
      .option('--gender-id <id>', 'Gender ID', parsePositiveInteger),
    buildCreateInput: (options) => ({
      first_name: options.firstName as string,
      last_name: options.lastName as string | undefined,
      nickname: options.nickname as string | undefined,
      gender_id: options.genderId as number,
      is_birthdate_known: false,
      is_deceased: Boolean(options.isDeceased),
      is_deceased_date_known: false,
      is_partial: Boolean(options.isPartial),
    }),
    buildUpdateInput: async (options, current) => ({
      first_name: (options.firstName as string | undefined) ?? current.first_name,
      last_name: (options.lastName as string | undefined) ?? current.last_name ?? undefined,
      nickname: (options.nickname as string | undefined) ?? current.nickname ?? undefined,
      gender_id: await resolveContactGenderId(options.genderId as number | undefined, current),
      is_birthdate_known: false,
      is_deceased: current.is_dead,
      is_deceased_date_known: false,
      is_partial: current.is_partial,
    }),
  });

  command.command('search <query>').description('Search contacts')
    .action(async function (this: Command, query: string): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.searchContacts(query, { page, limit });
        console.log(fmt.formatPaginatedResponse(result, resolveCommandOutputFormat(this), fmt.ContactFields));
      });
    });
  command.command('logs <id>').description('Get audit logs for a contact')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.getContactLogs(parsePositiveInteger(id), { page, limit });
        console.log(fmt.formatPaginatedResponse(result, resolveCommandOutputFormat(this)));
      });
    });
  attachContactProfileActions(command);
  for (const [name, description, fields, fetcher] of [
    ['fields', 'List contact fields', fmt.ContactFieldFields, api.getContactFields],
    ['activities', 'List activities', fmt.ActivityFields, api.getContactActivities],
    ['notes', 'List notes', fmt.NoteFields, api.getContactNotes],
    ['tasks', 'List tasks', fmt.TaskFields, api.getContactTasks],
    ['reminders', 'List reminders', fmt.ReminderFields, api.getContactReminders],
    ['addresses', 'List addresses', fmt.AddressFields, api.listContactAddresses],
    ['calls', 'List calls', fmt.CallFields, api.listContactCalls],
    ['conversations', 'List conversations', fmt.ConversationFields, api.listContactConversations],
    ['documents', 'List documents', fmt.DocumentFields, api.listContactDocuments],
    ['gifts', 'List gifts', fmt.GiftFields, api.listContactGifts],
    ['photos', 'List photos', fmt.PhotoFields, api.listContactPhotos],
  ] as const) addContactListCommand(command, name, `${description} for a contact`, fields, fetcher);
  return command;
}
