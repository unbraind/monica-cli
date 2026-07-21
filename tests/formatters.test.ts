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
} from '../src/formatters';
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

  it('escapes backslashes before quotes in quoted strings', () => {
    expect(formatToon({ text: 'path\\to "quoted"' }))
      .toBe('text: "path\\\\to \\"quoted\\""');
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
