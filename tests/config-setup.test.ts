import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveSetupConfig } from '../src/commands/config-setup';

describe('config setup wizard', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('resolves options in non-interactive mode', async () => {
    const result = await resolveSetupConfig({
      apiUrl: 'http://example.local/api/',
      apiKey: 'token',
      userEmail: 'user@example.com',
      userPassword: 'pw',
      readOnly: true,
      nonInteractive: true,
    }, {});

    expect(result.apiUrl).toBe('http://example.local/api');
    expect(result.apiKey).toBe('token');
    expect(result.userEmail).toBe('user@example.com');
    expect(result.userPassword).toBe('pw');
    expect(result.defaultFormat).toBe('toon');
    expect(result.readOnlyMode).toBe(true);
  });

  it('throws when read-only and read-write are both set', async () => {
    await expect(resolveSetupConfig({
      apiUrl: 'http://example.local/api',
      apiKey: 'token',
      readOnly: true,
      readWrite: true,
      nonInteractive: true,
    }, {})).rejects.toThrow('Cannot use both --read-only and --read-write');
  });

  it('throws when required values are missing in non-interactive mode', async () => {
    await expect(resolveSetupConfig({
      nonInteractive: true,
    }, {})).rejects.toThrow('Missing required values');
  });

  it('inherits existing read-only setting when no override is passed', async () => {
    const result = await resolveSetupConfig({
      apiUrl: 'http://example.local/api',
      apiKey: 'token',
      nonInteractive: true,
    }, { readOnlyMode: true });

    expect(result.readOnlyMode).toBe(true);
  });

  it('normalizes base host to /api path', async () => {
    const result = await resolveSetupConfig({
      apiUrl: 'http://example.local/',
      apiKey: 'token',
      nonInteractive: true,
    }, {});

    expect(result.apiUrl).toBe('http://example.local/api');
  });

  it('defaults read-only mode to true when no explicit setting exists', async () => {
    const result = await resolveSetupConfig({
      apiUrl: 'http://example.local/api',
      apiKey: 'token',
      nonInteractive: true,
    }, {});

    expect(result.readOnlyMode).toBe(true);
  });

  it('uses MONICA_* env values in non-interactive mode when flags are missing', async () => {
    process.env.MONICA_API_URL = 'http://env.local';
    process.env.MONICA_API_KEY = 'env-token';
    process.env.MONICA_USER_EMAIL = 'env@example.com';
    process.env.MONICA_USER_PASSWORD = 'env-password';
    process.env.MONICA_DEFAULT_FORMAT = 'yaml';
    process.env.MONICA_READ_ONLY = 'false';

    const result = await resolveSetupConfig({
      nonInteractive: true,
    }, {});

    expect(result.apiUrl).toBe('http://env.local/api');
    expect(result.apiKey).toBe('env-token');
    expect(result.userEmail).toBe('env@example.com');
    expect(result.userPassword).toBe('env-password');
    expect(result.defaultFormat).toBe('yaml');
    expect(result.readOnlyMode).toBe(false);
  });

  it('prefers explicit setup flags over MONICA_* env defaults', async () => {
    process.env.MONICA_API_URL = 'http://env.local';
    process.env.MONICA_API_KEY = 'env-token';
    process.env.MONICA_DEFAULT_FORMAT = 'yaml';
    process.env.MONICA_READ_ONLY = 'false';

    const result = await resolveSetupConfig({
      apiUrl: 'http://flags.local/api',
      apiKey: 'flags-token',
      readOnly: true,
      nonInteractive: true,
    }, {});

    expect(result.apiUrl).toBe('http://flags.local/api');
    expect(result.apiKey).toBe('flags-token');
    expect(result.defaultFormat).toBe('yaml');
    expect(result.readOnlyMode).toBe(true);
  });

  it('resolves explicit default format aliases', async () => {
    const result = await resolveSetupConfig({
      apiUrl: 'http://example.local/api',
      apiKey: 'token',
      defaultFormat: 'markdown',
      nonInteractive: true,
    }, {});

    expect(result.defaultFormat).toBe('md');
  });

  it('throws when api key contains whitespace', async () => {
    await expect(resolveSetupConfig({
      apiUrl: 'http://example.local/api',
      apiKey: 'invalid token',
      nonInteractive: true,
    }, {})).rejects.toThrow('Invalid API key');
  });

  it('throws when optional user email is invalid', async () => {
    await expect(resolveSetupConfig({
      apiUrl: 'http://example.local/api',
      apiKey: 'token',
      userEmail: 'not-an-email',
      nonInteractive: true,
    }, {})).rejects.toThrow('Invalid user email');
  });

  it('throws when user password is provided without user email', async () => {
    await expect(resolveSetupConfig({
      apiUrl: 'http://example.local/api',
      apiKey: 'token',
      userPassword: 'pw',
      nonInteractive: true,
    }, {})).rejects.toThrow('requires --user-email');
  });
});
