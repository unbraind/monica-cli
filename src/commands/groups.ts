import { Command } from 'commander';
import type { OutputFormat, Group, Tag, PaginatedResponse } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';

interface GroupsListOptions {
  all?: boolean;
  scanTags?: boolean;
  autoScan?: boolean;
  tagMaxPages?: number;
}

const parseIntegerOption = (value: string): number => Number.parseInt(value, 10);

function parsePositiveIntOption(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Invalid positive integer: ${value}`);
  }
  return parsed;
}

function isGroupEndpointUnavailable(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number }).statusCode;
  return statusCode === 404 || statusCode === 405;
}

function resolveTagScanMaxPages(options: GroupsListOptions): number {
  if (typeof options.tagMaxPages === 'number') return options.tagMaxPages;
  return options.scanTags ? 10 : 1;
}

function mapTagToGroup(tag: Tag): Group {
  return {
    id: tag.id,
    object: 'group',
    name: tag.name,
    created_at: tag.created_at,
    updated_at: tag.updated_at,
  };
}

function mapTagPageToGroupPage(response: PaginatedResponse<Tag>): PaginatedResponse<Group> {
  return {
    ...response,
    data: response.data.map(mapTagToGroup),
  };
}

async function listGroupsByTagFallback(
  options: GroupsListOptions,
  params: { page?: number; limit?: number }
): Promise<{
  mode: 'all';
  groups: Group[];
} | {
  mode: 'page';
  groups: PaginatedResponse<Group>;
}> {
  if (options.all) {
    const tags = await api.listAllTags(resolveTagScanMaxPages(options));
    return {
      mode: 'all',
      groups: tags.map(mapTagToGroup),
    };
  }

  const tagPage = await api.listTags(params);
  return {
    mode: 'page',
    groups: mapTagPageToGroupPage(tagPage),
  };
}

export function createGroupsCommand(): Command {
  const cmd = new Command('groups')
    .description('Manage contact groups')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon')
    .option('-p, --page <page>', 'Page number', parseIntegerOption)
    .option('-l, --limit <limit>', 'Items per page', parseIntegerOption);

  const GroupFields = ['id', 'name', 'created_at'];

  cmd
    .command('list')
    .description('List all groups')
    .option('--all', 'Fetch all pages')
    .option('--scan-tags', 'Fallback to scanning tags when groups endpoint is unavailable')
    .option('--no-auto-scan', 'Disable automatic tag scan fallback when endpoint is unavailable')
    .option('--tag-max-pages <pages>', 'Maximum tag pages to scan in fallback mode', parsePositiveIntOption)
    .action(async (options: GroupsListOptions, cmdParent) => {
      const parentOpts = (cmdParent.parent?.opts() as { format?: OutputFormat; page?: number; limit?: number } | undefined) || cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        try {
          if (options.scanTags) {
            const fallback = await listGroupsByTagFallback(options, {
              page: parentOpts.page,
              limit: parentOpts.limit,
            });
            if (fallback.mode === 'all') {
              console.log(fmt.formatOutput(fallback.groups, format, { fields: GroupFields }));
            } else {
              console.log(fmt.formatPaginatedResponse(fallback.groups, format, GroupFields));
            }
            return;
          }

          if (options.all) {
            const groups = await api.listAllGroups();
            console.log(fmt.formatOutput(groups, format, { fields: GroupFields }));
          } else {
            const result = await api.listGroups({
              page: parentOpts.page,
              limit: parentOpts.limit,
            });
            console.log(fmt.formatPaginatedResponse(result, format, GroupFields));
          }
        } catch (error) {
          const autoScanEnabled = options.autoScan !== false;
          const shouldFallback = isGroupEndpointUnavailable(error) && autoScanEnabled;
          if (shouldFallback) {
            const fallback = await listGroupsByTagFallback(options, {
              page: parentOpts.page,
              limit: parentOpts.limit,
            });
            if (fallback.mode === 'all') {
              console.log(fmt.formatOutput(fallback.groups, format, { fields: GroupFields }));
            } else {
              console.log(fmt.formatPaginatedResponse(fallback.groups, format, GroupFields));
            }
            return;
          }

          if (isGroupEndpointUnavailable(error)) {
            throw new Error(
              'Groups endpoint is unavailable on this Monica instance. Use: monica groups list --scan-tags [--tag-max-pages <n>] or monica tags list --limit 50'
            );
          }

          throw error;
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('get <id>')
    .description('Get a specific group')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.getGroup(parseInt(id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('create')
    .description('Create a new group')
    .requiredOption('--name <name>', 'Group name')
    .action(async (options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.createGroup({ name: options.name });
        console.log(fmt.formatSuccess('Group created', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('update <id>')
    .description('Update a group')
    .option('--name <name>', 'Group name')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const current = await api.getGroup(parseInt(id));
        const result = await api.updateGroup(parseInt(id), {
          name: options.name || current.data.name,
        });
        console.log(fmt.formatSuccess('Group updated', result.data.id));
        console.log(fmt.formatOutput(result.data, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('delete <id>')
    .description('Delete a group')
    .action(async (id, _options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const result = await api.deleteGroup(parseInt(id));
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
    .command('attach-contacts <id>')
    .description('Attach contacts to a group')
    .requiredOption('--contacts <ids>', 'Comma-separated contact IDs')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const contactIds = options.contacts
          .split(',')
          .map((c: string) => parseInt(c.trim()));
        await api.attachContactsToGroup(parseInt(id), { contacts: contactIds });
        if (format === 'json') {
          console.log(JSON.stringify({ success: true, groupId: id, contacts: contactIds }));
        } else {
          console.log(fmt.formatSuccess(`Attached ${contactIds.length} contacts to group`, id));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('detach-contacts <id>')
    .description('Detach contacts from a group')
    .requiredOption('--contacts <ids>', 'Comma-separated contact IDs')
    .action(async (id, options, cmdParent) => {
      const parentOpts = cmdParent.opts();
      const format = fmt.resolveOutputFormat(parentOpts.format as OutputFormat);
      try {
        const contactIds = options.contacts
          .split(',')
          .map((c: string) => parseInt(c.trim()));
        await api.detachContactsFromGroup(parseInt(id), { contacts: contactIds });
        if (format === 'json') {
          console.log(JSON.stringify({ success: true, groupId: id, contacts: contactIds }));
        } else {
          console.log(fmt.formatSuccess(`Detached ${contactIds.length} contacts from group`, id));
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
