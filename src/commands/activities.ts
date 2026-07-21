import type { Activity, ActivityCreateInput, ActivityUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand } from './crud-command';
import { parsePositiveInteger } from './global-options';

/** Parse a comma-separated list of Monica resource identifiers. */
export function parseResourceIds(value: string): number[] {
  return value.split(',').map((id) => parsePositiveInteger(id.trim()));
}

/** Build the activity CRUD command family. */
export function createActivitiesCommand() {
  return createCrudCommand<Activity, ActivityCreateInput, ActivityUpdateInput>({
    name: 'activities',
    description: 'Manage activities',
    singular: 'activity',
    label: 'Activity',
    fields: fmt.ActivityFields,
    listPage: api.listActivities,
    listAll: () => api.listAllActivities(),
    get: api.getActivity,
    create: api.createActivity,
    update: api.updateActivity,
    remove: api.deleteActivity,
    configureCreate: (command) => command
      .requiredOption('--type <id>', 'Activity type ID', parsePositiveInteger)
      .requiredOption('--summary <text>', 'Summary')
      .requiredOption('--date <date>', 'Date (YYYY-MM-DD)')
      .requiredOption('--contacts <ids>', 'Contact IDs (comma-separated)', parseResourceIds)
      .option('--description <text>', 'Description'),
    configureUpdate: (command) => command
      .option('--type <id>', 'Activity type ID', parsePositiveInteger)
      .option('--summary <text>', 'Summary')
      .option('--date <date>', 'Date (YYYY-MM-DD)')
      .option('--contacts <ids>', 'Contact IDs (comma-separated)', parseResourceIds)
      .option('--description <text>', 'Description'),
    buildCreateInput: (options) => ({
      activity_type_id: options.type as number,
      summary: options.summary as string,
      description: options.description as string | undefined,
      happened_at: options.date as string,
      contacts: options.contacts as number[],
    }),
    buildUpdateInput: (options, current) => ({
      activity_type_id: (options.type as number | undefined) ?? current.activity_type?.id ?? 1,
      summary: (options.summary as string | undefined) ?? current.summary,
      description: (options.description as string | undefined) ?? current.description ?? undefined,
      happened_at: (options.date as string | undefined) ?? current.happened_at,
      contacts: (options.contacts as number[] | undefined)
        ?? current.attendees.contacts.map((contact) => contact.id),
    }),
  });
}
