import { Command } from 'commander';
import type { OutputFormat, Contact } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

interface BulkResult {
  success: boolean;
  id?: number;
  error?: string;
}

export function createBulkCommand(): Command {
  const cmd = new Command('bulk')
    .description('Bulk operations for efficient data management');

  // Bulk tag command
  cmd
    .command('tag')
    .description('Add tags to multiple contacts')
    .requiredOption('-c, --contacts <ids>', 'Contact IDs (comma-separated)')
    .requiredOption('-t, --tags <tags>', 'Tags to add (comma-separated)')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .action(async (options) => {
      const format = fmt.resolveOutputFormat(options.format as OutputFormat);
      const contactIds = options.contacts.split(',').map((id: string) => parseInt(id.trim(), 10));
      const tags = options.tags.split(',').map((tag: string) => tag.trim());

      const results: BulkResult[] = [];

      try {
        for (const contactId of contactIds) {
          try {
            await api.setContactTags(contactId, tags);
            results.push({ success: true, id: contactId });
          } catch (error) {
            results.push({ success: false, id: contactId, error: (error as Error).message });
          }
        }

        outputBulkResults(results, format, 'tag');
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  // Bulk star command
  cmd
    .command('star')
    .description('Star multiple contacts')
    .requiredOption('-c, --contacts <ids>', 'Contact IDs (comma-separated)')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .action(async (options) => {
      const format = fmt.resolveOutputFormat(options.format as OutputFormat);
      const contactIds = options.contacts.split(',').map((id: string) => parseInt(id.trim(), 10));

      const results: BulkResult[] = [];

      try {
        for (const contactId of contactIds) {
          try {
            const contact = await api.getContact(contactId);
            if (!contact.data.is_starred) {
              await api.updateContact(contactId, {
                first_name: contact.data.first_name,
                last_name: contact.data.last_name ?? undefined,
                gender_id: (contact.data.gender as { id?: number })?.id || 1,
                is_birthdate_known: false,
                is_deceased: false,
                is_deceased_date_known: false,
                is_starred: true,
              });
            }
            results.push({ success: true, id: contactId });
          } catch (error) {
            results.push({ success: false, id: contactId, error: (error as Error).message });
          }
        }

        outputBulkResults(results, format, 'star');
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  // Bulk export command
  cmd
    .command('export')
    .description('Export contacts to JSON')
    .option('-c, --contacts <ids>', 'Contact IDs (comma-separated, or "all")')
    .option('-o, --output <file>', 'Output file path')
    .option('-f, --format <format>', 'Output format (toon|json|yaml)', 'json')
    .action(async (options) => {
      try {
        let contacts: Contact[] = [];

        if (options.contacts === 'all' || !options.contacts) {
          contacts = await api.listAllContacts();
        } else {
          const ids = options.contacts.split(',').map((id: string) => parseInt(id.trim(), 10));
          for (const id of ids) {
            try {
              const result = await api.getContact(id);
              contacts.push(result.data);
            } catch (error) {
              console.error(`Failed to get contact ${id}: ${(error as Error).message}`);
            }
          }
        }

        const output = JSON.stringify(contacts, null, 2);

        if (options.output) {
          const fs = await import('fs');
          fs.writeFileSync(options.output, output);
          console.log(fmt.formatSuccess(`Exported ${contacts.length} contacts to ${options.output}`));
        } else {
          console.log(output);
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  // Bulk delete command (with confirmation)
  cmd
    .command('delete')
    .description('Delete multiple contacts (use with caution)')
    .requiredOption('-c, --contacts <ids>', 'Contact IDs (comma-separated)')
    .option('--force', 'Skip confirmation (DANGEROUS)')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .action(async (options) => {
      const format = fmt.resolveOutputFormat(options.format as OutputFormat);
      const contactIds = options.contacts.split(',').map((id: string) => parseInt(id.trim(), 10));

      if (!options.force) {
        console.log('⚠️  DANGER: This will permanently delete the following contacts:');
        console.log(`   ${contactIds.join(', ')}\n`);
        console.log('Use --force to proceed with deletion.');
        console.log('Example: monica bulk delete --contacts 1,2,3 --force');
        process.exit(1);
      }

      const results: BulkResult[] = [];

      try {
        for (const contactId of contactIds) {
          try {
            await api.deleteContact(contactId);
            results.push({ success: true, id: contactId });
          } catch (error) {
            results.push({ success: false, id: contactId, error: (error as Error).message });
          }
        }

        outputBulkResults(results, format, 'delete');
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}

function outputBulkResults(results: BulkResult[], format: OutputFormat, operation: string): void {
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  if (format === 'json') {
    console.log(JSON.stringify({ operation, results, summary: { success: successCount, failed: failCount } }, null, 2));
  } else if (format === 'table') {
    console.log(`ID    | Status  | Error`);
    console.log(`------+---------+------------------------`);
    results.forEach(r => {
      const id = String(r.id).padStart(5);
      const status = r.success ? 'OK   ' : 'FAIL ';
      const error = r.error || '';
      console.log(`${id} | ${status} | ${error}`);
    });
    console.log(`\nSuccess: ${successCount}, Failed: ${failCount}`);
  } else {
    // toon format
    console.log(`Bulk Operation: ${operation}`);
    console.log(`Results:\n`);
    
    results.forEach((r, idx) => {
      console.log(`── [${idx}] ──`);
      console.log(`  id: ${r.id}`);
      console.log(`  status: ${r.success ? 'success' : 'failed'}`);
      if (r.error) {
        console.log(`  error: "${r.error}"`);
      }
      console.log();
    });

    console.log(`Summary: ${successCount} success, ${failCount} failed`);
  }

  if (failCount > 0) {
    process.exit(1);
  }
}
