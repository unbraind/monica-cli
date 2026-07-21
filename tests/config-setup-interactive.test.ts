import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const answers: string[] = [];
vi.mock('readline', () => ({
  createInterface: vi.fn(() => {
    const instance: {
      stdoutMuted?: boolean;
      _writeToOutput?: (value: string) => void;
      question: (_question: string, resolve: (answer: string) => void) => void;
      close: ReturnType<typeof vi.fn>;
    } = {
      question: (_question, resolve) => {
        const answer = answers.shift() || '';
        if (answer !== '__muted__') instance.stdoutMuted = false;
        instance._writeToOutput?.('prompt');
        resolve(answer === '__muted__' ? '' : answer);
      },
      close: vi.fn(),
    };
    return instance;
  }),
}));

import { normalizeApiUrl, resolveSetupConfig } from '../src/commands/config-setup';

describe('interactive config setup wizard', () => {
  const originalIsTty = process.stdin.isTTY;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    answers.length = 0;
    process.env = {};
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });
  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTty, configurable: true });
    vi.restoreAllMocks();
  });

  it('prompts for required values, defaults, and read-only safety', async () => {
    answers.push('https://example.test', 'token', 'markdown', 'no');
    const result = await resolveSetupConfig({}, {});
    expect(result).toMatchObject({
      apiUrl: 'https://example.test/api', apiKey: 'token', defaultFormat: 'md',
      readOnlyMode: false,
    });
    expect(process.stdout.write).toHaveBeenCalledWith('\n');
  });

  it('uses the safety default for an unrecognized boolean answer', async () => {
    answers.push('https://example.test', 'token', 'toon', 'maybe');
    expect((await resolveSetupConfig({}, {})).readOnlyMode).toBe(true);
  });

  it('applies the explicit read-write setup choice', async () => {
    const result = await resolveSetupConfig({
      apiUrl: 'https://example.test', apiKey: 'token', readWrite: true, nonInteractive: true,
    }, {});
    expect(result.readOnlyMode).toBe(false);
  });

  it('prompts for an email when a password is supplied', async () => {
    answers.push('user@example.test', 'toon', 'yes');
    const result = await resolveSetupConfig({
      apiUrl: 'https://example.test/api', apiKey: 'token', userPassword: 'password',
    }, {});
    expect(result.userEmail).toBe('user@example.test');
    expect(result.userPassword).toBe('password');
  });

  it('prompts for a hidden password when an email is supplied', async () => {
    answers.push('password', 'toon', '');
    const result = await resolveSetupConfig({
      apiUrl: 'https://example.test/api', apiKey: 'token', userEmail: 'user@example.test',
    }, {});
    expect(result.userPassword).toBe('password');
    expect(result.readOnlyMode).toBe(true);
  });

  it('covers URL fallback normalization and validation errors', async () => {
    expect(normalizeApiUrl('')).toBe('');
    expect(normalizeApiUrl('not a url/')).toBe('not a url');
    await expect(resolveSetupConfig({
      apiUrl: 'ftp://example.test', apiKey: 'token', nonInteractive: true,
    }, {})).rejects.toThrow('must start with http:// or https://');
    await expect(resolveSetupConfig({
      apiUrl: 'https://example.test', apiKey: '   ', nonInteractive: true,
    }, {})).rejects.toThrow('Missing required values: api-key');
  });

  it('rejects blank required interactive answers after completing the wizard', async () => {
    answers.push('', '', 'toon', 'yes');
    await expect(resolveSetupConfig({}, {})).rejects.toThrow('Missing required values');
  });

  it('allows optional credential prompts to be left blank', async () => {
    answers.push('', 'toon', 'yes');
    await expect(resolveSetupConfig({
      apiUrl: 'https://example.test/api', apiKey: 'token', userPassword: 'password',
    }, {})).rejects.toThrow('requires --user-email');

    answers.push('', 'toon', 'yes');
    const result = await resolveSetupConfig({
      apiUrl: 'https://example.test/api', apiKey: 'token', userEmail: 'user@example.test',
    }, {});
    expect(result.userPassword).toBeUndefined();
  });

  it('suppresses readline echo while a hidden answer remains muted', async () => {
    answers.push('__muted__', 'toon', 'yes');
    const result = await resolveSetupConfig({
      apiUrl: 'https://example.test/api', apiKey: 'token', userEmail: 'user@example.test',
    }, {});
    expect(result.userPassword).toBeUndefined();
  });

  it('parses every boolean environment spelling and ignores invalid values', async () => {
    for (const value of ['1', 'true', 'yes', 'y', 'on']) {
      process.env.MONICA_API_URL = 'https://example.test';
      process.env.MONICA_API_KEY = 'token';
      process.env.MONICA_READ_ONLY = value;
      expect((await resolveSetupConfig({ nonInteractive: true }, {})).readOnlyMode).toBe(true);
    }
    for (const value of ['0', 'false', 'no', 'n', 'off']) {
      process.env.MONICA_READ_ONLY = value;
      expect((await resolveSetupConfig({ nonInteractive: true }, {})).readOnlyMode).toBe(false);
    }
    process.env.MONICA_READ_ONLY = 'invalid';
    expect((await resolveSetupConfig({ nonInteractive: true }, {})).readOnlyMode).toBe(true);
  });
});
