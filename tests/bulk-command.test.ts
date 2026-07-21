import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createBulkCommand, outputBulkResults } from '../src/commands/bulk';

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

  it('bulk tag reports item failures through the fatal summary path', async () => {
    vi.spyOn(api, 'setContactTags').mockRejectedValue(new Error('offline'));
    await expect(createBulkCommand().parseAsync([
      'tag', '--contacts', '1', '--tags', 'friend', '--format', 'json',
    ], { from: 'user' })).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
  });

  it('bulk export prints JSON when no output path is provided', async () => {
    vi.spyOn(api, 'listAllContacts').mockResolvedValue([{ id: 1, first_name: 'Ada' }] as never);

    const cmd = createBulkCommand();
    await cmd.parseAsync(['export', '--contacts', 'all'], { from: 'user' });

    expect(api.listAllContacts).toHaveBeenCalledOnce();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"id": 1'));
  });

  it('bulk export reports formatter failures', async () => {
    vi.spyOn(api, 'listAllContacts').mockResolvedValue([]);
    vi.spyOn(fmt, 'formatOutput').mockImplementation(() => { throw new Error('render failed'); });
    await expect(createBulkCommand().parseAsync([
      'export', '--contacts', 'all',
    ], { from: 'user' })).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
  });

  it('bulk star updates only unstarred contacts and reports per-contact failures', async () => {
    vi.spyOn(api, 'getContact')
      .mockResolvedValueOnce({ data: {
        id: 1, first_name: 'Ada', last_name: null, gender: 'Female', gender_type: 'F',
        is_starred: false,
      } } as never)
      .mockResolvedValueOnce({ data: { id: 2, is_starred: true } } as never)
      .mockRejectedValueOnce(new Error('missing'));
    vi.spyOn(api, 'listGenders').mockResolvedValue({
      data: [{ id: 4, name: 'Female', type: 'F' }],
    } as never);
    vi.spyOn(api, 'updateContact').mockResolvedValue({ data: { id: 1 } } as never);
    await expect(createBulkCommand().parseAsync([
      'star', '--contacts', '1,2,3', '--format', 'json',
    ], { from: 'user' })).rejects.toThrow('process.exit');
    expect(api.updateContact).toHaveBeenCalledWith(1, expect.objectContaining({
      gender_id: 4, is_starred: true,
    }));
    expect(api.updateContact).toHaveBeenCalledTimes(1);
  });

  it('bulk star reports a missing gender mapping safely', async () => {
    vi.spyOn(api, 'getContact').mockResolvedValue({ data: {
      id: 1, first_name: 'Ada', gender: 'Unknown', is_starred: false,
    } } as never);
    vi.spyOn(api, 'listGenders').mockResolvedValue({ data: [{ id: 2, name: 'Other', type: 'O' }] } as never);
    await expect(createBulkCommand().parseAsync([
      'star', '--contacts', '1', '--format', 'json',
    ], { from: 'user' })).rejects.toThrow('process.exit');
  });

  it('falls back from a mismatched gender type to the gender name', async () => {
    vi.spyOn(api, 'getContact').mockResolvedValue({ data: {
      id: 1, first_name: 'Ada', gender: 'Female', gender_type: 'unknown', is_starred: false,
    } } as never);
    vi.spyOn(api, 'listGenders').mockResolvedValue({ data: [
      { id: 4, name: 'Female', type: 'F' },
    ] } as never);
    const update = vi.spyOn(api, 'updateContact').mockResolvedValue({ data: { id: 1 } } as never);
    await createBulkCommand().parseAsync(['star', '--contacts', '1', '--format', 'json'], { from: 'user' });
    expect(update).toHaveBeenCalledWith(1, expect.objectContaining({ gender_id: 4 }));
  });

  it('exports selected contacts, skips inaccessible records, and writes formatted output', async () => {
    vi.spyOn(api, 'getContact')
      .mockResolvedValueOnce({ data: { id: 1, first_name: 'Ada' } } as never)
      .mockRejectedValueOnce(new Error('missing'));
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'monica-export-'));
    const outputPath = path.join(directory, 'contacts.toon');
    await createBulkCommand().parseAsync([
      'export', '--contacts', '1,2', '--output', outputPath, '--format', 'toon',
    ], { from: 'user' });
    expect(api.getContact).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith('Failed to get contact 2: missing');
    expect(fs.readFileSync(outputPath, 'utf8')).toContain('Ada');
    fs.rmSync(directory, { recursive: true, force: true });
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

  it('renders successful table and TOON summaries without exiting', () => {
    outputBulkResults([{ success: true, id: 1 }], 'table', 'tag');
    outputBulkResults([{ success: true, id: 2 }], 'toon', 'star');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Success: 1'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Bulk Operation: star'));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('renders failed table and TOON rows with their errors', () => {
    expect(() => outputBulkResults([{ success: false, id: 1, error: 'offline' }], 'table', 'tag'))
      .toThrow('process.exit');
    expect(() => outputBulkResults([{ success: false, id: 2, error: 'offline' }], 'toon', 'star'))
      .toThrow('process.exit');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('FAIL'));
    expect(logSpy).toHaveBeenCalledWith('  status: failed');
    expect(logSpy).toHaveBeenCalledWith('  error: "offline"');
  });
});
