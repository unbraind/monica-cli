import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({ existsSync: vi.fn(), readFileSync: vi.fn() }));

import * as fs from 'fs';
import { getConfig, loadGlobalSettings, resetConfig } from '../src/api/client';

describe('client configuration loading', () => {
  const exists = fs.existsSync as unknown as ReturnType<typeof vi.fn>;
  const read = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
  const originalEnv = { ...process.env };
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {};
    resetConfig();
  });
  afterEach(() => {
    process.env = { ...originalEnv };
    resetConfig();
  });

  it('loads normalized global settings and tolerates missing or malformed files', () => {
    exists.mockReturnValueOnce(true);
    read.mockReturnValueOnce('{"apiUrl":"https://example.test/api","readOnly":true}');
    expect(loadGlobalSettings()).toMatchObject({
      apiUrl: 'https://example.test/api', readOnlyMode: true,
    });
    exists.mockReturnValueOnce(false);
    expect(loadGlobalSettings()).toBeNull();
    exists.mockReturnValueOnce(true);
    read.mockImplementationOnce(() => { throw new Error('denied'); });
    expect(loadGlobalSettings()).toBeNull();
  });

  it('prefers environment values, normalizes the URL, and caches configuration', () => {
    exists.mockReturnValue(false);
    process.env.MONICA_API_URL = 'https://example.test/api/';
    process.env.MONICA_API_KEY = 'token';
    process.env.MONICA_USER_EMAIL = 'user@example.test';
    process.env.MONICA_USER_PASSWORD = 'password';
    process.env.MONICA_READ_ONLY = 'TRUE';
    expect(getConfig()).toEqual({
      apiUrl: 'https://example.test/api', apiKey: 'token', userEmail: 'user@example.test',
      userPassword: 'password', readOnlyMode: true,
    });
    delete process.env.MONICA_API_URL;
    expect(getConfig().apiUrl).toBe('https://example.test/api');
  });

  it('rejects missing required configuration', () => {
    exists.mockReturnValue(false);
    expect(() => getConfig()).toThrow('must be set');
  });

  it('uses optional identity fields from global settings when environment values are absent', () => {
    exists.mockReturnValue(true);
    read.mockReturnValue(JSON.stringify({
      apiUrl: 'https://example.test/api', apiKey: 'key',
      userEmail: 'settings@example.test', userPassword: 'settings-password',
    }));
    expect(getConfig()).toMatchObject({
      userEmail: 'settings@example.test', userPassword: 'settings-password',
    });
  });
});
