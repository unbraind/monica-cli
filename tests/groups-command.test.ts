import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createGroupsCommand } from '../src/commands/groups';

describe('groups command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null | undefined) => never);
    vi.spyOn(fmt, 'resolveOutputFormat').mockReturnValue('json');
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED_OUTPUT');
    vi.spyOn(fmt, 'formatPaginatedResponse').mockReturnValue('FORMATTED_PAGE');
    vi.spyOn(fmt, 'formatError').mockReturnValue('FORMATTED_ERROR');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists groups from groups endpoint when available', async () => {
    vi.spyOn(api, 'listGroups').mockResolvedValue({
      data: [{ id: 1, object: 'group', name: 'Friends', created_at: '2026-01-01', updated_at: '2026-01-01' }],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 2, from: 1, last_page: 3, path: '', per_page: 5, to: 5, total: 15 },
    } as never);

    const cmd = createGroupsCommand();
    await cmd.parseAsync(['--format', 'json', '--page', '2', '--limit', '5', 'list'], { from: 'user' });

    expect(api.listGroups).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_PAGE');
  });

  it('falls back to tags automatically when groups endpoint is unavailable', async () => {
    vi.spyOn(api, 'listGroups').mockRejectedValue({ statusCode: 404, message: 'HTTP 404' } as never);
    vi.spyOn(api, 'listTags').mockResolvedValue({
      data: [{ id: 7, object: 'tag', name: 'Family', name_slug: 'family', created_at: '2026-01-01', updated_at: '2026-01-02' }],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 5, to: 1, total: 1 },
    } as never);

    const cmd = createGroupsCommand();
    await cmd.parseAsync(['--format', 'json', '--limit', '5', 'list'], { from: 'user' });

    expect(api.listTags).toHaveBeenCalledWith({ page: undefined, limit: 5 });
    expect(fmt.formatPaginatedResponse).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ id: 7, object: 'group', name: 'Family' })],
    }), 'json', ['id', 'name', 'created_at']);
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_PAGE');
  });

  it('supports manual tag scan fallback controls for list --all', async () => {
    const listGroupsSpy = vi.spyOn(api, 'listGroups');
    vi.spyOn(api, 'listAllGroups').mockResolvedValue([] as never);
    vi.spyOn(api, 'listAllTags').mockResolvedValue([
      { id: 10, object: 'tag', name: 'VIP', name_slug: 'vip', created_at: '2026-01-01', updated_at: '2026-01-02' },
    ] as never);

    const cmd = createGroupsCommand();
    await cmd.parseAsync(['--format', 'json', 'list', '--all', '--scan-tags', '--tag-max-pages', '2'], { from: 'user' });

    expect(listGroupsSpy).not.toHaveBeenCalled();
    expect(api.listAllTags).toHaveBeenCalledWith(2);
    expect(fmt.formatOutput).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 10, object: 'group', name: 'VIP' })],
      'json',
      { fields: ['id', 'name', 'created_at'] }
    );
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_OUTPUT');
  });

  it('fails with guidance when fallback is disabled', async () => {
    vi.spyOn(api, 'listGroups').mockRejectedValue({ statusCode: 404, message: 'HTTP 404' } as never);
    const listTagsSpy = vi.spyOn(api, 'listTags');
    const cmd = createGroupsCommand();

    await expect(
      cmd.parseAsync(['--format', 'json', 'list', '--no-auto-scan'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(listTagsSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
    expect(fmt.formatError).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Groups endpoint is unavailable'),
    }));
  });
});
