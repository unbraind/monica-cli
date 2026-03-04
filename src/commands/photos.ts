import * as fs from 'fs';
import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createPhotosCommand(): Command {
  const cmd = new Command('photos')
    .description('Manage photos')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  const PhotoFields = ['id', 'original_filename', 'filesize', 'mime_type', 'created_at'];

  cmd
    .command('list')
    .description('List all photos')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (options.all) {
          const photos = await api.listAllPhotos();
          console.log(fmt.formatOutput(photos, format, { fields: PhotoFields }));
        } else {
          const result = await api.listPhotos({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, PhotoFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific photo')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getPhoto(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a photo')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deletePhoto(parseInt(id));
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

  cmd
    .command('upload <contactId> <file>')
    .description('Upload a photo for a contact')
    .action(async (contactId, file, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        if (!fs.existsSync(file)) {
          throw new Error(`File not found: ${file}`);
        }
        const result = await api.createPhoto(parseInt(contactId), file);
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
