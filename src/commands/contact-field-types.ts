import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

const ContactFieldTypeFields = ['id', 'name', 'type', 'delible', 'protocol'];

export function createContactFieldTypesCommand(): Command {
  const cmd = new Command('contact-field-types')
    .description('Manage contact field types')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all contact field types')
    .action(async (_options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.listContactFieldTypes({
          page: parentOpts.page,
          limit: parentOpts.limit,
        });
        console.log(fmt.formatPaginatedResponse(result, format, ContactFieldTypeFields));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific contact field type')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.getContactFieldType(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new contact field type')
    .requiredOption('--name <name>', 'Contact field type name')
    .option('--icon <icon>', 'FontAwesome icon class')
    .option('--protocol <protocol>', 'Protocol (e.g., mailto:, tel:)')
    .option('--delible', 'Can be deleted', false)
    .option('--type <type>', 'Type identifier')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.createContactFieldType({
          name: options.name,
          fontawesome_icon: options.icon,
          protocol: options.protocol,
          delible: options.delible ? 1 : 0,
          type: options.type,
        });
        console.log(fmt.formatSuccess('Contact field type created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a contact field type')
    .requiredOption('--name <name>', 'Contact field type name')
    .option('--icon <icon>', 'FontAwesome icon class')
    .option('--protocol <protocol>', 'Protocol (e.g., mailto:, tel:)')
    .option('--delible', 'Can be deleted', false)
    .option('--type <type>', 'Type identifier')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.updateContactFieldType(parseInt(id), {
          name: options.name,
          fontawesome_icon: options.icon,
          protocol: options.protocol,
          delible: options.delible ? 1 : 0,
          type: options.type,
        });
        console.log(fmt.formatSuccess('Contact field type updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a contact field type')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.deleteContactFieldType(parseInt(id));
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
