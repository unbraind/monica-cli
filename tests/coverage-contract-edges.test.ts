import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildConnectionPayload,
  getConfigValue,
  toDisplayConfig,
} from '../src/commands/config-output';
import { resolveCommandOutputFormat } from '../src/commands/output-format';
import { validateValueAgainstSchema } from '../src/commands/schema-validator';
import { formatError, formatPaginatedResponse } from '../src/formatters';
import { formatMarkdown } from '../src/formatters/markdown';
import { ensurePrivateDirectory, outputSingleKey, writePrivateFile } from '../src/utils/settings';

describe('coverage contract edges', () => {
  afterEach(() => vi.restoreAllMocks());

  it('represents every missing configuration value without leaking credentials', () => {
    expect(toDisplayConfig({})).toEqual({
      apiUrl: null, apiKey: null, userEmail: null, userPassword: null,
      defaultFormat: 'toon', readOnlyMode: false, githubRepoStarred: false,
    });
    for (const key of ['api-url', 'api-key', 'user-email', 'user-password', 'default-format']) {
      expect(getConfigValue({}, key)?.value).not.toBeUndefined();
    }
    expect(buildConnectionPayload({}, {}).user).toEqual({
      id: null, name: null, email: null, accountId: null,
    });
  });

  it('resolves global, local, parent, and fallback output formats', () => {
    const global = new Command().option('--format <format>').setOptionValue('format', 'yaml');
    expect(resolveCommandOutputFormat(global)).toBe('yaml');

    const local = new Command().option('--format <format>');
    vi.spyOn(local, 'optsWithGlobals').mockReturnValue({});
    local.setOptionValue('format', 'json');
    expect(resolveCommandOutputFormat(local)).toBe('json');

    const parent = new Command().option('--format <format>');
    const child = parent.command('child');
    vi.spyOn(child, 'optsWithGlobals').mockReturnValue({});
    vi.spyOn(child, 'opts').mockReturnValue({});
    parent.setOptionValue('format', 'md');
    expect(resolveCommandOutputFormat(child)).toBe('md');

    const fallback = new Command();
    vi.spyOn(fallback, 'optsWithGlobals').mockReturnValue({});
    expect(resolveCommandOutputFormat(fallback, 'table')).toBe('table');
  });

  it('validates null values and formats sparse paginated records', () => {
    expect(validateValueAgainstSchema(null, { type: 'object' })).toEqual([
      { path: '$', message: 'Expected type object but got null' },
    ]);
    const response = {
      data: [null, ['nested'], 'plain', { id: 1, hidden: true }],
      meta: { current_page: 1, last_page: 1, per_page: 4, total: 4 },
      links: { first: null, last: null, prev: null, next: null },
    };
    const formatted = formatPaginatedResponse(response, 'json', ['id']);
    expect(JSON.parse(formatted).data).toEqual([null, ['nested'], 'plain', { id: 1 }]);
    expect(formatPaginatedResponse({ ...response, data: [], meta: { ...response.meta, total: 0 } }, 'md'))
      .toBe('*No results*');
    expect(formatPaginatedResponse({ ...response, data: [], meta: { ...response.meta, total: 0 } }, 'table'))
      .toBe('No results');
  });

  it('formats primitive markdown rows and errors without messages', () => {
    expect(formatMarkdown(['primitive'], ['id'])).toContain('| id |');
    expect(formatMarkdown([{ value: { nested: true } }], ['value'])).toContain('nested');
    expect(formatError(new Error(''))).toContain('Unknown error');
  });

  it('does not attempt chmod on Windows', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'monica-win32-'));
    const file = path.join(directory, 'settings.json');
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    try {
      ensurePrivateDirectory(directory);
      writePrivateFile(file, '{}');
      expect(fs.readFileSync(file, 'utf8')).toBe('{}');
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('prints every empty scalar setting projection', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    for (const key of [
      'api-url', 'api-key', 'user-email', 'user-password', 'read-only-mode',
      'default-format', 'github-repo-starred',
    ]) outputSingleKey({}, key);
    expect(log.mock.calls.map(([value]) => value)).toEqual([
      'Not set', 'Not set', 'Not set', 'Not set', 'false', 'toon', 'false',
    ]);
  });
});
