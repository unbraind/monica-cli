import type { Pet, PetCreateInput, PetUpdateInput } from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';
import { parsePositiveInteger } from './global-options';

const PET_FIELDS = ['id', 'name', 'pet_category', 'created_at'];

/** Build the pet CRUD command family with optional contact-scoped listing. */
export function createPetsCommand() {
  return createCrudCommand<Pet, PetCreateInput, PetUpdateInput>({
    name: 'pets', description: 'Manage pets', singular: 'pet', label: 'Pet', fields: PET_FIELDS,
    listPage: (pagination, options) => {
      const contactId = options?.contactId as number | undefined;
      return contactId === undefined
        ? api.listPets(pagination)
        : api.listContactPets(contactId, pagination);
    },
    listAll: () => api.listAllPets(),
    get: api.getPet,
    create: api.createPet,
    update: api.updatePet,
    remove: api.deletePet,
    configureList: (candidate) => candidate.option(
      '--contact-id <id>', 'Filter by contact ID', parsePositiveInteger,
    ),
    configureCreate: (candidate) => candidate
      .requiredOption('--contact-id <id>', 'Contact ID', parsePositiveInteger)
      .requiredOption('--name <name>', 'Pet name')
      .requiredOption('--category-id <id>', 'Pet category ID', parsePositiveInteger),
    configureUpdate: (candidate) => candidate
      .option('--name <name>', 'Pet name')
      .option('--category-id <id>', 'Pet category ID', parsePositiveInteger),
    buildCreateInput: (options) => ({
      contact_id: options.contactId as number,
      name: options.name as string,
      pet_category_id: options.categoryId as number,
    }),
    buildUpdateInput: (options) => ({
      name: options.name as string | undefined,
      pet_category_id: options.categoryId as number | undefined,
    }),
  });
}
