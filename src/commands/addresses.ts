import type { Command } from 'commander';
import type { Address, AddressCreateInput, AddressUpdateInput } from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';
import { parsePositiveInteger } from './global-options';

const ADDRESS_FIELDS = ['id', 'name', 'street', 'city', 'province', 'postal_code', 'country'];

function addAddressOptions(command: Command): Command {
  return command
    .option('--name <name>', 'Address name/label')
    .option('--street <street>', 'Street address')
    .option('--city <city>', 'City')
    .option('--province <province>', 'Province/State')
    .option('--postal-code <code>', 'Postal/ZIP code')
    .option('--country <iso>', 'Country ISO code');
}

/** Build the contact-address CRUD command family. */
export function createAddressesCommand() {
  return createCrudCommand<Address, AddressCreateInput, AddressUpdateInput>({
    name: 'addresses',
    description: 'Manage contact addresses',
    singular: 'address',
    label: 'Address',
    fields: ADDRESS_FIELDS,
    listPage: api.listAddresses,
    listAll: () => api.listAllAddresses(),
    get: api.getAddress,
    create: api.createAddress,
    update: api.updateAddress,
    remove: api.deleteAddress,
    configureCreate: (command) => addAddressOptions(command)
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger),
    configureUpdate: addAddressOptions,
    buildCreateInput: (options) => ({
      contact_id: options.contact as number,
      name: options.name as string | undefined,
      street: options.street as string | undefined,
      city: options.city as string | undefined,
      province: options.province as string | undefined,
      postal_code: options.postalCode as string | undefined,
      country_id: options.country as string | undefined,
    }),
    buildUpdateInput: (options, current) => ({
      contact_id: current.contact?.id ?? 0,
      name: (options.name as string | undefined) ?? current.name ?? undefined,
      street: (options.street as string | undefined) ?? current.street ?? undefined,
      city: (options.city as string | undefined) ?? current.city ?? undefined,
      province: (options.province as string | undefined) ?? current.province ?? undefined,
      postal_code: (options.postalCode as string | undefined) ?? current.postal_code ?? undefined,
      country_id: (options.country as string | undefined) ?? current.country?.id,
    }),
  });
}
