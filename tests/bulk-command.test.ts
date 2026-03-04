import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createBulkCommand } from '../src/commands/bulk';

describe('bulk command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null | undefined) => never);
    vi.spyOn(fmt, 'resolveOutputFormat').mockImplementation((f) => (f as 'toon' | 'json' | 'table') || 'toon');
    vi.spyOn(fmt, 'formatError').mockReturnValue('FORMATTED_ERROR');
    vi.spyOn(fmt, 'formatSuccess').mockReturnValue('FORMATTED_SUCCESS');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bulk tag adds tags to each requested contact', async () => {
    vi.spyOn(api, 'setContactTags').mockResolvedValue({ data: { id: 1 } } as never);

    const cmd = createBulkCommand();
    await cmd.parseAsync(['tag', '--contacts', '1,2', '--tags', 'friend,work', '--format', 'json'], { from: 'user' });

    expect(api.setContactTags).toHaveBeenCalledTimes(2);
    expect(api.setContactTags).toHaveBeenCalledWith(1, ['friend', 'work']);
    expect(api.setContactTags).toHaveBeenCalledWith(2, ['friend', 'work']);
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(payload.summary).toEqual({ success: 2, failed: 0 });
  });

  it('bulk export prints JSON when no output path is provided', async () => {
    vi.spyOn(api, 'listAllContacts').mockResolvedValue([{ id: 1, first_name: 'Ada' }] as never);

    const cmd = createBulkCommand();
    await cmd.parseAsync(['export', '--contacts', 'all'], { from: 'user' });

    expect(api.listAllContacts).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"id": 1'));
  });

  it('bulk delete without --force exits without deleting', async () => {
    const deleteSpy = vi.spyOn(api, 'deleteContact');
    const cmd = createBulkCommand();

    await expect(
      cmd.parseAsync(['delete', '--contacts', '1,2'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('bulk delete with --force deletes and reports failures', async () => {
    vi.spyOn(api, 'deleteContact')
      .mockResolvedValueOnce({ deleted: true, id: 1 } as never)
      .mockRejectedValueOnce(new Error('missing'));

    const cmd = createBulkCommand();
    await expect(
      cmd.parseAsync(['delete', '--contacts', '1,2', '--force', '--format', 'json'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(api.deleteContact).toHaveBeenCalledTimes(2);
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(payload.summary).toEqual({ success: 1, failed: 1 });
  });
});
