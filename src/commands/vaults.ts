import { Command } from 'commander';
import type { OutputFormat, VaultPatchInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';
import { runCommandAction } from './crud-command';

function addVaultInputOptions(command: Command, requireName: boolean): Command {
  const configured = requireName
    ? command.requiredOption('--name <name>', 'Vault name')
    : command.option('--name <name>', 'Vault name');
  return configured.option('--description <description>', 'Vault description');
}

/** Build the current Monica API vault command tree. */
export function createVaultsCommand(): Command {
  const command = new Command('vaults')
    .description('Manage vaults from the current Monica API')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);

  command.command('list').description('List vaults').option('--all', 'Fetch all pages')
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const format = resolveCommandOutputFormat(this) as OutputFormat;
        if ((this.opts() as { all?: boolean }).all) {
          console.log(fmt.formatOutput(await api.listAllVaults(), format, { fields: fmt.VaultFields }));
          return;
        }
        const parentOptions = this.parent?.opts() as { page?: number; limit?: number };
        console.log(fmt.formatPaginatedResponse(await api.listVaults({
          page: parentOptions.page,
          limit: parentOptions.limit,
        }), format, fmt.VaultFields));
      });
    });

  command.command('get <id>').description('Get one vault by UUID')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        console.log(fmt.formatOutput((await api.getVault(id)).data, resolveCommandOutputFormat(this)));
      });
    });

  addVaultInputOptions(command.command('create').description('Create a vault'), true)
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const input = this.opts() as { name: string; description?: string };
        const result = await api.createVault(input);
        console.log(fmt.formatSuccess('Vault created', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  addVaultInputOptions(command.command('update <id>').description('Replace a vault with HTTP PUT'), true)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const input = this.opts() as { name: string; description?: string };
        const result = await api.updateVault(id, input);
        console.log(fmt.formatSuccess('Vault updated', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  addVaultInputOptions(command.command('patch <id>').description('Partially update a vault with HTTP PATCH'), false)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const options = this.opts() as VaultPatchInput;
        if (options.name === undefined && options.description === undefined) {
          throw new Error('Provide at least one of --name or --description when patching a vault');
        }
        const result = await api.patchVault(id, {
          name: options.name,
          description: options.description,
        });
        console.log(fmt.formatSuccess('Vault patched', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });

  command.command('delete <id>').description('Delete a vault and everything it contains')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.deleteVault(id);
        console.log(resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result)
          : fmt.formatDeleted(result.id));
      });
    });

  return command;
}
