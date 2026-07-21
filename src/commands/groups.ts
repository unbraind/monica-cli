import type { Command } from 'commander';
import type { Group, GroupCreateInput, GroupUpdateInput, PaginatedResponse, Tag } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { createCrudCommand, runCommandAction } from './crud-command';
import { parsePositiveInteger } from './global-options';
import { parseResourceIds } from './activities';
import { resolveCommandOutputFormat } from './output-format';

interface GroupListOptions {
  all?: boolean;
  scanTags?: boolean;
  autoScan?: boolean;
  tagMaxPages?: number;
}

function mapTagToGroup(tag: Tag): Group {
  return {
    id: tag.id, object: 'group', name: tag.name,
    created_at: tag.created_at, updated_at: tag.updated_at,
  };
}

async function loadGroups(
  pagination: { page?: number; limit?: number },
  options: GroupListOptions,
): Promise<Group[] | PaginatedResponse<Group>> {
  const fallback = async (): Promise<Group[] | PaginatedResponse<Group>> => {
    if (options.all) {
      const maxPages = options.tagMaxPages ?? (options.scanTags ? 10 : 1);
      return (await api.listAllTags(maxPages)).map(mapTagToGroup);
    }
    const response = await api.listTags(pagination);
    return { ...response, data: response.data.map(mapTagToGroup) };
  };
  if (options.scanTags) return fallback();
  try {
    return options.all ? await api.listAllGroups() : await api.listGroups(pagination);
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    const endpointUnavailable = statusCode === 404 || statusCode === 405;
    if (endpointUnavailable && options.autoScan !== false) return fallback();
    if (endpointUnavailable) {
      throw new Error(
        'Groups endpoint is unavailable. Use `monica groups list --scan-tags`.',
        { cause: error },
      );
    }
    throw error;
  }
}

function addContactMutation(
  command: Command,
  name: 'attach-contacts' | 'detach-contacts',
  mutate: (groupId: number, input: { contacts: number[] }) => Promise<unknown>,
): void {
  const verb = name === 'attach-contacts' ? 'Attached' : 'Detached';
  command.command(`${name} <id>`).description(`${verb} contacts to or from a group`)
    .requiredOption('--contacts <ids>', 'Comma-separated contact IDs', parseResourceIds)
    .action(async function (this: Command, id: string): Promise<void> {
      await runCommandAction(async () => {
        const groupId = parsePositiveInteger(id);
        const contacts = (this.opts() as { contacts: number[] }).contacts;
        await mutate(groupId, { contacts });
        console.log(resolveCommandOutputFormat(this) === 'json'
          ? JSON.stringify({ success: true, groupId, contacts })
          : fmt.formatSuccess(`${verb} ${contacts.length} contacts`, groupId));
      });
    });
}

/** Build group CRUD, compatibility fallback, and contact-membership commands. */
export function createGroupsCommand(): Command {
  const command = createCrudCommand<Group, GroupCreateInput, GroupUpdateInput>({
    name: 'groups', description: 'Manage contact groups', singular: 'group', label: 'Group',
    fields: ['id', 'name', 'created_at'],
    listPage: api.listGroups,
    get: api.getGroup,
    create: api.createGroup,
    update: api.updateGroup,
    remove: api.deleteGroup,
    configureList: (candidate) => candidate.option('--all', 'Fetch all pages')
      .option('--scan-tags', 'Use the tag-scan compatibility fallback')
      .option('--no-auto-scan', 'Disable automatic tag-scan fallback')
      .option('--tag-max-pages <pages>', 'Maximum fallback pages', parsePositiveInteger),
    loadList: (pagination, options) => loadGroups(pagination, options as GroupListOptions),
    configureCreate: (candidate) => candidate.requiredOption('--name <name>', 'Group name'),
    configureUpdate: (candidate) => candidate.option('--name <name>', 'Group name'),
    buildCreateInput: (options) => ({ name: options.name as string }),
    buildUpdateInput: (options, current) => ({
      name: (options.name as string | undefined) ?? current.name,
    }),
  });
  addContactMutation(command, 'attach-contacts', api.attachContactsToGroup);
  addContactMutation(command, 'detach-contacts', api.detachContactsFromGroup);
  return command;
}
