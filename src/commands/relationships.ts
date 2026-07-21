import type { Command } from 'commander';
import { Command as CommanderCommand } from 'commander';
import * as api from '../api';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

const RELATIONSHIP_FIELDS = ['id', 'relationship_type', 'contact', 'created_at'];

/** Build relationship and relationship-metadata commands. */
export function createRelationshipsCommand(): Command {
  const command = new CommanderCommand('relationships').description('Manage relationships')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parsePositiveInteger)
    .option('-l, --limit <limit>', 'Items per page', parsePositiveInteger);

  command.command('list <contact-id>').description('List relationships for a contact')
    .action(async function (this: Command, contactId: string): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.listRelationships(
          parsePositiveInteger(contactId), { page, limit },
        );
        console.log(fmt.formatPaginatedResponse(
          result, resolveCommandOutputFormat(this), RELATIONSHIP_FIELDS,
        ));
      });
    });
  command.command('get <id>').description('Get a specific relationship')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.getRelationship(parsePositiveInteger(id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  command.command('create').description('Create a new relationship')
    .requiredOption('--contact <id>', 'Contact ID', parsePositiveInteger)
    .requiredOption('--related-contact <id>', 'Related contact ID', parsePositiveInteger)
    .requiredOption('--type <id>', 'Relationship type ID', parsePositiveInteger)
    .action(async function (this: Command): Promise<void> {
      await runCommandAction(async () => {
        const options = this.opts() as { contact: number; relatedContact: number; type: number };
        const result = await api.createRelationship({
          contact_id: options.contact,
          related_contact_id: options.relatedContact,
          relationship_type_id: options.type,
        });
        console.log(fmt.formatSuccess('Relationship created', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  command.command('update <id>').description('Update a relationship')
    .requiredOption('--type <id>', 'Relationship type ID', parsePositiveInteger)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.updateRelationship(parsePositiveInteger(id), {
          relationship_type_id: (this.opts() as { type: number }).type,
        });
        console.log(fmt.formatSuccess('Relationship updated', result.data.id));
        console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
      });
    });
  command.command('delete <id>').description('Delete a relationship')
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.deleteRelationship(parsePositiveInteger(id));
        console.log(resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify(result) : fmt.formatDeleted(result.id));
      });
    });

  for (const resource of [
    { name: 'types', description: 'List all relationship types', load: api.listRelationshipTypes },
    { name: 'groups', description: 'List all relationship type groups', load: api.listRelationshipTypeGroups },
  ]) {
    command.command(resource.name).description(resource.description)
      .action(async function (this: Command): Promise<void> {
        await runCommandAction(async () => {
          const result = await resource.load();
          console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
        });
      });
  }
  for (const resource of [
    { name: 'type', description: 'Get a specific relationship type', load: api.getRelationshipType },
    { name: 'group', description: 'Get a specific relationship type group', load: api.getRelationshipTypeGroup },
  ]) {
    command.command(`${resource.name} <id>`).description(resource.description)
      .action(async function (this: Command, id: string): Promise<void> {
        await runCommandAction(async () => {
          const result = await resource.load(parsePositiveInteger(id));
          console.log(fmt.formatOutput(result.data, resolveCommandOutputFormat(this)));
        });
      });
  }
  return command;
}
