import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createAddressesCommand } from '../src/commands/addresses';
import { createCallsCommand } from '../src/commands/calls';
import { createCompaniesCommand } from '../src/commands/companies';
import { createNotesCommand } from '../src/commands/notes';

describe('CRUD resource command mappings A', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('maps company list/create/update options', async () => {
    vi.spyOn(api, 'listAllCompanies').mockResolvedValue([]);
    vi.spyOn(api, 'createCompany').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'getCompany').mockResolvedValue({
      data: { id: 1, name: 'Old', website: null, number_of_employees: null },
    } as never);
    vi.spyOn(api, 'updateCompany').mockResolvedValue({ data: { id: 1 } } as never);

    await createCompaniesCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createCompaniesCommand().parseAsync([
      'create', '--name', 'Acme', '--website', 'https://example.test', '--employees', '10',
    ], { from: 'user' });
    await createCompaniesCommand().parseAsync(['update', '1'], { from: 'user' });

    expect(api.listAllCompanies).toHaveBeenCalled();
    expect(api.createCompany).toHaveBeenCalledWith({
      name: 'Acme', website: 'https://example.test', number_of_employees: 10,
    });
    expect(api.updateCompany).toHaveBeenCalledWith(1, {
      name: 'Old', website: undefined, number_of_employees: undefined,
    });
  });

  it('maps call list/create/update options', async () => {
    vi.spyOn(api, 'listAllCalls').mockResolvedValue([]);
    vi.spyOn(api, 'createCall').mockResolvedValue({ data: { id: 2 } } as never);
    vi.spyOn(api, 'getCall').mockResolvedValue({
      data: { id: 2, content: null, called_at: '2026-01-01', contact: { id: 3 } },
    } as never);
    vi.spyOn(api, 'updateCall').mockResolvedValue({ data: { id: 2 } } as never);

    await createCallsCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createCallsCommand().parseAsync([
      'create', '--contact', '3', '--content', 'Discussed roadmap', '--date', '2026-01-02',
    ], { from: 'user' });
    await createCallsCommand().parseAsync(['update', '2', '--content', 'Updated'], { from: 'user' });
    vi.mocked(api.getCall).mockResolvedValueOnce({
      data: { id: 2, content: null, called_at: '2026-01-01', contact: null },
    } as never);
    await createCallsCommand().parseAsync(['update', '2'], { from: 'user' });

    expect(api.createCall).toHaveBeenCalledWith({
      contact_id: 3, content: 'Discussed roadmap', called_at: '2026-01-02',
    });
    expect(api.updateCall).toHaveBeenCalledWith(2, {
      contact_id: 3, content: 'Updated', called_at: '2026-01-01',
    });
    expect(api.updateCall).toHaveBeenLastCalledWith(2, {
      contact_id: 0, content: '', called_at: '2026-01-01',
    });
  });

  it('maps address list/create/update options', async () => {
    vi.spyOn(api, 'listAllAddresses').mockResolvedValue([]);
    vi.spyOn(api, 'createAddress').mockResolvedValue({ data: { id: 4 } } as never);
    vi.spyOn(api, 'getAddress').mockResolvedValue({
      data: {
        id: 4, contact: { id: 3 }, name: null, street: null, city: 'Vienna', province: null,
        postal_code: null, country: { id: 'AUT' },
      },
    } as never);
    vi.spyOn(api, 'updateAddress').mockResolvedValue({ data: { id: 4 } } as never);

    await createAddressesCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createAddressesCommand().parseAsync([
      'create', '--contact', '3', '--name', 'Home', '--street', 'Main 1', '--city', 'Vienna',
      '--province', 'Vienna', '--postal-code', '1010', '--country', 'AUT',
    ], { from: 'user' });
    await createAddressesCommand().parseAsync(['update', '4', '--city', 'Graz'], { from: 'user' });
    vi.mocked(api.getAddress).mockResolvedValueOnce({ data: { id: 4 } } as never);
    await createAddressesCommand().parseAsync(['update', '4'], { from: 'user' });

    expect(api.createAddress).toHaveBeenCalledWith({
      contact_id: 3, name: 'Home', street: 'Main 1', city: 'Vienna', province: 'Vienna',
      postal_code: '1010', country_id: 'AUT',
    });
    expect(api.updateAddress).toHaveBeenCalledWith(4, {
      contact_id: 3, name: undefined, street: undefined, city: 'Graz', province: undefined,
      postal_code: undefined, country_id: 'AUT',
    });
    expect(api.updateAddress).toHaveBeenLastCalledWith(4, {
      contact_id: 0, name: undefined, street: undefined, city: undefined,
      province: undefined, postal_code: undefined, country_id: undefined,
    });
  });

  it('maps note favorite state for create and every update branch', async () => {
    vi.spyOn(api, 'listAllNotes').mockResolvedValue([]);
    vi.spyOn(api, 'createNote').mockResolvedValue({ data: { id: 5 } } as never);
    vi.spyOn(api, 'getNote').mockResolvedValue({
      data: { id: 5, body: 'Old', is_favorited: true, contact: { id: 3 } },
    } as never);
    vi.spyOn(api, 'updateNote').mockResolvedValue({ data: { id: 5 } } as never);

    await createNotesCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createNotesCommand().parseAsync([
      'create', '--body', 'Body', '--contact', '3', '--favorite',
    ], { from: 'user' });
    await createNotesCommand().parseAsync([
      'create', '--body', 'Plain', '--contact', '3',
    ], { from: 'user' });
    await createNotesCommand().parseAsync(['update', '5'], { from: 'user' });
    await createNotesCommand().parseAsync(['update', '5', '--no-favorite'], { from: 'user' });
    await createNotesCommand().parseAsync([
      'update', '5', '--favorite', '--body', 'New', '--contact', '4',
    ], { from: 'user' });
    vi.mocked(api.getNote).mockResolvedValueOnce({
      data: { id: 5, body: 'Old', is_favorited: false, contact: null },
    } as never);
    await createNotesCommand().parseAsync(['update', '5'], { from: 'user' });

    expect(api.createNote).toHaveBeenCalledWith({ body: 'Body', contact_id: 3, is_favorited: 1 });
    expect(api.createNote).toHaveBeenLastCalledWith({ body: 'Plain', contact_id: 3, is_favorited: 0 });
    expect(api.updateNote).toHaveBeenNthCalledWith(1, 5, {
      body: 'Old', contact_id: 3, is_favorited: 1,
    });
    expect(api.updateNote).toHaveBeenNthCalledWith(2, 5, {
      body: 'Old', contact_id: 3, is_favorited: 0,
    });
    expect(api.updateNote).toHaveBeenNthCalledWith(3, 5, {
      body: 'New', contact_id: 4, is_favorited: 1,
    });
    expect(api.updateNote).toHaveBeenLastCalledWith(5, {
      body: 'Old', contact_id: 0, is_favorited: 0,
    });
  });
});
