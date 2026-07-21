import type { Command } from 'commander';
import { Command as CommanderCommand } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

const CONTACT_FIELD_FIELDS = ['id', 'content', 'contact_field_type'];
interface ListOptions { scanContacts?: boolean; autoScan?: boolean; contactMaxPages?: number }

async function scanContactFields(
  limit: number | undefined,
  maxPages: number,
  trigger: 'auto' | 'manual',
): Promise<Record<string, unknown>> {
  const contacts = await api.listAllContacts(undefined, maxPages);
  const data: Array<Record<string, unknown>> = [];
  let contactsWithFields = 0;
  for (const contact of contacts) {
    if (typeof contact.id !== 'number') continue;
    const scoped = await api.listContactFields(contact.id, { page: 1, limit });
    if (scoped.data.length > 0) contactsWithFields++;
    data.push(...scoped.data.map((field) => ({ ...field, contact_id: contact.id })));
  }
  return {
    mode: 'contact-scan-fallback', trigger, contactsScanned: contacts.length,
    contactsWithFields, totalFields: data.length, data,
  };
}

/** Build global/contact-scoped contact field commands with compatibility scanning. */
export function createContactFieldsCommand(): Command {
  const command = new CommanderCommand('contact-fields').description('Manage contact fields')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);

  command.command('list [contact-id]').description('List contact fields globally or for a contact')
    .option('--scan-contacts', 'Use the contact-scan compatibility fallback')
    .option('--no-auto-scan', 'Disable automatic scan fallback')
    .option('--contact-max-pages <pages>', 'Maximum contact pages to scan', parsePositiveInteger)
    .action(async function (this: Command, contactId?: string): Promise<void> {
      await runCommandAction(async () => {
        const options = this.opts() as ListOptions;
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const format = resolveCommandOutputFormat(this);
        if (contactId !== undefined) {
          const result = await api.listContactFields(parsePositiveInteger(contactId), { page, limit });
          console.log(fmt.formatPaginatedResponse(result, format, CONTACT_FIELD_FIELDS));
          return;
        }
        try {
          const result = await api.listAllContactFields({ page, limit });
          console.log(fmt.formatPaginatedResponse(result, format, CONTACT_FIELD_FIELDS));
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          const unsupported = statusCode === 404 || statusCode === 405;
          if (unsupported && (options.scanContacts || options.autoScan !== false)) {
            const scan = await scanContactFields(
              limit,
              options.contactMaxPages ?? (options.scanContacts ? 10 : 1),
              options.scanContacts ? 'manual' : 'auto',
            );
            console.log(fmt.formatOutput(scan, format, {
              fields: ['contact_id', ...CONTACT_FIELD_FIELDS],
            }));
            return;
          }
          if (unsupported) {
            throw new Error('Global listing is unavailable. Pass <contact-id> or --scan-contacts.', {
              cause: error,
            });
          }
          throw error;
        }
      });
    });

  command.command('get <id>').description('Get a specific contact field')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.getContactField(parsePositiveInteger(id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  for (const action of ['create', 'update'] as const) {
    const candidate = command.command(action === 'create' ? 'create' : 'update <id>')
      .description(`${action === 'create' ? 'Create' : 'Update'} a contact field`)
      .requiredOption('--contact-id <id>', 'Contact ID', parsePositiveInteger)
      .requiredOption('--type-id <id>', 'Contact field type ID', parsePositiveInteger)
      .requiredOption('--content <content>', 'Field content');
    candidate.action(async function (this: Command, id?: string): Promise<void> {
      await runCommandAction(async () => {
        const options = this.opts() as { contactId: number; typeId: number; content: string };
        const input = {
          contact_id: options.contactId,
          contact_field_type_id: options.typeId,
          content: options.content,
        };
        const result = action === 'create'
          ? await api.createContactField(input)
          : await api.updateContactField(parsePositiveInteger(id as string), input);
        console.log(fmt.formatSuccess(
          action === 'create' ? 'Contact field created' : 'Contact field updated',
          result.data.id,
        ));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  }
  command.command('delete <id>').description('Delete a contact field')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.deleteContactField(parsePositiveInteger(id));
        console.log(resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result) : fmt.formatDeleted(result.id));
      });
    });
  return command;
}
