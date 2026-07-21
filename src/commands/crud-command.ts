import { Command } from 'commander';
import type { ApiResponse, DeleteResponse, PaginatedResponse } from '../types';
import * as fmt from '../formatters';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

interface IdentifiedResource {
  id: number;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

interface CrudCommandConfig<Resource extends IdentifiedResource, CreateInput, UpdateInput> {
  name: string;
  description: string;
  singular: string;
  label: string;
  fields: string[];
  listPage: (
    options: PaginationOptions,
    commandOptions?: Record<string, unknown>,
  ) => Promise<PaginatedResponse<Resource>>;
  listAll?: (options: { sort?: string; query?: string }) => Promise<Resource[]>;
  loadList?: (
    pagination: PaginationOptions,
    commandOptions: Record<string, unknown>,
  ) => Promise<Resource[] | PaginatedResponse<Resource>>;
  get: (id: number, commandOptions?: Record<string, unknown>) => Promise<ApiResponse<Resource>>;
  create: (input: CreateInput) => Promise<ApiResponse<Resource>>;
  update: (id: number, input: UpdateInput) => Promise<ApiResponse<Resource>>;
  remove: (id: number) => Promise<DeleteResponse>;
  configureCreate: (command: Command) => Command;
  configureUpdate: (command: Command) => Command;
  buildCreateInput: (options: Record<string, unknown>) => CreateInput;
  buildUpdateInput: (
    options: Record<string, unknown>,
    current: Resource,
  ) => UpdateInput | Promise<UpdateInput>;
  configureList?: (command: Command) => Command;
  configureGet?: (command: Command) => Command;
}

/** Run a CLI action with the repository-wide formatted error and exit contract. */
export async function runCommandAction(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    console.error(fmt.formatError(error as Error));
    process.exit(1);
  }
}

/** Build a consistent typed list/get/create/update/delete command family. */
export function createCrudCommand<
  Resource extends IdentifiedResource,
  CreateInput,
  UpdateInput,
>(config: CrudCommandConfig<Resource, CreateInput, UpdateInput>): Command {
  const command = new Command(config.name)
    .description(config.description)
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);

  const list = command.command('list').description(`List all ${config.name}`);
  if (config.listAll) list.option('--all', 'Fetch all pages');
  (config.configureList ?? ((candidate) => candidate))(list)
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const options = this.opts() as { all?: boolean; sort?: string; query?: string };
        const format = resolveCommandOutputFormat(this);
        const parentOptions = this.parent?.opts() as PaginationOptions;
        const pagination = {
          page: parentOptions.page,
          limit: parentOptions.limit,
          sort: options.sort,
        };
        if (config.loadList) {
          const resources = await config.loadList(pagination, options);
          console.log(Array.isArray(resources)
            ? fmt.formatOutput(resources, format, { fields: config.fields })
            : fmt.formatPaginatedResponse(resources, format, config.fields));
          return;
        }
        if (options.all && config.listAll) {
          const resources = await config.listAll({ sort: options.sort, query: options.query });
          console.log(fmt.formatOutput(resources, format, { fields: config.fields }));
          return;
        }
        const result = await config.listPage(pagination, options);
        console.log(fmt.formatPaginatedResponse(result, format, config.fields));
      });
    });

  (config.configureGet ?? ((candidate) => candidate))(
    command.command('get <id>').description(`Get a specific ${config.singular}`),
  )
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await config.get(parsePositiveInteger(id), this.opts());
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  config.configureCreate(command.command('create').description(`Create a new ${config.singular}`))
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const result = await config.create(config.buildCreateInput(this.opts()));
        console.log(fmt.formatSuccess(`${config.label} created`, result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  config.configureUpdate(command.command('update <id>').description(`Update a ${config.singular}`))
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const resourceId = parsePositiveInteger(id);
        const current = await config.get(resourceId);
        const result = await config.update(
          resourceId,
          await config.buildUpdateInput(this.opts(), current.data),
        );
        console.log(fmt.formatSuccess(`${config.label} updated`, result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  command.command('delete <id>')
    .description(`Delete a ${config.singular}`)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await config.remove(parsePositiveInteger(id));
        const output = resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result)
          : fmt.formatDeleted(result.id);
        console.log(output);
      });
    });

  return command;
}
