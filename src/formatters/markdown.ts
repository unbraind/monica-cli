import { getDefaultFields } from './helpers';

export function formatMarkdown<T>(data: T, fields?: string[]): string {
  if (Array.isArray(data)) return formatMarkdownTable(data, fields);
  if (typeof data === 'object' && data !== null) return formatMarkdownObject(data as Record<string, unknown>, fields);
  return String(data);
}

function formatMarkdownTable(items: unknown[], fields?: string[]): string {
  if (items.length === 0) return '*No items.*';

  const displayFields = fields || getDefaultFields(items[0]);
  const rows: string[][] = [];

  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      rows.push(displayFields.map((field) => formatMarkdownCell(obj[field])));
    }
  }

  const header = `| ${displayFields.join(' | ')} |`;
  const separator = `| ${displayFields.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return `${header}\n${separator}\n${body}`;
}

function formatMarkdownCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 40).replace(/\|/g, '\\|');
  return String(value).substring(0, 60).replace(/\|/g, '\\|');
}

function formatMarkdownObject(obj: Record<string, unknown>, fields?: string[]): string {
  const entries = Object.entries(obj);
  const filtered = fields ? entries.filter(([key]) => fields.includes(key)) : entries;

  return filtered
    .map(([key, value]) => {
      if (value === null || value === undefined) return `- **${key}**: –`;
      if (typeof value === 'object' && !Array.isArray(value)) return `- **${key}**: \`${JSON.stringify(value).substring(0, 60)}\``;
      if (Array.isArray(value)) return `- **${key}**: ${value.length} items`;
      return `- **${key}**: ${String(value)}`;
    })
    .join('\n');
}
