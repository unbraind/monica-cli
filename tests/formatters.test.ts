import { afterEach, describe, it, expect } from 'vitest';
import { parse as parseYaml } from 'yaml';
import {
  formatToon,
  formatTable,
  formatMarkdown,
  formatOutput,
  resolveOutputFormat,
  formatPaginatedResponse,
  formatError,
  formatSuccess,
  formatDeleted,
  ContactFields,
  ActivityFields,
  NoteFields,
  TaskFields,
} from '../src/formatters/toon';
import type { PaginatedResponse, Contact } from '../src/types';
import { resetRuntimeFieldSelection, setRuntimeFieldSelection } from '../src/formatters/runtime-fields';

afterEach(() => {
  resetRuntimeFieldSelection();
});

describe('formatToon', () => {
  it('formats null as null', () => {
    expect(formatToon(null)).toBe('null');
  });

  it('formats undefined as null', () => {
    expect(formatToon(undefined)).toBe('null');
  });

  it('formats primitives', () => {
    expect(formatToon(42)).toBe('42');
    expect(formatToon('hello')).toBe('hello');
    expect(formatToon(true)).toBe('true');
  });

  it('formats empty array', () => {
    expect(formatToon([])).toBe('(empty)');
  });

  it('formats array of objects', () => {
    const result = formatToon([{ id: 1 }, { id: 2 }]);
    expect(result).toContain('0:');
    expect(result).toContain('1:');
  });

  it('formats simple object', () => {
    const result = formatToon({ id: 1, name: 'Test' });
    expect(result).toContain('id:');
    expect(result).toContain('name:');
  });

  it('formats nested object', () => {
    const result = formatToon({ user: { name: 'John' } });
    expect(result).toContain('user:');
    expect(result).toContain('name:');
  });

  it('truncates long strings', () => {
    const longStr = 'a'.repeat(150);
    const result = formatToon({ text: longStr });
    expect(result).toContain('...');
  });
});

describe('resolveOutputFormat', () => {
  it('maps markdown alias to md', () => {
    expect(resolveOutputFormat('markdown')).toBe('md');
  });

  it('maps yml alias to yaml', () => {
    expect(resolveOutputFormat('yml')).toBe('yaml');
  });
});

describe('formatTable', () => {
  it('formats empty array', () => {
    expect(formatTable([])).toBe('No items.');
  });

  it('formats array of objects', () => {
    const result = formatTable([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]);
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('Alice');
    expect(result).toContain('Bob');
  });

  it('formats single object', () => {
    const result = formatTable({ id: 1, name: 'Test' });
    expect(result).toContain('id');
    expect(result).toContain('1');
  });
});

describe('formatOutput', () => {
  it('formats as toon by default', () => {
    const result = formatOutput({ id: 1 });
    expect(result).toContain('id:');
  });

  it('formats as json', () => {
    const result = formatOutput({ id: 1 }, 'json');
    expect(result).toBe('{\n  "id": 1\n}');
  });

  it('formats as table', () => {
    const result = formatOutput([{ id: 1 }], 'table');
    expect(result).toContain('id');
  });

  it('formats as yaml', () => {
    const result = formatOutput({ id: 1, name: 'Test User' }, 'yaml');
    expect(result).toContain('id: 1');
    expect(result).toContain('name: "Test User"');
  });

  it('formats nested empty arrays in yaml as valid inline values', () => {
    const result = formatOutput({ relationships: { contacts: [] } }, 'yaml');
    expect(result).toContain('contacts: []');
    expect(() => parseYaml(result)).not.toThrow();
  });

  it('formats with markdown alias', () => {
    const result = formatOutput({ id: 1 }, 'markdown');
    expect(result).toContain('- **id**: 1');
  });

  it('formats with yml alias', () => {
    const result = formatOutput({ id: 1 }, 'yml');
    expect(result).toContain('id: 1');
  });

  it('applies runtime field selection override to json output', () => {
    setRuntimeFieldSelection(['id']);
    const result = formatOutput({ id: 1, name: 'Test' }, 'json');
    expect(JSON.parse(result)).toEqual({ id: 1 });
  });

  it('applies runtime field selection override to yaml output', () => {
    setRuntimeFieldSelection(['id']);
    const result = formatOutput({ id: 1, name: 'Test' }, 'yaml');
    expect(result).toContain('id: 1');
    expect(result).not.toContain('name:');
  });

  it('applies runtime field selection override to table output', () => {
    setRuntimeFieldSelection(['id']);
    const result = formatOutput({ id: 1, name: 'Test' }, 'table');
    expect(result).toContain('id');
    expect(result).toContain('1');
    expect(result).not.toContain('name');
    expect(result).not.toContain('Test');
  });

  it('applies runtime field selection override to markdown output', () => {
    setRuntimeFieldSelection(['id']);
    const result = formatOutput({ id: 1, name: 'Test' }, 'md');
    expect(result).toContain('**id**');
    expect(result).toContain('1');
    expect(result).not.toContain('**name**');
    expect(result).not.toContain('Test');
  });

  it('applies runtime field selection override to toon output', () => {
    setRuntimeFieldSelection(['id']);
    const result = formatOutput({ id: 1, name: 'Test' }, 'toon');
    expect(result).toContain('id: 1');
    expect(result).not.toContain('name');
    expect(result).not.toContain('Test');
  });

  it('gives runtime field selection precedence over explicit formatter fields', () => {
    setRuntimeFieldSelection(['id']);
    const result = formatOutput({ id: 1, name: 'Test', email: 'test@example.com' }, 'json', { fields: ['name', 'email'] });
    expect(JSON.parse(result)).toEqual({ id: 1 });
  });

  it('filters arrays of objects when runtime fields are set', () => {
    setRuntimeFieldSelection(['id']);
    const result = formatOutput([{ id: 1, name: 'First' }, { id: 2, name: 'Second' }], 'json');
    expect(JSON.parse(result)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('does not modify arrays of primitives when runtime fields are set', () => {
    setRuntimeFieldSelection(['id']);
    const result = formatOutput([1, 2, 3], 'json');
    expect(JSON.parse(result)).toEqual([1, 2, 3]);
  });

  it('silently omits missing keys from runtime field selection', () => {
    setRuntimeFieldSelection(['id', 'missing']);
    const result = formatOutput({ id: 1, name: 'Test' }, 'json');
    expect(JSON.parse(result)).toEqual({ id: 1 });
  });

  it('clears runtime field selection via reset helper', () => {
    setRuntimeFieldSelection(['id']);
    resetRuntimeFieldSelection();
    const result = formatOutput({ id: 1, name: 'Test' }, 'json');
    expect(JSON.parse(result)).toEqual({ id: 1, name: 'Test' });
  });
});

describe('formatPaginatedResponse', () => {
  it('formats paginated response in toon format', () => {
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 1, object: 'contact', first_name: 'Test', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: 'url', per_page: 10, to: 1, total: 1 },
    };
    const result = formatPaginatedResponse(response, 'toon');
    expect(result).toContain('1/1');
    expect(result).toContain('id:1');
  });

  it('formats paginated response in json format', () => {
    const response: PaginatedResponse<Contact> = {
      data: [],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 0, last_page: 1, path: 'url', per_page: 10, to: 0, total: 0 },
    };
    const result = formatPaginatedResponse(response, 'json');
    expect(result).toContain('"data"');
  });

  it('formats paginated response in yaml format', () => {
    const response: PaginatedResponse<Contact> = {
      data: [],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 0, last_page: 1, path: 'url', per_page: 10, to: 0, total: 0 },
    };
    const result = formatPaginatedResponse(response, 'yaml');
    expect(result).toContain('data:');
    expect(result).toContain('[]');
    expect(result).toContain('meta:');
  });

  it('applies runtime field selection override to paginated json output', () => {
    setRuntimeFieldSelection(['id']);
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 7, object: 'contact', first_name: 'Raw', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: 'url', per_page: 10, to: 1, total: 1 },
    };
    const result = formatPaginatedResponse(response, 'json');
    expect(JSON.parse(result)).toEqual({
      ...response,
      data: [{ id: 7 }],
    });
  });

  it('applies runtime field selection override to paginated yaml output and preserves metadata', () => {
    setRuntimeFieldSelection(['id']);
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 7, object: 'contact', first_name: 'Raw', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: 'url', per_page: 10, to: 1, total: 1 },
    };
    const result = formatPaginatedResponse(response, 'yaml');
    const parsed = parseYaml(result) as PaginatedResponse<{ id: number }>;
    expect(parsed.meta.current_page).toBe(1);
    expect(parsed.meta.total).toBe(1);
    expect(parsed.data).toEqual([{ id: 7 }]);
  });

  it('applies runtime field selection override to paginated markdown output', () => {
    setRuntimeFieldSelection(['id']);
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 7, object: 'contact', first_name: 'Raw', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: 'url', per_page: 10, to: 1, total: 1 },
    };
    const result = formatPaginatedResponse(response, 'md');
    expect(result).toContain('**Page 1/1** (1 total)');
    expect(result).toContain('| id |');
    expect(result).not.toContain('first_name');
    expect(result).not.toContain('Raw');
  });

  it('applies runtime field selection override to paginated toon output', () => {
    setRuntimeFieldSelection(['id']);
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 7, object: 'contact', first_name: 'Raw', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: 'url', per_page: 10, to: 1, total: 1 },
    };
    const result = formatPaginatedResponse(response, 'toon');
    expect(result).toContain('1/1');
    expect(result).toContain('id:7');
    expect(result).not.toContain('first_name');
    expect(result).not.toContain('Raw');
  });

  it('applies runtime field selection override to paginated table output', () => {
    setRuntimeFieldSelection(['id']);
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 7, object: 'contact', first_name: 'Raw', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: 'url', per_page: 10, to: 1, total: 1 },
    };
    const result = formatPaginatedResponse(response, 'table');
    expect(result).toContain('1/1');
    expect(result).toContain('\nid');
    expect(result).toContain('\n7');
    expect(result).not.toContain('first_name');
    expect(result).not.toContain('Raw');
  });

  it('formats paginated response as raw JSON data when raw is true', () => {
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 7, object: 'contact', first_name: 'Raw', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: 'url', per_page: 10, to: 1, total: 1 },
    };

    const result = formatPaginatedResponse(response, 'toon', undefined, true);

    expect(JSON.parse(result)).toEqual(response.data);
  });

  it('applies runtime field selection when raw output is requested', () => {
    setRuntimeFieldSelection(['id']);
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 7, object: 'contact', first_name: 'Raw', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: 'url', per_page: 10, to: 1, total: 1 },
    };

    const result = formatPaginatedResponse(response, 'json', undefined, true);

    expect(JSON.parse(result)).toEqual([{ id: 7 }]);
  });
});

describe('formatError', () => {
  it('formats error message', () => {
    const error = new Error('Test error');
    const result = formatError(error);
    expect(result).toContain('Error');
    expect(result).toContain('Test error');
  });

  it('adds capability hint for HTTP 404 endpoint errors', () => {
    const error = new Error('HTTP 404');
    const result = formatError(error);
    expect(result).toContain('info capabilities');
    expect(result).toContain('unsupported-commands');
  });

  it('adds method fallback hint for HTTP 405 endpoint errors', () => {
    const error = new Error('HTTP 405');
    const result = formatError(error);
    expect(result).toContain('method is not supported');
    expect(result).toContain('contact-fields list <contact-id>');
  });

  it('adds read-only remediation hint for blocked write operations', () => {
    const error = new Error('Read-only mode enabled: blocked POST /contacts');
    const result = formatError(error);
    expect(result).toContain('mutating operations are blocked');
    expect(result).toContain('config set --read-write');
  });

  it('adds timeout remediation hint for request timeout errors', () => {
    const error = new Error('Request timed out after 45000ms: GET /contacts');
    const result = formatError(error);
    expect(result).toContain('request-timeout-ms');
  });
});

describe('formatSuccess', () => {
  it('formats success with id', () => {
    const result = formatSuccess('Created', 123);
    expect(result).toBe('✓ Created #123');
  });

  it('formats success without id', () => {
    const result = formatSuccess('Done');
    expect(result).toBe('✓ Done');
  });
});

describe('formatDeleted', () => {
  it('formats deleted message', () => {
    const result = formatDeleted(123);
    expect(result).toBe('✓ deleted #123');
  });
});

describe('formatMarkdown', () => {
  it('formats array as markdown table', () => {
    const result = formatOutput([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ], 'md');
    expect(result).toContain('| id | name |');
    expect(result).toContain('| --- | --- |');
    expect(result).toContain('| 1 | Alice |');
    expect(result).toContain('| 2 | Bob |');
  });

  it('formats single object as markdown list', () => {
    const result = formatOutput({ id: 1, name: 'Test' }, 'md');
    expect(result).toContain('- **id**: 1');
    expect(result).toContain('- **name**: Test');
  });

  it('formats empty array in md format', () => {
    const result = formatOutput([], 'md');
    expect(result).toBe('*No items.*');
  });

  it('formats paginated response in md format', () => {
    const response: PaginatedResponse<Contact> = {
      data: [{ id: 1, object: 'contact', first_name: 'Test', last_name: null, nickname: null, gender: 'male', is_partial: false, is_dead: false, last_called: null, last_activity_together: null, stay_in_touch_frequency: null, stay_in_touch_trigger_date: null, information: {}, created_at: '2024-01-01', updated_at: '2024-01-01' }],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 2, path: 'url', per_page: 10, to: 1, total: 15 },
    };
    const result = formatPaginatedResponse(response, 'md');
    expect(result).toContain('**Page 1/2** (15 total)');
    expect(result).toContain('| id |');
  });

  it('formats empty paginated response in md format', () => {
    const response: PaginatedResponse<Contact> = {
      data: [],
      links: { first: 'url', last: 'url', prev: null, next: null },
      meta: { current_page: 1, from: 0, last_page: 1, path: 'url', per_page: 10, to: 0, total: 0 },
    };
    const result = formatPaginatedResponse(response, 'md');
    expect(result).toBe('*No results*');
  });
});

describe('Field constants', () => {
  it('has ContactFields', () => {
    expect(ContactFields).toContain('id');
    expect(ContactFields).toContain('first_name');
  });

  it('has ActivityFields', () => {
    expect(ActivityFields).toContain('id');
    expect(ActivityFields).toContain('summary');
  });

  it('has NoteFields', () => {
    expect(NoteFields).toContain('id');
    expect(NoteFields).toContain('body');
  });

  it('has TaskFields', () => {
    expect(TaskFields).toContain('id');
    expect(TaskFields).toContain('title');
  });
});
