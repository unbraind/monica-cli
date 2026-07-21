import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { verifyConfigConnection } from '../src/commands/config-connection';

describe('configuration connection verification', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    [{ apiKey: 'key' }, 'API URL'],
    [{ apiUrl: 'https://example.test/api' }, 'API key'],
    [{}, 'API URL and API key'],
  ])('rejects missing connection values', async (settings, message) => {
    await expect(verifyConfigConnection(settings)).rejects.toThrow(message);
  });

  it('configures every supported credential and returns the user', async () => {
    const setConfig = vi.spyOn(api, 'setConfig').mockImplementation(() => undefined);
    vi.spyOn(api, 'getUser').mockResolvedValue({ data: { id: 1 } } as never);
    await expect(verifyConfigConnection({
      apiUrl: 'https://example.test/api', apiKey: 'key', userEmail: 'u@example.test',
      userPassword: 'password', readOnlyMode: true,
    })).resolves.toEqual({ data: { id: 1 } });
    expect(setConfig).toHaveBeenCalledWith({
      apiUrl: 'https://example.test/api', apiKey: 'key', userEmail: 'u@example.test',
      userPassword: 'password', readOnlyMode: true,
    });
  });

  it('wraps API failures with sanitized endpoint context', async () => {
    vi.spyOn(api, 'setConfig').mockImplementation(() => undefined);
    vi.spyOn(api, 'getUser').mockRejectedValue(new Error('offline'));
    await expect(verifyConfigConnection({
      apiUrl: 'https://example.test/api', apiKey: 'key',
    })).rejects.toThrow('Connection to https://example.test/api failed: offline');
  });
});
