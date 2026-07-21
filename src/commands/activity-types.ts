import type { Command } from 'commander';
import type { ActivityType, ActivityTypeCreateInput, ActivityTypeUpdateInput } from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';
import { parsePositiveInteger } from './global-options';

const ACTIVITY_TYPE_FIELDS = ['id', 'name', 'location_type', 'created_at'];

/** Add required activity-type fields to create and update commands. */
function addActivityTypeOptions(command: Command): Command {
  return command
    .requiredOption('--name <name>', 'Activity type name')
    .requiredOption('--category-id <id>', 'Activity type category ID', parsePositiveInteger);
}

/** Build the activity-type CRUD command family. */
export function createActivityTypesCommand() {
  return createCrudCommand<ActivityType, ActivityTypeCreateInput, ActivityTypeUpdateInput>({
    name: 'activity-types',
    description: 'Manage activity types',
    singular: 'activity type',
    label: 'Activity type',
    fields: ACTIVITY_TYPE_FIELDS,
    listPage: api.listActivityTypes,
    get: api.getActivityType,
    create: api.createActivityType,
    update: api.updateActivityType,
    remove: api.deleteActivityType,
    configureCreate: addActivityTypeOptions,
    configureUpdate: addActivityTypeOptions,
    buildCreateInput: (options) => ({
      name: options.name as string,
      activity_type_category_id: options.categoryId as number,
    }),
    buildUpdateInput: (options) => ({
      name: options.name as string,
      activity_type_category_id: options.categoryId as number,
    }),
  });
}
