import { describe, expect, it } from 'vitest';
import {
  formatActivity,
  formatCompany,
  formatContact,
  formatNote,
  formatOutput,
  formatReminder,
  formatTable,
  formatTag,
  formatTask,
  formatToon,
} from '../src/formatters';
import { getDefaultFields } from '../src/formatters/helpers';
import { formatMarkdown } from '../src/formatters/markdown';
import { formatYaml } from '../src/formatters/yaml';

describe('formatter edge behavior', () => {
  it('covers primitive, null, nested, escaped, truncated, and filtered TOON values', () => {
    expect(formatOutput('value', 'invalid' as never)).toBe('value');
    expect(formatToon(undefined)).toBe('null');
    expect(formatToon(42)).toBe('42');
    expect(formatToon(['simple value', null])).toContain('0: "simple value"');
    expect(formatToon({ empty: {}, list: [], primitives: [1, 2], objects: [{ id: 1 }] }))
      .toContain('objects: [1 items]');
    expect(formatToon({ nested: { empty: {} } })).toContain('nested: {}');
    expect(formatToon([{ nested: {} }, { nested: { id: 1 } }])).toContain('nested:{id:1}');
    expect(formatToon({ omitted: null, missing: undefined, shown: 1 })).toBe('shown: 1');
    expect(formatToon({ quote: 'a "quoted" \\ value' })).toContain('\\"quoted\\"');
    expect(formatToon({ long: 'x'.repeat(70) })).toContain('...');
    expect(formatToon({ a: 1, b: 2 }, ['b'])).toBe('b: 2');
    expect(formatOutput('plain', 'json', { fields: ['id'] })).toBe('"plain"');
  });

  it('covers table, markdown, YAML, and default-field edge shapes', () => {
    expect(formatTable('plain')).toBe('plain');
    expect(formatTable([])).toBe('No items.');
    expect(formatTable([{ id: 1 }, 'skip'])).toContain('id');
    expect(formatMarkdown('plain')).toBe('plain');
    expect(formatMarkdown([])).toBe('*No items.*');
    expect(formatMarkdown([{ id: null, data: { a: 1 }, text: 'a|b' }]))
      .toContain('a\\|b');
    expect(formatMarkdown({ missing: null, nested: { a: 1 }, list: [1], value: 'x' }))
      .toContain('1 items');
    expect(formatYaml([1, { nested: true }])).toContain('- 1');
    expect(formatYaml({ empty: {}, nested: { value: 'two words' }, omitted: undefined }))
      .toContain('nested:');
    expect(formatYaml('')).toBe('""');
    expect(getDefaultFields(null)).toEqual([]);
    expect(getDefaultFields({ id: 1, nested: {}, value: 'x', other: 2 })).toEqual([
      'id', 'value', 'other',
    ]);
  });

  it('covers every resource-specific formatter wrapper', () => {
    expect(formatContact({ id: 1, first_name: 'A' } as never, 'json')).toContain('first_name');
    expect(formatActivity({ id: 1, summary: 'A' } as never, 'json')).toContain('summary');
    expect(formatNote({ id: 1, body: 'A' } as never, 'json')).toContain('body');
    expect(formatTask({ id: 1, title: 'A' } as never, 'json')).toContain('title');
    expect(formatReminder({ id: 1, title: 'A' } as never, 'json')).toContain('title');
    expect(formatTag({ id: 1, name: 'A' } as never, 'json')).toContain('name');
    expect(formatCompany({ id: 1, name: 'A' } as never, 'json')).toContain('name');
  });
});
