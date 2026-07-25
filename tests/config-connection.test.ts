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

  it('falls back from the stable user route to the current API user route', async () => {
    vi.spyOn(api, 'setConfig').mockImplementation(() => undefined);
    vi.spyOn(api, 'getUser').mockRejectedValue(new api.MonicaApiError('missing', 31, 404));
    vi.spyOn(api, 'getAuthenticatedUser').mockResolvedValue({
      data: { id: 'user-1', email: 'u@example.test' },
    } as never);

    await expect(verifyConfigConnection({
      apiUrl: 'https://example.test/api', apiKey: 'key',
    })).resolves.toMatchObject({ data: { id: 'user-1' } });
  });

  it('reports a current-edition failure after a stable route miss', async () => {
    vi.spyOn(api, 'setConfig').mockImplementation(() => undefined);
    vi.spyOn(api, 'getUser').mockRejectedValue(new api.MonicaApiError('missing', 31, 405));
    vi.spyOn(api, 'getAuthenticatedUser').mockRejectedValue(new Error('forbidden'));

    await expect(verifyConfigConnection({
      apiUrl: 'https://example.test/api', apiKey: 'key',
    })).rejects.toThrow('failed for stable and next API editions: forbidden');
  });
});
