import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createUsersCommand } from '../src/commands/users';
import { createVaultsCommand } from '../src/commands/vaults';
import { emptyPaginatedResponse } from './test-utils';

const USER = {
  id: 'user-1',
  name: 'Example User',
  email: 'user@example.test',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  links: { self: 'https://example.test/api/users/user-1' },
};
const VAULT = {
  id: 'vault-1',
  name: 'Personal',
  description: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  links: { self: 'https://example.test/api/vaults/vault-1' },
};

describe('current Monica API transport', () => {
  beforeEach(() => {
    api.setConfig({ apiUrl: 'https://example.test/api', apiKey: 'token', readOnlyMode: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    api.resetConfig();
  });

  it('maps every current user route and pagination helper', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: USER }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...emptyPaginatedResponse(), data: [USER],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: USER }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...emptyPaginatedResponse(), data: [USER],
        meta: { ...emptyPaginatedResponse().meta, last_page: 1 },
      }), { status: 200 }));

    await api.getAuthenticatedUser();
    await api.listAccountUsers({ page: 2, limit: 5 });
    await api.getAccountUser('user/1');
    expect(await api.listAllAccountUsers()).toEqual([USER]);

    expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual([
      'https://example.test/api/user',
      'https://example.test/api/users?page=2&limit=5',
      'https://example.test/api/users/user%2F1',
      'https://example.test/api/users?page=1',
    ]);
  });

  it('maps every current vault HTTP method and UUID encoding', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => (
      new Response(JSON.stringify({ data: VAULT, deleted: true, id: 'vault-1' }), { status: 200 })
    ));

    await api.listVaults({ page: 1, limit: 10 });
    await api.getVault('vault/1');
    await api.createVault({ name: 'Personal' });
    await api.updateVault('vault/1', { name: 'Renamed', description: 'Description' });
    await api.patchVault('vault/1', { description: 'Changed' });
    await api.deleteVault('vault/1');

    expect(fetcher.mock.calls.map(([url, init]) => [String(url), init?.method])).toEqual([
      ['https://example.test/api/vaults?page=1&limit=10', 'GET'],
      ['https://example.test/api/vaults/vault%2F1', 'GET'],
      ['https://example.test/api/vaults', 'POST'],
      ['https://example.test/api/vaults/vault%2F1', 'PUT'],
      ['https://example.test/api/vaults/vault%2F1', 'PATCH'],
      ['https://example.test/api/vaults/vault%2F1', 'DELETE'],
    ]);
  });

  it('collects all current vault pages and blocks PATCH before network access', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({
      ...emptyPaginatedResponse(), data: [VAULT],
      meta: { ...emptyPaginatedResponse().meta, last_page: 1 },
    }), { status: 200 }));
    expect(await api.listAllVaults()).toEqual([VAULT]);

    api.setConfig({ apiUrl: 'https://example.test/api', apiKey: 'token', readOnlyMode: true });
    const fetcher = vi.spyOn(globalThis, 'fetch');
    fetcher.mockClear();
    await expect(api.patchVault('vault-1', { name: 'Blocked' })).rejects.toThrow(
      'Read-only mode enabled: blocked PATCH /vaults/vault-1',
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('current Monica API commands', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('supports authenticated, paginated, all-page, and UUID user reads', async () => {
    vi.spyOn(api, 'getAuthenticatedUser').mockResolvedValue({ data: USER });
    vi.spyOn(api, 'listAccountUsers').mockResolvedValue({
      ...emptyPaginatedResponse(), data: [USER],
    });
    vi.spyOn(api, 'listAllAccountUsers').mockResolvedValue([USER]);
    vi.spyOn(api, 'getAccountUser').mockResolvedValue({ data: USER });

    await createUsersCommand().parseAsync(['--format', 'json', 'current'], { from: 'user' });
    await createUsersCommand().parseAsync([
      '--format', 'json', '--page', '2', '--limit', '5', 'list',
    ], { from: 'user' });
    await createUsersCommand().parseAsync(['--format', 'json', 'list', '--all'], { from: 'user' });
    await createUsersCommand().parseAsync(['--format', 'json', 'get', 'user-1'], { from: 'user' });

    expect(api.listAccountUsers).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(api.getAccountUser).toHaveBeenCalledWith('user-1');
  });

  it('supports every vault route and preserves typed inputs', async () => {
    vi.spyOn(api, 'listVaults').mockResolvedValue({ ...emptyPaginatedResponse(), data: [VAULT] });
    vi.spyOn(api, 'listAllVaults').mockResolvedValue([VAULT]);
    vi.spyOn(api, 'getVault').mockResolvedValue({ data: VAULT });
    vi.spyOn(api, 'createVault').mockResolvedValue({ data: VAULT });
    vi.spyOn(api, 'updateVault').mockResolvedValue({ data: VAULT });
    vi.spyOn(api, 'patchVault').mockResolvedValue({ data: VAULT });
    vi.spyOn(api, 'deleteVault').mockResolvedValue({ deleted: true, id: 'vault-1' });

    await createVaultsCommand().parseAsync(['--format', 'json', 'list'], { from: 'user' });
    await createVaultsCommand().parseAsync(['--format', 'json', 'list', '--all'], { from: 'user' });
    await createVaultsCommand().parseAsync(['--format', 'json', 'get', 'vault-1'], { from: 'user' });
    await createVaultsCommand().parseAsync([
      '--format', 'json', 'create', '--name', 'Personal', '--description', 'Private',
    ], { from: 'user' });
    await createVaultsCommand().parseAsync([
      '--format', 'json', 'update', 'vault-1', '--name', 'Renamed',
    ], { from: 'user' });
    await createVaultsCommand().parseAsync([
      '--format', 'json', 'patch', 'vault-1', '--description', 'Changed',
    ], { from: 'user' });
    await createVaultsCommand().parseAsync([
      '--format', 'json', 'delete', 'vault-1',
    ], { from: 'user' });

    expect(api.createVault).toHaveBeenCalledWith({ name: 'Personal', description: 'Private' });
    expect(api.updateVault).toHaveBeenCalledWith('vault-1', {
      name: 'Renamed', description: undefined,
    });
    expect(api.patchVault).toHaveBeenCalledWith('vault-1', {
      name: undefined, description: 'Changed',
    });
    expect(console.log).toHaveBeenCalledWith('{"deleted":true,"id":"vault-1"}');
  });

  it('formats human deletion and command errors consistently', async () => {
    vi.spyOn(api, 'deleteVault').mockResolvedValue({ deleted: true, id: 'vault-1' });
    await createVaultsCommand().parseAsync(['delete', 'vault-1'], { from: 'user' });
    expect(console.log).toHaveBeenCalledWith(fmt.formatDeleted('vault-1'));

    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    await expect(createVaultsCommand().parseAsync(['patch', 'vault-1'], { from: 'user' }))
      .rejects.toThrow('process.exit');
    expect(console.error).toHaveBeenCalledWith(fmt.formatError(
      new Error('Provide at least one of --name or --description when patching a vault'),
    ));

    vi.spyOn(api, 'getAccountUser').mockRejectedValue(new Error('unsupported'));
    await expect(createUsersCommand().parseAsync(['get', 'user-1'], { from: 'user' }))
      .rejects.toThrow('process.exit');
    expect(exit).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(fmt.formatError(new Error('unsupported')));
  });
});
