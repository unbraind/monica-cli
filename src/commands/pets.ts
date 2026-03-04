import { Command } from 'commander';
import type { OutputFormat, PetUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

const PetFields = ['id', 'name', 'pet_category', 'created_at'];

export function createPetsCommand(): Command {
  const cmd = new Command('pets')
    .description('Manage pets')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all pets')
    .option('--contact-id <id>', 'Filter by contact ID', parseInt)
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        if (options.all) {
          const pets = await api.listAllPets();
          console.log(fmt.formatOutput(pets, format, { fields: PetFields }));
        } else if (options.contactId) {
          const result = await api.listContactPets(options.contactId, {
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, PetFields));
        } else {
          const result = await api.listPets({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, PetFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific pet')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.getPet(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new pet')
    .requiredOption('--contact-id <id>', 'Contact ID', parseInt)
    .requiredOption('--name <name>', 'Pet name')
    .requiredOption('--category-id <id>', 'Pet category ID', parseInt)
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.createPet({
          contact_id: options.contactId,
          name: options.name,
          pet_category_id: options.categoryId,
        });
        console.log(fmt.formatSuccess('Pet created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a pet')
    .option('--name <name>', 'Pet name')
    .option('--category-id <id>', 'Pet category ID', parseInt)
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const updateData: PetUpdateInput = {};
        if (options.name) updateData.name = options.name;
        if (options.categoryId) updateData.pet_category_id = options.categoryId;
        
        const result = await api.updatePet(parseInt(id), updateData);
        console.log(fmt.formatSuccess('Pet updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a pet')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.deletePet(parseInt(id));
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
