import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createAddressesCommand(): Command {
  const cmd = new Command('addresses')
    .description('Manage contact addresses')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  const AddressFields = ['id', 'name', 'street', 'city', 'province', 'postal_code', 'country'];

  cmd
    .command('list')
    .description('List all addresses')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (options.all) {
          const addresses = await api.listAllAddresses();
          console.log(fmt.formatOutput(addresses, format, { fields: AddressFields }));
        } else {
          const result = await api.listAddresses({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, AddressFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific address')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getAddress(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new address')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .option('--name <name>', 'Address name/label')
    .option('--street <street>', 'Street address')
    .option('--city <city>', 'City')
    .option('--province <province>', 'Province/State')
    .option('--postal-code <code>', 'Postal/ZIP code')
    .option('--country <iso>', 'Country ISO code')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.createAddress({
          contact_id: options.contact,
          name: options.name,
          street: options.street,
          city: options.city,
          province: options.province,
          postal_code: options.postalCode,
          country_id: options.country,
        });
        console.log(fmt.formatSuccess('Address created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update an address')
    .option('--name <name>', 'Address name/label')
    .option('--street <street>', 'Street address')
    .option('--city <city>', 'City')
    .option('--province <province>', 'Province/State')
    .option('--postal-code <code>', 'Postal/ZIP code')
    .option('--country <iso>', 'Country ISO code')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const current = await api.getAddress(parseInt(id));
        const result = await api.updateAddress(parseInt(id), {
          contact_id: current.data.contact?.id || 0,
          name: options.name ?? current.data.name,
          street: options.street ?? current.data.street,
          city: options.city ?? current.data.city,
          province: options.province ?? current.data.province,
          postal_code: options.postalCode ?? current.data.postal_code,
          country_id: options.country ?? current.data.country?.id,
        });
        console.log(fmt.formatSuccess('Address updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete an address')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deleteAddress(parseInt(id));
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
