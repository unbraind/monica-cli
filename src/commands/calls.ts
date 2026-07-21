import type { Call, CallCreateInput, CallUpdateInput } from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';
import { parsePositiveInteger } from './global-options';

const CALL_FIELDS = ['id', 'called_at', 'content', 'created_at'];

/** Build the contact-call CRUD command family. */
export function createCallsCommand() {
  return createCrudCommand<Call, CallCreateInput, CallUpdateInput>({
    name: 'calls',
    description: 'Manage calls with contacts',
    singular: 'call',
    label: 'Call',
    fields: CALL_FIELDS,
    listPage: api.listCalls,
    listAll: () => api.listAllCalls(),
    get: api.getCall,
    create: api.createCall,
    update: api.updateCall,
    remove: api.deleteCall,
    configureCreate: (command) => command
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
      .requiredOption('--content <text>', 'Call content/notes')
      .requiredOption('--date <date>', 'Date of call (YYYY-MM-DD)'),
    configureUpdate: (command) => command
      .option('--content <text>', 'Call content/notes')
      .option('--date <date>', 'Date of call (YYYY-MM-DD)'),
    buildCreateInput: (options) => ({
      contact_id: options.contact as number,
      content: options.content as string,
      called_at: options.date as string,
    }),
    buildUpdateInput: (options, current) => ({
      contact_id: current.contact?.id ?? 0,
      content: (options.content as string | undefined) ?? current.content ?? '',
      called_at: (options.date as string | undefined) ?? current.called_at,
    }),
  });
}
