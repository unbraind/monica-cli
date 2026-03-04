import { describe, expect, it } from 'vitest';
import { validateOutput } from '../scripts/e2e-output-validation';

describe('e2e output validation', () => {
  it('accepts valid json output', () => {
    expect(validateOutput('{"ok":true}', 'json')).toBeNull();
  });

  it('rejects invalid json output', () => {
    expect(validateOutput('{oops}', 'json')).toContain('JSON validation failed');
  });

  it('accepts valid yaml output', () => {
    expect(validateOutput('data:\n  - id: 1\n', 'yaml')).toBeNull();
  });

  it('rejects invalid yaml output', () => {
    expect(validateOutput('data: [\n', 'yaml')).toContain('YAML validation failed');
  });

  it('accepts valid markdown output', () => {
    const markdown = '**Page 1/1**\n\n| id |\n| --- |\n| 1 |';
    expect(validateOutput(markdown, 'markdown')).toBeNull();
  });

  it('rejects invalid markdown output', () => {
    expect(validateOutput('plain text', 'markdown')).toContain('Markdown validation failed');
  });

  it('accepts valid table output', () => {
    const table = '1/1\nid first_name\n-- ----------\n1  Adrian';
    expect(validateOutput(table, 'table')).toBeNull();
  });

  it('rejects invalid table output', () => {
    expect(validateOutput('id first_name\n1 Adrian', 'table')).toContain('Table validation failed');
  });

  it('accepts valid toon output', () => {
    const toon = '1/1\n0: id:1 first_name:Adrian';
    expect(validateOutput(toon, 'toon')).toBeNull();
  });

  it('rejects invalid toon output', () => {
    expect(validateOutput('1/1\nid:1', 'toon')).toContain('Toon validation failed');
  });
});
