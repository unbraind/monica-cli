import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { addContactListCommand } from './contact-related-lists';

export function createContactsCommand(): Command {
  const cmd = new Command('contacts')
    .description('Manage contacts')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd.command('list').description('List all contacts')
    .option('-q, --query <query>', 'Search query')
    .option('-s, --sort <field>', 'Sort field (created_at|updated_at)')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        if (options.all) {
          const contacts = await api.listAllContacts({ query: options.query, sort: options.sort });
          console.log(fmt.formatOutput(contacts, format, { fields: fmt.ContactFields }));
        } else {
          const result = await api.listContacts({ page: cmdParent.opts().page, limit: cmdParent.opts().limit, query: options.query, sort: options.sort });
          console.log(fmt.formatPaginatedResponse(result, format, fmt.ContactFields));
        }
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('get <id>').description('Get a specific contact').option('--with-fields', 'Include contact fields')
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.getContact(parseInt(id), options.withFields ? 'contactfields' : undefined);
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('create').description('Create a new contact')
    .requiredOption('--first-name <name>', 'First name').requiredOption('--gender-id <id>', 'Gender ID', parseInt)
    .option('--last-name <name>', 'Last name').option('--nickname <name>', 'Nickname')
    .option('--is-deceased', 'Mark as deceased').option('--is-partial', 'Mark as partial contact')
    .action(async (options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.createContact({
          first_name: options.firstName, last_name: options.lastName, nickname: options.nickname,
          gender_id: options.genderId, is_birthdate_known: false, is_deceased: options.isDeceased || false,
          is_deceased_date_known: false, is_partial: options.isPartial || false,
        });
        console.log(fmt.formatSuccess('Contact created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('update <id>').description('Update a contact')
    .option('--first-name <name>', 'First name').option('--last-name <name>', 'Last name')
    .option('--nickname <name>', 'Nickname').option('--gender-id <id>', 'Gender ID', parseInt)
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const contactId = parseInt(id);
        const current = await api.getContact(contactId);
        const genderId = await resolveContactGenderId(options.genderId, current.data);
        const result = await api.updateContact(parseInt(id), {
          first_name: options.firstName || current.data.first_name,
          last_name: options.lastName ?? current.data.last_name,
          nickname: options.nickname ?? current.data.nickname,
          gender_id: genderId, is_birthdate_known: false,
          is_deceased: current.data.is_dead, is_deceased_date_known: false,
          is_partial: current.data.is_partial,
        });
        console.log(fmt.formatSuccess('Contact updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('delete <id>').description('Delete a contact')
    .action(async (id, _options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.deleteContact(parseInt(id));
        console.log(format === 'json' ? JSON.stringify(result) : fmt.formatDeleted(result.id));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('search <query>').description('Search contacts')
    .action(async (query, _options, cmdParent) => {
      const { format, page, limit } = cmdParent.opts();
      try {
        const result = await api.searchContacts(query, { page, limit });
        console.log(fmt.formatPaginatedResponse(result, format, fmt.ContactFields));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('logs <id>').description('Get audit logs for a contact')
    .action(async (id, _options, cmdParent) => {
      const { format, page, limit } = cmdParent.opts();
      try {
        const result = await api.getContactLogs(parseInt(id), { page, limit });
        console.log(fmt.formatPaginatedResponse(result, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('birthdate <id>').description('Update contact birthdate')
    .requiredOption('--date <date>', 'Birthdate (YYYY-MM-DD)')
    .option('--age-based', 'Date is age-based').option('--year-unknown', 'Year is unknown')
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.updateContactBirthdate(parseInt(id), {
          birthdate_date: options.date, birthdate_is_age_based: options.ageBased || false,
          birthdate_is_year_unknown: options.yearUnknown || false,
        });
        console.log(fmt.formatSuccess('Birthdate updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('deceased <id>').description('Update contact deceased status')
    .requiredOption('--deceased', 'Mark as deceased', true)
    .option('--date <date>', 'Deceased date (YYYY-MM-DD)').option('--add-reminder', 'Add reminder for deceased date')
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.updateContactDeceasedDate(parseInt(id), {
          is_deceased: true, is_deceased_date_known: !!options.date,
          deceased_date_date: options.date, is_deceased_add_reminder: options.addReminder || false,
        });
        console.log(fmt.formatSuccess('Deceased status updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('stay-in-touch <id>').description('Update stay in touch frequency')
    .option('--frequency <days>', 'Frequency in days', parseInt).option('--trigger-date <date>', 'Trigger date (YYYY-MM-DD)')
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.updateContactStayInTouch(parseInt(id), {
          stay_in_touch_frequency: options.frequency, stay_in_touch_trigger_date: options.triggerDate,
        });
        console.log(fmt.formatSuccess('Stay in touch updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('first-met <id>').description('Update how you met information')
    .option('--date <date>', 'First met date (YYYY-MM-DD)').option('--contact <id>', 'Contact ID met through', parseInt)
    .option('--info <text>', 'General information')
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.updateContactFirstMet(parseInt(id), {
          first_met_date: options.date, first_met_through_contact_id: options.contact,
          first_met_general_information: options.info,
        });
        console.log(fmt.formatSuccess('First met updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('food-preferences <id>').description('Update food preferences')
    .requiredOption('--preferences <text>', 'Food preferences')
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.updateContactFoodPreferences(parseInt(id), { food_preferences: options.preferences });
        console.log(fmt.formatSuccess('Food preferences updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('set-avatar <id>').description('Set contact avatar from URL')
    .requiredOption('--url <url>', 'Avatar URL')
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.setContactAvatar(parseInt(id), options.url);
        console.log(fmt.formatSuccess('Avatar set', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('delete-avatar <id>').description('Delete contact avatar')
    .action(async (id, _options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.deleteContactAvatar(parseInt(id));
        console.log(format === 'json' ? JSON.stringify(result) : fmt.formatDeleted(result.id));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('career <id>').description('Update contact career information')
    .option('--job <title>', 'Job title')
    .option('--company <company>', 'Company name')
    .action(async (id, options, cmdParent) => {
      const { format } = cmdParent.opts();
      try {
        const result = await api.updateContactCareer(parseInt(id), {
          job: options.job,
          company: options.company,
        });
        console.log(fmt.formatSuccess('Career updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });

  cmd.command('fields <id>').description('List contact fields for a contact')
    .action(async (id, _options, cmdParent) => {
      const { format, page, limit } = cmdParent.opts();
      try {
        const result = await api.getContactFields(parseInt(id), { page, limit });
        console.log(fmt.formatPaginatedResponse(result, format, fmt.ContactFieldFields));
      } catch (error) { console.error(fmt.formatError(error as Error)); process.exit(1); }
    });
  addContactListCommand(cmd, 'activities', 'List activities for a contact', fmt.ActivityFields, api.getContactActivities);
  addContactListCommand(cmd, 'notes', 'List notes for a contact', fmt.NoteFields, api.getContactNotes);
  addContactListCommand(cmd, 'tasks', 'List tasks for a contact', fmt.TaskFields, api.getContactTasks);
  addContactListCommand(cmd, 'reminders', 'List reminders for a contact', fmt.ReminderFields, api.getContactReminders);
  addContactListCommand(cmd, 'addresses', 'List addresses for a contact', fmt.AddressFields, api.listContactAddresses);
  addContactListCommand(cmd, 'calls', 'List calls for a contact', fmt.CallFields, api.listContactCalls);
  addContactListCommand(cmd, 'conversations', 'List conversations for a contact', fmt.ConversationFields, api.listContactConversations);
  addContactListCommand(cmd, 'documents', 'List documents for a contact', fmt.DocumentFields, api.listContactDocuments);
  addContactListCommand(cmd, 'gifts', 'List gifts for a contact', fmt.GiftFields, api.listContactGifts);
  addContactListCommand(cmd, 'photos', 'List photos for a contact', fmt.PhotoFields, api.listContactPhotos);

  return cmd;
}

async function resolveContactGenderId(
  explicitGenderId: number | undefined,
  contact: { gender?: string; gender_type?: string }
): Promise<number> {
  if (explicitGenderId) {
    return explicitGenderId;
  }

  const genders = await api.listGenders();
  const byType = normalizeLookupValue(contact.gender_type);
  const byName = normalizeLookupValue(contact.gender);

  const matched = genders.data.find((gender) => {
    const candidateType = normalizeLookupValue(gender.type);
    const candidateName = normalizeLookupValue(gender.name);
    if (byType && candidateType === byType) {
      return true;
    }
    return Boolean(byName && candidateName === byName);
  });

  if (matched) {
    return matched.id;
  }

  throw new Error(
    'Unable to infer current gender id for update. Please pass --gender-id explicitly.'
  );
}

function normalizeLookupValue(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}
