import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAttachmentCommand } from '../src/commands/attachment-command';

describe('attachment command kernel', () => {
  const listPage = vi.fn();
  const listAll = vi.fn();
  const get = vi.fn();
  const remove = vi.fn();
  const upload = vi.fn();
  let fixture = '';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fixture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'monica-attachment-')), 'file.txt');
    fs.writeFileSync(fixture, 'fixture');
    listPage.mockResolvedValue({ data: [{ id: 1 }], meta: {} });
    listAll.mockResolvedValue([{ id: 1 }]);
    get.mockResolvedValue({ data: { id: 1 } });
    remove.mockResolvedValue({ id: 1, deleted: true });
    upload.mockResolvedValue({ data: { id: 2 } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(path.dirname(fixture), { recursive: true, force: true });
  });

  function command() {
    return createAttachmentCommand({
      name: 'files', singular: 'file', fields: ['id'], listPage, listAll, get, remove, upload,
    });
  }

  it('lists one page and all pages', async () => {
    await command().parseAsync(['--page', '2', '--limit', '5', 'list'], { from: 'user' });
    await command().parseAsync(['list', '--all'], { from: 'user' });
    expect(listPage).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(listAll).toHaveBeenCalled();
  });

  it('gets, deletes in human and JSON formats, and uploads existing files', async () => {
    await command().parseAsync(['get', '1'], { from: 'user' });
    await command().parseAsync(['delete', '1'], { from: 'user' });
    await command().parseAsync(['--format', 'json', 'delete', '1'], { from: 'user' });
    await command().parseAsync(['upload', '3', fixture], { from: 'user' });
    expect(get).toHaveBeenCalledWith(1);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenCalledWith(3, fixture);
  });

  it('rejects missing upload files through the standard error path', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await command().parseAsync(['upload', '3', `${fixture}.missing`], { from: 'user' });
    expect(upload).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });
});
