import * as fs from 'fs';
import { type Command, Command as CommanderCommand } from 'commander';
import type { ApiResponse, DeleteResponse, PaginatedResponse } from '../types';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

interface AttachmentResource {
  id: number;
}

interface AttachmentCommandConfig<Resource extends AttachmentResource> {
  name: string;
  singular: string;
  fields: string[];
  listPage: (options: { page?: number; limit?: number }) => Promise<PaginatedResponse<Resource>>;
  listAll: () => Promise<Resource[]>;
  get: (id: number) => Promise<ApiResponse<Resource>>;
  remove: (id: number) => Promise<DeleteResponse>;
  upload: (contactId: number, filePath: string) => Promise<ApiResponse<Resource>>;
}

/** Build a read/list/delete/upload command family for Monica attachments. */
export function createAttachmentCommand<Resource extends AttachmentResource>(
  config: AttachmentCommandConfig<Resource>,
): Command {
  const command = new CommanderCommand(config.name)
    .description(`Manage ${config.name}`)
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);

  command.command('list').description(`List all ${config.name}`).option('--all', 'Fetch all pages')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const format = resolveCommandOutputFormat(this);
        if ((this.opts() as { all?: boolean }).all) {
          console.log(fmt.formatOutput(await config.listAll(), format, { fields: config.fields }));
          return;
        }
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await config.listPage({ page, limit });
        console.log(fmt.formatPaginatedResponse(result, format, config.fields));
      });
    });

  command.command('get <id>').description(`Get a specific ${config.singular}`)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await config.get(parsePositiveInteger(id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  command.command('delete <id>').description(`Delete a ${config.singular}`)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await config.remove(parsePositiveInteger(id));
        console.log(resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result) : fmt.formatDeleted(result.id));
      });
    });

  command.command('upload <contact-id> <file>').description(`Upload a ${config.singular} for a contact`)
    .action(async function (this: Command, contactId: string, file: string): Promise<void> {
      await runCommandAction(async () => {
        if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`);
        const result = await config.upload(parsePositiveInteger(contactId), file);
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  return command;
}
