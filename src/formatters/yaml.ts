export function formatYaml(value: unknown, indent = 0): string {
  const pad = ' '.repeat(indent);

  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return formatYamlString(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value
      .map((item) => {
        if (isYamlInlineValue(item)) return `${pad}- ${formatYaml(item)}`;
        const nested = formatYaml(item, indent + 2);
        return `${pad}-\n${nested}`;
      })
      .join('\n');
  }

  const obj = value as Record<string, unknown>;
  const entries = Object.entries(obj).filter(([, entryValue]) => entryValue !== undefined);
  if (entries.length === 0) return '{}';

  return entries
    .map(([key, entryValue]) => {
      if (isYamlInlineValue(entryValue)) return `${pad}${key}: ${formatYaml(entryValue)}`;
      const nested = formatYaml(entryValue, indent + 2);
      return `${pad}${key}:\n${nested}`;
    })
    .join('\n');
}

function isYamlInlineValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function formatYamlString(value: string): string {
  if (value === '') return '""';
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value;
  return JSON.stringify(value);
}
