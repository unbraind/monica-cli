import type { JournalCreateInput, JournalEntry, JournalUpdateInput } from '../types';
import * as api from '../api';
import { createCrudCommand } from './crud-command';

const JOURNAL_FIELDS = ['id', 'title', 'post', 'created_at'];

/** Build the journal-entry CRUD command family. */
export function createJournalCommand() {
  return createCrudCommand<JournalEntry, JournalCreateInput, JournalUpdateInput>({
    name: 'journal',
    description: 'Manage journal entries',
    singular: 'journal entry',
    label: 'Journal entry',
    fields: JOURNAL_FIELDS,
    listPage: api.listJournalEntries,
    listAll: () => api.listAllJournalEntries(),
    get: api.getJournalEntry,
    create: api.createJournalEntry,
    update: api.updateJournalEntry,
    remove: api.deleteJournalEntry,
    configureCreate: (command) => command
      .requiredOption('--post <text>', 'Journal content')
      .option('--title <title>', 'Entry title'),
    configureUpdate: (command) => command
      .option('--post <text>', 'Journal content')
      .option('--title <title>', 'Entry title'),
    buildCreateInput: (options) => ({
      post: options.post as string,
      title: options.title as string | undefined,
    }),
    buildUpdateInput: (options, current) => ({
      post: (options.post as string | undefined) ?? current.post,
      title: (options.title as string | undefined) ?? current.title,
    }),
  });
}
