import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createGroupsCommand } from '../src/commands/groups';

const page = { data: [{ id: 1, name: 'Friends', created_at: '', updated_at: '' }], meta: {} };

describe('groups command', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('uses native page and all-groups endpoints', async () => {
    vi.spyOn(api, 'listGroups').mockResolvedValue(page as never);
    vi.spyOn(api, 'listAllGroups').mockResolvedValue(page.data as never);
    await createGroupsCommand().parseAsync(['--page', '2', 'list'], { from: 'user' });
    await createGroupsCommand().parseAsync(['list', '--all'], { from: 'user' });
    expect(api.listGroups).toHaveBeenCalledWith({ page: 2, limit: undefined, sort: undefined });
    expect(api.listAllGroups).toHaveBeenCalled();
  });

  it('supports explicit paged and all tag fallbacks', async () => {
    vi.spyOn(api, 'listTags').mockResolvedValue(page as never);
    vi.spyOn(api, 'listAllTags').mockResolvedValue(page.data as never);
    await createGroupsCommand().parseAsync(['list', '--scan-tags'], { from: 'user' });
    await createGroupsCommand().parseAsync([
      'list', '--all', '--scan-tags', '--tag-max-pages', '3',
    ], { from: 'user' });
    await createGroupsCommand().parseAsync(['list', '--all', '--scan-tags'], { from: 'user' });
    expect(api.listTags).toHaveBeenCalled();
    expect(api.listAllTags).toHaveBeenCalledWith(3);
    expect(api.listAllTags).toHaveBeenLastCalledWith(10);
  });

  it('automatically falls back only for unsupported endpoints', async () => {
    vi.spyOn(api, 'listGroups').mockRejectedValue({ statusCode: 404 });
    vi.spyOn(api, 'listTags').mockResolvedValue(page as never);
    await createGroupsCommand().parseAsync(['list'], { from: 'user' });
    expect(api.listTags).toHaveBeenCalled();

    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await createGroupsCommand().parseAsync(['list', '--no-auto-scan'], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('uses one fallback page for an automatic all-groups scan', async () => {
    vi.spyOn(api, 'listAllGroups').mockRejectedValue({ statusCode: 404 });
    vi.spyOn(api, 'listAllTags').mockResolvedValue(page.data as never);
    await createGroupsCommand().parseAsync(['list', '--all'], { from: 'user' });
    expect(api.listAllTags).toHaveBeenCalledWith(1);
  });

  it('does not mask transient native endpoint errors', async () => {
    vi.spyOn(api, 'listGroups').mockRejectedValue(new Error('offline'));
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await createGroupsCommand().parseAsync(['list'], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('maps group CRUD and contact membership mutations', async () => {
    vi.spyOn(api, 'createGroup').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'getGroup').mockResolvedValue({ data: { id: 1, name: 'Old' } } as never);
    vi.spyOn(api, 'updateGroup').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'attachContactsToGroup').mockResolvedValue({ success: true });
    vi.spyOn(api, 'detachContactsFromGroup').mockResolvedValue({ success: true });
    await createGroupsCommand().parseAsync(['create', '--name', 'Friends'], { from: 'user' });
    await createGroupsCommand().parseAsync(['update', '1'], { from: 'user' });
    await createGroupsCommand().parseAsync([
      'attach-contacts', '1', '--contacts', '2,3',
    ], { from: 'user' });
    await createGroupsCommand().parseAsync([
      '--format', 'json', 'detach-contacts', '1', '--contacts', '2,3',
    ], { from: 'user' });
    expect(api.createGroup).toHaveBeenCalledWith({ name: 'Friends' });
    expect(api.updateGroup).toHaveBeenCalledWith(1, { name: 'Old' });
    expect(api.attachContactsToGroup).toHaveBeenCalledWith(1, { contacts: [2, 3] });
    expect(api.detachContactsFromGroup).toHaveBeenCalledWith(1, { contacts: [2, 3] });
  });
});
