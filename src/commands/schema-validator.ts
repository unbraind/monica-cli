export interface JsonSchema {
  type?: string;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
}

export interface ValidationError {
  path: string;
  message: string;
}

function typeOfValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function isTypeMatch(value: unknown, schemaType: string): boolean {
  switch (schemaType) {
    case 'object':
      return !!value && typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    default:
      return true;
  }
}

export function validateValueAgainstSchema(value: unknown, schema: JsonSchema, path = '$'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (schema.type && !isTypeMatch(value, schema.type)) {
    errors.push({
      path,
      message: `Expected type ${schema.type} but got ${typeOfValue(value)}`,
    });
    return errors;
  }

  if (schema.enum && schema.enum.length > 0) {
    const matchesEnum = schema.enum.some((allowed) => JSON.stringify(allowed) === JSON.stringify(value));
    if (!matchesEnum) {
      errors.push({
        path,
        message: `Value is not in enum: ${schema.enum.map((entry) => JSON.stringify(entry)).join(', ')}`,
      });
    }
  }

  if (schema.type === 'object' && schema.required) {
    const record = value as Record<string, unknown>;
    for (const requiredKey of schema.required) {
      if (!(requiredKey in record)) {
        errors.push({
          path,
          message: `Missing required key: ${requiredKey}`,
        });
      }
    }
  }

  if (schema.type === 'object' && schema.properties) {
    const record = value as Record<string, unknown>;
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      if (!(key in record)) continue;
      errors.push(...validateValueAgainstSchema(record[key], propertySchema, `${path}.${key}`));
    }
  }

  if (schema.type === 'array' && schema.items && Array.isArray(value)) {
    value.forEach((entry, index) => {
      errors.push(...validateValueAgainstSchema(entry, schema.items as JsonSchema, `${path}[${index}]`));
    });
  }

  return errors;
}
