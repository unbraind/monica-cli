import type { Command } from 'commander';
import type { Tag, TagCreateInput, TagUpdateInput } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand, runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { resolveCommandOutputFormat } from './output-format';

/** Parse and normalize a non-empty comma-separated string list. */
export function parseStringList(value: string): string[] {
  const values = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (values.length === 0) throw new Error('Expected at least one comma-separated value');
  return values;
}

/** Build the tag CRUD and contact-association command family. */
export function createTagsCommand(): Command {
  const command = createCrudCommand<Tag, TagCreateInput, TagUpdateInput>({
    name: 'tags', description: 'Manage tags', singular: 'tag', label: 'Tag', fields: fmt.TagFields,
    listPage: api.listTags,
    listAll: () => api.listAllTags(),
    get: api.getTag,
    create: api.createTag,
    update: api.updateTag,
    remove: api.deleteTag,
    configureCreate: (candidate) => candidate.requiredOption('--name <name>', 'Tag name'),
    configureUpdate: (candidate) => candidate.requiredOption('--name <name>', 'Tag name'),
    buildCreateInput: (options) => ({ name: options.name as string }),
    buildUpdateInput: (options) => ({ name: options.name as string }),
  });

  command.command('set <contact-id>').description('Set tags on a contact')
    .requiredOption('--tags <tags>', 'Tag names (comma-separated)', parseStringList)
    .action(async function (this: Command, contactId: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.setContactTags(
          parsePositiveInteger(contactId), (this.opts() as { tags: string[] }).tags,
        );
        console.log(fmt.formatSuccess('Tags set on contact', result.data.id));
        console.log(fmt.formatOutput(result.data.tags, resolveCommandOutputFormat(this)));
      });
    });

  command.command('unset <contact-id>').description('Remove specific tags from a contact')
    .requiredOption('--tag-ids <ids>', 'Tag IDs to remove (comma-separated)', (value: string) => (
      parseStringList(value).map(parsePositiveInteger)
    ))
    .action(async function (this: Command, contactId: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.unsetContactTag(
          parsePositiveInteger(contactId), (this.opts() as { tagIds: number[] }).tagIds,
        );
        console.log(fmt.formatSuccess('Tags removed from contact', result.data.id));
      });
    });

  command.command('clear <contact-id>').description('Remove all tags from a contact')
    .action(async function (this: Command, contactId: string): Promise<void> {
      await runCommandAction(async () => {
        const result = await api.unsetAllContactTags(parsePositiveInteger(contactId));
        console.log(fmt.formatSuccess('All tags removed from contact', result.data.id));
      });
    });

  command.command('contacts <tag-id>').description('List contacts with a specific tag')
    .action(async function (this: Command, tagId: string): Promise<void> {
      await runCommandAction(async () => {
        const { page, limit } = this.parent?.opts() as { page?: number; limit?: number };
        const result = await api.listContactsByTag(parsePositiveInteger(tagId), { page, limit });
        console.log(fmt.formatPaginatedResponse(
          result, resolveCommandOutputFormat(this), fmt.ContactFields,
        ));
      });
    });
  return command;
}
