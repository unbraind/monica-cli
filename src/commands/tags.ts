import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

export function createTagsCommand(): Command {
  const cmd = new Command('tags')
    .description('Manage tags')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseInt)
    .option('-l, --limit <limit>', 'Items per page', parseInt);

  cmd
    .command('list')
    .description('List all tags')
    .option('--all', 'Fetch all pages')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        if (options.all) {
          const tags = await api.listAllTags();
          console.log(fmt.formatOutput(tags, format, { fields: fmt.TagFields }));
        } else {
          const result = await api.listTags({
            page: parentOpts.page,
            limit: parentOpts.limit,
          });
          console.log(fmt.formatPaginatedResponse(result, format, fmt.TagFields));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific tag')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.getTag(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new tag')
    .requiredOption('--name <name>', 'Tag name')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.createTag({ name: options.name });
        console.log(fmt.formatSuccess('Tag created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a tag')
    .requiredOption('--name <name>', 'Tag name')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.updateTag(parseInt(id), { name: options.name });
        console.log(fmt.formatSuccess('Tag updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a tag')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.deleteTag(parseInt(id));
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
    .command('set <contactId>')
    .description('Set tags on a contact')
    .requiredOption('--tags <tags>', 'Tag names (comma-separated)')
    .action(async (contactId, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const tags = options.tags.split(',').map((t: string) => t.trim());
        const result = await api.setContactTags(parseInt(contactId), tags);
        console.log(fmt.formatSuccess('Tags set on contact', result.data.id));
        console.log(fmt.formatOutput(result.data.tags, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('unset <contactId>')
    .description('Remove specific tags from a contact')
    .requiredOption('--tag-ids <ids>', 'Tag IDs to remove (comma-separated)')
    .action(async (contactId, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const tagIds = options.tagIds.split(',').map((id: string) => parseInt(id.trim()));
        const result = await api.unsetContactTag(parseInt(contactId), tagIds);
        console.log(fmt.formatSuccess('Tags removed from contact', result.data.id));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('clear <contactId>')
    .description('Remove all tags from a contact')
    .action(async (contactId, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.unsetAllContactTags(parseInt(contactId));
        console.log(fmt.formatSuccess('All tags removed from contact', result.data.id));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('contacts <tagId>')
    .description('List contacts with a specific tag')
    .action(async (tagId, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      
      try {
        const result = await api.listContactsByTag(parseInt(tagId), {
          page: parentOpts.page,
          limit: parentOpts.limit,
        });
        console.log(fmt.formatPaginatedResponse(result, format, fmt.ContactFields));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
