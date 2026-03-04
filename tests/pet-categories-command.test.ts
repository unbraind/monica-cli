import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createPetCategoriesCommand } from '../src/commands/pet-categories';

describe('pet-categories command', () => {
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

  it('list fetches one page by default', async () => {
    vi.spyOn(api, 'listPetCategories').mockResolvedValue({
      data: [{ id: 1, name: 'Dog', is_common: true }],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 10, to: 1, total: 1 },
    } as never);

    const cmd = createPetCategoriesCommand();
    await cmd.parseAsync(['--format', 'json', '--page', '2', '--limit', '5', 'list'], { from: 'user' });

    expect(api.listPetCategories).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_PAGE');
  });

  it('list --all fetches all pages', async () => {
    const listPageSpy = vi.spyOn(api, 'listPetCategories');
    vi.spyOn(api, 'listAllPetCategories').mockResolvedValue([
      { id: 1, name: 'Dog', is_common: true },
    ] as never);

    const cmd = createPetCategoriesCommand();
    await cmd.parseAsync(['--format', 'json', 'list', '--all'], { from: 'user' });

    expect(api.listAllPetCategories).toHaveBeenCalled();
    expect(listPageSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_OUTPUT');
  });

  it('get fetches a specific category', async () => {
    vi.spyOn(api, 'getPetCategory').mockResolvedValue({
      data: { id: 1, name: 'Dog', is_common: true },
    } as never);

    const cmd = createPetCategoriesCommand();
    await cmd.parseAsync(['--format', 'json', 'get', '1'], { from: 'user' });

    expect(api.getPetCategory).toHaveBeenCalledWith(1);
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_OUTPUT');
  });

  it('prints formatted errors and exits on failure', async () => {
    vi.spyOn(api, 'listPetCategories').mockRejectedValue(new Error('boom'));
    const cmd = createPetCategoriesCommand();

    await expect(
      cmd.parseAsync(['--format', 'json', 'list'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
  });

  it('falls back to pet scan automatically when endpoint is unavailable', async () => {
    vi.spyOn(api, 'listPetCategories').mockRejectedValue({
      statusCode: 404,
      message: 'HTTP 404',
    } as never);
    vi.spyOn(api, 'listAllPets').mockResolvedValue([
      { id: 1, name: 'Fido', pet_category: { id: 2, name: 'Dog', is_common: true } },
      { id: 2, name: 'Milo', pet_category: { id: 3, name: 'Cat', is_common: true } },
      { id: 3, name: 'Luna', pet_category: { id: 2, name: 'Dog', is_common: true } },
    ] as never);

    const cmd = createPetCategoriesCommand();
    await cmd.parseAsync(['--format', 'json', 'list'], { from: 'user' });

    expect(api.listAllPets).toHaveBeenCalledWith(1);
    expect(fmt.formatOutput).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'pet-scan-fallback',
      trigger: 'auto',
      petsScanned: 3,
      categoriesDiscovered: 2,
      data: expect.arrayContaining([
        expect.objectContaining({ id: 2, name: 'Dog' }),
        expect.objectContaining({ id: 3, name: 'Cat' }),
      ]),
    }), 'json', { fields: ['id', 'name', 'is_common'] });
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_OUTPUT');
  });

  it('supports manual fallback controls and fails with guidance when disabled', async () => {
    const endpointError = { statusCode: 404, message: 'HTTP 404' };
    vi.spyOn(api, 'listPetCategories').mockRejectedValue(endpointError as never);
    const scanSpy = vi.spyOn(api, 'listAllPets').mockResolvedValue([] as never);

    const cmdManual = createPetCategoriesCommand();
    await cmdManual.parseAsync(['--format', 'json', 'list', '--scan-pets', '--pet-max-pages', '2'], { from: 'user' });
    expect(scanSpy).toHaveBeenCalledWith(2);

    scanSpy.mockClear();
    const cmdStrict = createPetCategoriesCommand();
    await expect(
      cmdStrict.parseAsync(['--format', 'json', 'list', '--no-auto-scan'], { from: 'user' })
    ).rejects.toThrow('process.exit');
    expect(scanSpy).not.toHaveBeenCalled();
    expect(fmt.formatError).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Pet category endpoint is unavailable'),
    }));
  });
});
