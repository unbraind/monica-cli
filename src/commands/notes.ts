import type { Note, NoteCreateInput, NoteUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand } from './crud-command';
import { parsePositiveInteger } from './global-options';

/** Build the contact-note CRUD command family. */
export function createNotesCommand() {
  return createCrudCommand<Note, NoteCreateInput, NoteUpdateInput>({
    name: 'notes',
    description: 'Manage notes',
    singular: 'note',
    label: 'Note',
    fields: fmt.NoteFields,
    listPage: api.listNotes,
    listAll: () => api.listAllNotes(),
    get: api.getNote,
    create: api.createNote,
    update: api.updateNote,
    remove: api.deleteNote,
    configureCreate: (command) => command
      .requiredOption('--body <text>', 'Note body')
      .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
      .option('--favorite', 'Mark as favorite'),
    configureUpdate: (command) => command
      .option('--body <text>', 'Note body')
      .option('--contact <id>', 'Contact ID', parsePositiveInteger)
      .option('--favorite', 'Mark as favorite')
      .option('--no-favorite', 'Remove favorite'),
    buildCreateInput: (options) => ({
      body: options.body as string,
      contact_id: options.contact as number,
      is_favorited: options.favorite === true ? 1 : 0,
    }),
    buildUpdateInput: (options, current) => ({
      body: (options.body as string | undefined) ?? current.body,
      contact_id: (options.contact as number | undefined) ?? current.contact?.id ?? 0,
      is_favorited: options.favorite === undefined
        ? (current.is_favorited ? 1 : 0)
        : (options.favorite ? 1 : 0),
    }),
  });
}
