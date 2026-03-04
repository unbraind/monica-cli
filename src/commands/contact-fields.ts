import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

const ContactFieldFields = ['id', 'content', 'contact_field_type'];
const ContactFieldScanFields = ['contact_id', 'id', 'content', 'contact_field_type'];

interface ContactFieldsListOptions {
  scanContacts?: boolean;
  autoScan?: boolean;
  contactMaxPages?: number;
}

interface ContactFieldScanResult {
  mode: 'contact-scan-fallback';
  trigger: 'auto' | 'manual';
  contactsScanned: number;
  contactsWithFields: number;
  totalFields: number;
  data: Array<Record<string, unknown>>;
}

function parsePositiveIntOption(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Invalid positive integer: ${value}`);
  }
  return parsed;
}

function resolveContactScanMaxPages(options: ContactFieldsListOptions): number {
  if (typeof options.contactMaxPages === 'number') {
    return options.contactMaxPages;
  }
  // Keep auto fallback bounded for large datasets; manual scan can be broader.
  return options.scanContacts ? 10 : 1;
}

function isGlobalEndpointUnavailable(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number }).statusCode;
  return statusCode === 404 || statusCode === 405;
}

async function listContactFieldsByContactScan(
  limit: number | undefined,
  contactMaxPages: number,
  trigger: 'auto' | 'manual'
): Promise<ContactFieldScanResult> {
  const contacts = await api.listAllContacts(undefined, contactMaxPages);
  const scanned: Array<Record<string, unknown>> = [];
  let contactsWithFields = 0;

  for (const contact of contacts) {
    if (typeof contact.id !== 'number') {
      continue;
    }

    const scoped = await api.listContactFields(contact.id, { page: 1, limit });
    if (scoped.data.length > 0) {
      contactsWithFields += 1;
    }

    for (const field of scoped.data) {
      scanned.push({
        ...field,
        contact_id: contact.id,
      });
    }
  }

  return {
    mode: 'contact-scan-fallback',
    trigger,
    contactsScanned: contacts.length,
    contactsWithFields,
    totalFields: scanned.length,
    data: scanned,
  };
}

export function createContactFieldsCommand(): Command {
  const cmd = new Command('contact-fields')
    .description('Manage contact fields')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list [contact-id]')
    .description('List contact fields (all or for a specific contact)')
    .option('--scan-contacts', 'Fallback to scanning contacts when global endpoint is unavailable')
    .option('--no-auto-scan', 'Disable automatic scan fallback when global endpoint is unavailable')
    .option('--contact-max-pages <pages>', 'Maximum contact pages to scan in fallback mode', parsePositiveIntOption)
    .action(async (contactId, options: ContactFieldsListOptions, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);

      try {
        const parsedContactId = contactId ? parseInt(contactId, 10) : undefined;
        if (parsedContactId !== undefined && Number.isNaN(parsedContactId)) {
          throw new Error(`Invalid contact id: ${contactId}`);
        }

        if (parsedContactId !== undefined) {
          const scopedResult = await api.listContactFields(parsedContactId, {
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(scopedResult, format, ContactFieldFields));
          return;
        }

        try {
          const globalResult = await api.listAllContactFields({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(globalResult, format, ContactFieldFields));
        } catch (error) {
          const autoScanEnabled = options.autoScan !== false;
          const shouldFallback = isGlobalEndpointUnavailable(error) && (options.scanContacts || autoScanEnabled);
          if (shouldFallback) {
            const contactMaxPages = resolveContactScanMaxPages(options);
            const scanResult = await listContactFieldsByContactScan(
              parentOpts.limit,
              contactMaxPages,
              options.scanContacts ? 'manual' : 'auto'
            );
            console.log(fmt.formatOutput(scanResult, format, { fields: ContactFieldScanFields }));
            return;
          }

          if (isGlobalEndpointUnavailable(error)) {
            throw new Error(
              'Global contact field listing is unavailable on this Monica instance. Use: monica contact-fields list <contact-id> or monica contact-fields list --scan-contacts'
            );
          }

          throw error;
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific contact field')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);

      try {
        const result = await api.getContactField(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new contact field')
    .requiredOption('--contact-id <id>', 'Contact ID', parseInt)
    .requiredOption('--type-id <id>', 'Contact field type ID', parseInt)
    .requiredOption('--content <content>', 'Field content')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);

      try {
        const result = await api.createContactField({
          contact_id: options.contactId,
          contact_field_type_id: options.typeId,
          content: options.content,
        });
        console.log(fmt.formatSuccess('Contact field created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a contact field')
    .requiredOption('--contact-id <id>', 'Contact ID', parseInt)
    .requiredOption('--type-id <id>', 'Contact field type ID', parseInt)
    .requiredOption('--content <content>', 'Field content')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);

      try {
        const result = await api.updateContactField(parseInt(id), {
          contact_id: options.contactId,
          contact_field_type_id: options.typeId,
          content: options.content,
        });
        console.log(fmt.formatSuccess('Contact field updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a contact field')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);

      try {
        const result = await api.deleteContactField(parseInt(id));
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
