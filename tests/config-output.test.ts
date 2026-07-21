import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import {
  buildConnectionPayload,
  getConfigOutputFormat,
  getConfigValue,
  missingConfigPayload,
  toDisplayConfig,
} from '../src/commands/config-output';

describe('structured config output helpers', () => {
  const configured = {
    apiUrl: 'https://example.test/api', apiKey: 'secret', userEmail: 'user@example.test',
    userPassword: 'password', defaultFormat: 'yaml' as const, readOnlyMode: true,
    githubRepoStarred: true,
  };

  it('builds complete and default display payloads without secrets', () => {
    expect(toDisplayConfig(configured)).toMatchObject({
      apiUrl: 'https://example.test/api', userEmail: 'user@example.test',
      userPassword: '[hidden]', defaultFormat: 'yaml', readOnlyMode: true,
      githubRepoStarred: true,
    });
    expect(toDisplayConfig({})).toEqual({
      apiUrl: null, apiKey: null, userEmail: null, userPassword: null,
      defaultFormat: 'toon', readOnlyMode: false, githubRepoStarred: false,
    });
  });

  it('resolves every canonical and camel-case key plus unknown values', () => {
    const pairs = [
      ['api-url', 'api-url'], ['apiUrl', 'api-url'], ['api-key', 'api-key'],
      ['apiKey', 'api-key'], ['user-email', 'user-email'], ['userEmail', 'user-email'],
      ['user-password', 'user-password'], ['userPassword', 'user-password'],
      ['read-only-mode', 'read-only-mode'], ['readOnlyMode', 'read-only-mode'],
      ['default-format', 'default-format'], ['defaultFormat', 'default-format'],
      ['github-repo-starred', 'github-repo-starred'], ['githubRepoStarred', 'github-repo-starred'],
      ['all', 'all'],
    ];
    for (const [input, canonical] of pairs) {
      expect(getConfigValue(configured, input)?.key).toBe(canonical);
    }
    expect(getConfigValue(configured, 'unknown')).toBeNull();
  });

  it('builds connection, missing-config, and inherited format payloads', () => {
    expect(buildConnectionPayload(configured, {
      id: 1, name: 'User', email: 'user@example.test', account: { id: 2 },
    })).toEqual({
      ok: true, apiUrl: 'https://example.test/api',
      user: { id: 1, name: 'User', email: 'user@example.test', accountId: 2 },
    });
    expect(buildConnectionPayload({}, {})).toEqual({
      ok: true, apiUrl: null,
      user: { id: null, name: null, email: null, accountId: null },
    });
    expect(missingConfigPayload().ok).toBe(false);
    const parent = new Command().option('--format <format>', '', 'toon');
    const child = parent.command('child');
    parent.setOptionValue('format', 'md');
    expect(getConfigOutputFormat(child)).toBe('md');
  });
});
