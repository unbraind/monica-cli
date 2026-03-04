import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createNotesCommand(): Command {
  const cmd = new Command('notes')
    .description('Manage notes')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all notes')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        if (options.all) {
          const notes = await api.listAllNotes();
          console.log(fmt.formatOutput(notes, format, { fields: fmt.NoteFields }));
        } else {
          const result = await api.listNotes({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, fmt.NoteFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific note')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.getNote(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new note')
    .requiredOption('--body <text>', 'Note body')
    .requiredOption('--contact <id>', 'Contact ID', parseInt)
    .option('--favorite', 'Mark as favorite')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.createNote({
          body: options.body,
          contact_id: options.contact,
          is_favorited: options.favorite ? 1 : 0,
        });
        console.log(fmt.formatSuccess('Note created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a note')
    .option('--body <text>', 'Note body')
    .option('--contact <id>', 'Contact ID', parseInt)
    .option('--favorite', 'Mark as favorite')
    .option('--no-favorite', 'Remove favorite')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const current = await api.getNote(parseInt(id));
        const data = current.data;
        
        const result = await api.updateNote(parseInt(id), {
          body: options.body || data.body,
          contact_id: options.contact || data.contact?.id || 0,
          is_favorited: options.favorite !== undefined ? (options.favorite ? 1 : 0) : (data.is_favorited ? 1 : 0),
        });
        console.log(fmt.formatSuccess('Note updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a note')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.deleteNote(parseInt(id));
        if (format === 'json') {
          console.log(JSON.stringify(result));
        } else {
          console.log(fmt.formatDeleted(result.id));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
