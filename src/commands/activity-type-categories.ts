import type {
  ActivityTypeCategory,
  ActivityTypeCategoryCreateInput,
  ActivityTypeCategoryUpdateInput,
} from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';

const CATEGORY_FIELDS = ['id', 'name', 'created_at'];

/** Build the activity-type-category CRUD command family. */
export function createActivityTypeCategoriesCommand() {
  return createCrudCommand<
    ActivityTypeCategory,
    ActivityTypeCategoryCreateInput,
    ActivityTypeCategoryUpdateInput
  >({
    name: 'activity-type-categories',
    description: 'Manage activity type categories',
    singular: 'activity type category',
    label: 'Activity type category',
    fields: CATEGORY_FIELDS,
    listPage: api.listActivityTypeCategories,
    get: api.getActivityTypeCategory,
    create: api.createActivityTypeCategory,
    update: api.updateActivityTypeCategory,
    remove: api.deleteActivityTypeCategory,
    configureCreate: (command) => command.requiredOption('--name <name>', 'Category name'),
    configureUpdate: (command) => command.requiredOption('--name <name>', 'Category name'),
    buildCreateInput: (options) => ({ name: options.name as string }),
    buildUpdateInput: (options) => ({ name: options.name as string }),
  });
}
