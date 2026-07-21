import type { OutputFormat } from '../types';
import { getDefaultFields } from './helpers';
import { formatMarkdown } from './markdown';
import { getRuntimeFieldSelection } from './runtime-fields';
import { formatYaml } from './yaml';

export { formatMarkdown, formatYaml };

/** Resolves output format. */
export function resolveOutputFormat(format?: OutputFormat | string): OutputFormat {
  const normalized = format?.trim().toLowerCase();
  if (normalized === 'markdown') return 'md';
  if (normalized === 'yml') return 'yaml';
  if (normalized === 'json' || normalized === 'yaml' || normalized === 'table' || normalized === 'toon' || normalized === 'md') {
    return normalized;
  }
  return 'toon';
}

/** Formats output. */
export function formatOutput<T>(
  data: T,
  format: OutputFormat = 'toon',
  options?: { fields?: string[] }
): string {
  const resolved = resolveOutputFormat(format);
  const fields = resolveFieldsOption(options?.fields);
  const filteredData = filterDataByFields(data, fields);
  switch (resolved) {
    case 'json':
      return JSON.stringify(filteredData, null, 2);
    case 'yaml':
      return formatYaml(filteredData);
    case 'table':
      return formatTable(filteredData, fields);
    case 'md':
      return formatMarkdown(filteredData, fields);
    case 'toon':
    default:
      return formatToon(filteredData, fields);
  }
}

function resolveFieldsOption(explicit?: string[]): string[] | undefined {
  const runtime = getRuntimeFieldSelection();
  return runtime && runtime.length > 0 ? runtime : explicit;
}

function filterDataByFields<T>(data: T, fields?: string[]): T {
  if (!fields || fields.length === 0) return data;

  if (Array.isArray(data)) {
    return data.map((item) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return item;
      }
      return pickFields(item as Record<string, unknown>, fields);
    }) as T;
  }

  if (typeof data === 'object' && data !== null) {
    return pickFields(data as Record<string, unknown>, fields) as T;
  }

  return data;
}

function pickFields(record: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const selected: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(record, field)) {
      selected[field] = record[field];
    }
  }
  return selected;
}

/** Formats toon. */
export function formatToon<T>(data: T, fields?: string[]): string {
  if (data === null || data === undefined) return 'null';
  if (Array.isArray(data)) return formatToonArray(data, fields);
  if (typeof data === 'object') return formatToonObject(data as Record<string, unknown>, fields, '');
  return String(data);
}

function formatToonArray(items: unknown[], fields?: string[]): string {
  if (items.length === 0) return '(empty)';

  const lines: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item === 'object' && item !== null) {
      const obj = formatToonObjectCompact(item as Record<string, unknown>, fields);
      lines.push(`${i}: ${obj}`);
    } else {
      lines.push(`${i}: ${formatPrimitive(item)}`);
    }
  }
  return lines.join('\n');
}

function formatToonObject(obj: Record<string, unknown>, fields?: string[], indent = ''): string {
  const entries = Object.entries(obj);
  const filteredEntries = fields ? entries.filter(([key]) => fields.includes(key)) : entries;

  const lines: string[] = [];
  for (const [key, value] of filteredEntries) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) continue;
    lines.push(`${indent}${key}: ${formatValue(value, indent + '  ', fields)}`);
  }
  return lines.join('\n');
}

function formatToonObjectCompact(obj: Record<string, unknown>, fields?: string[]): string {
  const entries = Object.entries(obj);
  const filteredEntries = fields ? entries.filter(([key]) => fields.includes(key)) : entries.slice(0, 6);

  const parts: string[] = [];
  for (const [key, value] of filteredEntries) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = formatToonObjectCompact(value as Record<string, unknown>);
      if (nested) parts.push(`${key}:{${nested}}`);
    } else {
      parts.push(`${key}:${formatPrimitive(value)}`);
    }
  }
  return parts.join(' ');
}

function formatValue(value: unknown, indent: string, fields?: string[]): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.every((entry) => typeof entry !== 'object')) {
      return `[${value.map(formatPrimitive).join(', ')}]`;
    }
    return `[${value.length} items]`;
  }

  if (typeof value === 'object') {
    const nested = formatToonObject(value as Record<string, unknown>, fields, indent);
    return nested ? `\n${nested}` : '{}';
  }

  return formatPrimitive(value);
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const truncated = value.length > 60 ? `${value.substring(0, 60)}...` : value;
    if (/^[a-zA-Z0-9_\-./:@]+$/.test(truncated)) return truncated;
    const escaped = truncated.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return String(value);
}

/** Formats table. */
export function formatTable<T>(data: T, fields?: string[]): string {
  if (Array.isArray(data)) return formatTableArray(data, fields);
  if (typeof data === 'object' && data !== null) return formatTableObject(data as Record<string, unknown>, fields);
  return String(data);
}

function formatTableArray(items: unknown[], fields?: string[]): string {
  if (items.length === 0) return 'No items.';

  const displayFields = fields || getDefaultFields(items[0]);
  const rows: string[][] = [displayFields];

  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      rows.push(displayFields.map((field) => formatCell(obj[field])));
    }
  }

  const colWidths = displayFields.map((_, i) => Math.max(...rows.map((row) => row[i].length)));

  return [
    rows[0].map((cell, i) => cell.padEnd(colWidths[i])).join(' '),
    colWidths.map((width) => '-'.repeat(width)).join(' '),
    ...rows.slice(1).map((row) => row.map((cell, j) => cell.padEnd(colWidths[j])).join(' ')),
  ].join('\n');
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 30);
  return String(value).substring(0, 40);
}

function formatTableObject(obj: Record<string, unknown>, fields?: string[]): string {
  const displayFields = fields || Object.keys(obj);
  const maxKeyLen = Math.max(...displayFields.map((field) => field.length));

  return displayFields
    .map((key) => `${key.padEnd(maxKeyLen)} ${formatCell(obj[key])}`)
    .join('\n');
}

/** Formats error. */
export function formatError(error: Error): string {
  const message = error.message || 'Unknown error';
  const hints: string[] = [];

  if (message.includes('HTTP 404')) {
    hints.push('endpoint may be unavailable on this Monica instance');
    hints.push('run "monica info capabilities --refresh"');
    hints.push('run "monica info unsupported-commands" for a machine-readable deny-list');
  }
  if (message.includes('HTTP 405')) {
    hints.push('endpoint exists but this method is not supported on the instance');
    hints.push('use a scoped alternative if available (for example: "monica contact-fields list <contact-id>")');
  }
  if (message.includes('Read-only mode enabled')) {
    hints.push('mutating operations are blocked by safety mode');
    hints.push('use "monica config set --read-write" only when write access is explicitly approved');
  }
  if (message.toLowerCase().includes('timed out')) {
    hints.push('increase timeout with "--request-timeout-ms <ms>" for slower endpoints');
  }

  if (hints.length === 0) {
    return `Error: ${message}`;
  }
  return `Error: ${message} (${hints.join('; ')})`;
}

/** Formats success. */
export function formatSuccess(message: string, id?: number | string): string {
  if (id !== undefined) {
    return `✓ ${message} #${id}`;
  }
  return `✓ ${message}`;
}

/** Formats deleted. */
export function formatDeleted(id: number | string): string {
  return `✓ deleted #${id}`;
}
