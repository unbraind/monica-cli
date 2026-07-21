import type { Gender, GenderCreateInput, GenderUpdateInput } from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';

const GENDER_FIELDS = ['id', 'name', 'type', 'created_at'];

/** Build the gender CRUD command family. */
export function createGendersCommand() {
  return createCrudCommand<Gender, GenderCreateInput, GenderUpdateInput>({
    name: 'genders',
    description: 'Manage genders',
    singular: 'gender',
    label: 'Gender',
    fields: GENDER_FIELDS,
    listPage: api.listGenders,
    get: api.getGender,
    create: api.createGender,
    update: api.updateGender,
    remove: api.deleteGender,
    configureCreate: (command) => command.requiredOption('--name <name>', 'Gender name'),
    configureUpdate: (command) => command.requiredOption('--name <name>', 'Gender name'),
    buildCreateInput: (options) => ({ name: options.name as string }),
    buildUpdateInput: (options) => ({ name: options.name as string }),
  });
}
