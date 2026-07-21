import type { Command } from 'commander';
import type {
  ContactFieldType,
  ContactFieldTypeCreateInput,
  ContactFieldTypeUpdateInput,
} from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';

const CONTACT_FIELD_TYPE_FIELDS = ['id', 'name', 'type', 'delible', 'protocol'];

/** Add contact-field-type metadata options to a command. */
function addContactFieldTypeOptions(command: Command): Command {
  return command
    .requiredOption('--name <name>', 'Contact field type name')
    .option('--icon <icon>', 'FontAwesome icon class')
    .option('--protocol <protocol>', 'Protocol (for example mailto: or tel:)')
    .option('--delible', 'Can be deleted')
    .option('--type <type>', 'Type identifier');
}

/** Build the contact-field-type CRUD command family. */
export function createContactFieldTypesCommand() {
  return createCrudCommand<
    ContactFieldType,
    ContactFieldTypeCreateInput,
    ContactFieldTypeUpdateInput
  >({
    name: 'contact-field-types',
    description: 'Manage contact field types',
    singular: 'contact field type',
    label: 'Contact field type',
    fields: CONTACT_FIELD_TYPE_FIELDS,
    listPage: api.listContactFieldTypes,
    get: api.getContactFieldType,
    create: api.createContactFieldType,
    update: api.updateContactFieldType,
    remove: api.deleteContactFieldType,
    configureCreate: addContactFieldTypeOptions,
    configureUpdate: addContactFieldTypeOptions,
    buildCreateInput: (options) => ({
      name: options.name as string,
      fontawesome_icon: options.icon as string | undefined,
      protocol: options.protocol as string | undefined,
      delible: options.delible === true ? 1 : 0,
      type: options.type as string | undefined,
    }),
    buildUpdateInput: (options) => ({
      name: options.name as string,
      fontawesome_icon: options.icon as string | undefined,
      protocol: options.protocol as string | undefined,
      delible: options.delible === true ? 1 : 0,
      type: options.type as string | undefined,
    }),
  });
}
