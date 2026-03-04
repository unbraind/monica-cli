export function getDefaultFields(item: unknown): string[] {
  if (typeof item !== 'object' || item === null) return [];

  const obj = item as Record<string, unknown>;
  const priority = ['id', 'name', 'first_name', 'last_name', 'title', 'summary'];
  const fields = priority.filter((field) => field in obj);

  for (const key of Object.keys(obj)) {
    if (!fields.includes(key) && typeof obj[key] !== 'object') fields.push(key);
    if (fields.length >= 5) break;
  }

  return fields;
}
