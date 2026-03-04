import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createContactFieldsCommand } from '../src/commands/contact-fields';

describe('contact-fields command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null | undefined) => never);
    vi.spyOn(fmt, 'resolveOutputFormat').mockReturnValue('json');
    vi.spyOn(fmt, 'formatPaginatedResponse').mockReturnValue('FORMATTED');
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED_OUTPUT');
    vi.spyOn(fmt, 'formatError').mockReturnValue('FORMATTED_ERROR');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists all contact fields when contact id is not provided', async () => {
    const listContactFieldsSpy = vi.spyOn(api, 'listContactFields');
    vi.spyOn(api, 'listAllContactFields').mockResolvedValue({
      data: [],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 1, from: 0, last_page: 1, path: '', per_page: 10, to: 0, total: 0 },
    } as never);

    const cmd = createContactFieldsCommand();
    await cmd.parseAsync(['list', '--format', 'json'], { from: 'user' });

    expect(api.listAllContactFields).toHaveBeenCalledWith({ page: undefined, limit: undefined });
    expect(listContactFieldsSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('FORMATTED');
  });

  it('lists contact fields for a specific contact when contact id is provided', async () => {
    const listAllContactFieldsSpy = vi.spyOn(api, 'listAllContactFields');
    vi.spyOn(api, 'listContactFields').mockResolvedValue({
      data: [],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 1, from: 0, last_page: 1, path: '', per_page: 10, to: 0, total: 0 },
    } as never);

    const cmd = createContactFieldsCommand();
    await cmd.parseAsync(['list', '42', '--format', 'json'], { from: 'user' });

    expect(api.listContactFields).toHaveBeenCalledWith(42, { page: undefined, limit: undefined });
    expect(listAllContactFieldsSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('FORMATTED');
  });

  it('falls back to contact-scan mode when global listing is unavailable and scan is enabled', async () => {
    vi.spyOn(api, 'listAllContactFields').mockRejectedValue({ statusCode: 405 });
    vi.spyOn(api, 'listAllContacts').mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ] as never);
    vi.spyOn(api, 'listContactFields')
      .mockResolvedValueOnce({
        data: [{ id: 101, content: 'a', contact_field_type: 'email' }],
        links: { first: '', last: '', prev: null, next: null },
        meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 10, to: 1, total: 1 },
      } as never)
      .mockResolvedValueOnce({
        data: [],
        links: { first: '', last: '', prev: null, next: null },
        meta: { current_page: 1, from: 0, last_page: 1, path: '', per_page: 10, to: 0, total: 0 },
      } as never);

    const cmd = createContactFieldsCommand();
    await cmd.parseAsync(['list', '--scan-contacts', '--contact-max-pages', '3', '--format', 'json'], { from: 'user' });

    expect(api.listAllContacts).toHaveBeenCalledWith(undefined, 3);
    expect(api.listContactFields).toHaveBeenCalledWith(1, { page: 1, limit: undefined });
    expect(api.listContactFields).toHaveBeenCalledWith(2, { page: 1, limit: undefined });
    expect(fmt.formatOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'contact-scan-fallback',
        trigger: 'manual',
        contactsScanned: 2,
        contactsWithFields: 1,
        totalFields: 1,
      }),
      'json',
      expect.any(Object)
    );
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_OUTPUT');
  });

  it('falls back to contact-scan mode automatically when global listing is unavailable', async () => {
    vi.spyOn(api, 'listAllContactFields').mockRejectedValue({ statusCode: 405 });
    vi.spyOn(api, 'listAllContacts').mockResolvedValue([
      { id: 1 },
    ] as never);
    vi.spyOn(api, 'listContactFields').mockResolvedValue({
      data: [{ id: 101, content: 'a', contact_field_type: 'email' }],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 10, to: 1, total: 1 },
    } as never);

    const cmd = createContactFieldsCommand();
    await cmd.parseAsync(['list', '--format', 'json'], { from: 'user' });

    expect(api.listAllContacts).toHaveBeenCalledWith(undefined, 1);
    expect(fmt.formatOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'contact-scan-fallback',
        trigger: 'auto',
        contactsScanned: 1,
        contactsWithFields: 1,
        totalFields: 1,
      }),
      'json',
      expect.any(Object)
    );
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_OUTPUT');
  });

  it('fails with formatted error for an invalid contact id', async () => {
    const cmd = createContactFieldsCommand();

    await expect(
      cmd.parseAsync(['list', 'abc', '--format', 'json'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
  });

  it('shows a scoped-list hint when global listing is unavailable', async () => {
    vi.spyOn(api, 'listAllContactFields').mockRejectedValue({ statusCode: 405 });
    const cmd = createContactFieldsCommand();

    await expect(
      cmd.parseAsync(['list', '--no-auto-scan', '--format', 'json'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
  });
});
