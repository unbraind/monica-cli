import type { JsonSchema } from './schema-validator';

function buildObjectSample(schema: JsonSchema): Record<string, unknown> {
  const properties = schema.properties || {};
  const requiredKeys = schema.required || Object.keys(properties);
  const sample: Record<string, unknown> = {};

  requiredKeys.forEach((key) => {
    const childSchema = properties[key];
    sample[key] = childSchema ? generateSampleFromSchema(childSchema) : null;
  });

  return sample;
}

export function generateSampleFromSchema(schema: JsonSchema): unknown {
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  if (schema.type === 'object') {
    return buildObjectSample(schema);
  }

  if (schema.type === 'array') {
    if (!schema.items) return [];
    return [generateSampleFromSchema(schema.items)];
  }

  if (schema.type === 'string') return 'string';
  if (schema.type === 'number') return 0;
  if (schema.type === 'boolean') return false;
  if (schema.type === 'null') return null;

  if (schema.properties) {
    return buildObjectSample(schema);
  }
  if (schema.items) {
    return [generateSampleFromSchema(schema.items)];
  }

  return null;
}
