import type { Command } from 'commander';
import type { Occupation, OccupationCreateInput, OccupationUpdateInput } from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';
import { parsePositiveInteger } from './global-options';

const OCCUPATION_FIELDS = ['id', 'company', 'job', 'active', 'start_date', 'end_date', 'created_at'];

/** Add source-supported occupation fields to a create or update command. */
function addOccupationOptions(command: Command): Command {
  return command
    .option('--company <name>', 'Company name')
    .option('--job <title>', 'Job title')
    .option('--active', 'Is current job')
    .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date (YYYY-MM-DD)');
}

/** Build the contact-occupation CRUD command family. */
export function createOccupationsCommand() {
  return createCrudCommand<Occupation, OccupationCreateInput, OccupationUpdateInput>({
    name: 'occupations',
    description: 'Manage occupations',
    singular: 'occupation',
    label: 'Occupation',
    fields: OCCUPATION_FIELDS,
    listPage: api.listOccupations,
    listAll: () => api.listAllOccupations(),
    get: api.getOccupation,
    create: api.createOccupation,
    update: api.updateOccupation,
    remove: api.deleteOccupation,
    configureCreate: (command) => addOccupationOptions(command)
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger),
    configureUpdate: addOccupationOptions,
    buildCreateInput: (options) => ({
      contact_id: options.contact as number,
      company: options.company as string | undefined,
      job: options.job as string | undefined,
      active: options.active as boolean | undefined,
      start_date: options.startDate as string | undefined,
      end_date: options.endDate as string | undefined,
    }),
    buildUpdateInput: (options, current) => ({
      contact_id: current.contact?.id ?? 0,
      company: (options.company as string | undefined) ?? current.company ?? undefined,
      job: (options.job as string | undefined) ?? current.job ?? undefined,
      active: (options.active as boolean | undefined) ?? current.active,
      start_date: (options.startDate as string | undefined) ?? current.start_date ?? undefined,
      end_date: (options.endDate as string | undefined) ?? current.end_date ?? undefined,
    }),
  });
}
