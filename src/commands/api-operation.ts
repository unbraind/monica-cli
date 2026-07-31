import type {
  ApiEdition,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiSchema,
} from './api-research-contract-types';
import { buildOpenApiDocument } from './api-research-openapi';

/** Describes one exact operation resolved from a bundled Monica contract. */
export interface ResolvedApiOperation {
  edition: ApiEdition;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  operation: OpenApiOperation;
}

/** Represents repeatable CLI key/value inputs after duplicate detection. */
export type ApiInputMap = Record<string, string>;

/** Adds one repeatable key=value CLI option without losing earlier values. */
export function collectApiInput(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}

/** Parses repeatable key=value values and rejects empty or duplicate keys. */
export function parseApiInputs(values: string[], label: string): ApiInputMap {
  const result: ApiInputMap = {};
  for (const value of values) {
    const separator = value.indexOf('=');
    const key = separator < 0 ? '' : value.slice(0, separator).trim();
    if (!key) throw new Error(`${label} must use non-empty key=value syntax: ${value}`);
    if (Object.hasOwn(result, key)) throw new Error(`Duplicate ${label} key: ${key}`);
    result[key] = value.slice(separator + 1);
  }
  return result;
}

/** Resolves one exact operation ID from one authoritative bundled edition. */
export function resolveApiOperation(
  operationId: string,
  edition: ApiEdition,
  document: OpenApiDocument = buildOpenApiDocument(edition),
): ResolvedApiOperation {
  const matches: ResolvedApiOperation[] = [];
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (operation.operationId === operationId) {
        matches.push({
          edition,
          method: method.toUpperCase() as ResolvedApiOperation['method'],
          path,
          operation,
        });
      }
    }
  }
  if (matches.length === 0) {
    throw new Error(`Unknown ${edition} Monica operation ID: ${operationId}`);
  }
  if (matches.length !== 1) {
    throw new Error(`Monica operation ID is not unique: ${operationId}`);
  }
  return matches[0]!;
}

function declaredParameters(
  resolved: ResolvedApiOperation,
  location: 'path' | 'query',
): Array<Record<string, unknown>> {
  return (resolved.operation.parameters ?? []).filter((parameter) => parameter.in === location);
}

function validateInputs(
  resolved: ResolvedApiOperation,
  location: 'path' | 'query',
  inputs: ApiInputMap,
): void {
  const parameters = declaredParameters(resolved, location);
  const byName = new Map(parameters.map((parameter) => [String(parameter.name), parameter]));
  for (const key of Object.keys(inputs)) {
    if (!byName.has(key)) throw new Error(`Undeclared ${location} parameter: ${key}`);
  }
  for (const parameter of parameters) {
    const name = String(parameter.name);
    const value = inputs[name];
    if (parameter.required === true && value === undefined) {
      throw new Error(`Missing required ${location} parameter: ${name}`);
    }
    const schema = parameter.schema as OpenApiSchema | undefined;
    const allowed = Array.isArray(schema?.enum) ? schema.enum.map(String) : null;
    if (value !== undefined && allowed && !allowed.includes(value)) {
      throw new Error(`Invalid ${location} parameter ${name}; use: ${allowed.join(', ')}`);
    }
    if (value !== undefined && schema?.type === 'integer' && !/^-?\d+$/u.test(value)) {
      throw new Error(`${location} parameter ${name} must be an integer`);
    }
    if (value !== undefined && schema?.type === 'number' && !Number.isFinite(Number(value))) {
      throw new Error(`${location} parameter ${name} must be a number`);
    }
    if (value !== undefined && schema?.type === 'boolean' && value !== 'true' && value !== 'false') {
      throw new Error(`${location} parameter ${name} must be true or false`);
    }
  }
}

/** Validates declared inputs and returns an encoded request endpoint. */
export function buildApiEndpoint(
  resolved: ResolvedApiOperation,
  pathInputs: ApiInputMap,
  queryInputs: ApiInputMap,
): { endpoint: string; query: ApiInputMap } {
  validateInputs(resolved, 'path', pathInputs);
  validateInputs(resolved, 'query', queryInputs);
  let endpoint = resolved.path;
  for (const parameter of declaredParameters(resolved, 'path')) {
    const name = String(parameter.name);
    endpoint = endpoint.replace(`{${name}}`, encodeURIComponent(pathInputs[name]!));
  }
  return { endpoint, query: queryInputs };
}

function requestSchema(resolved: ResolvedApiOperation): OpenApiSchema | null {
  const body = resolved.operation.requestBody;
  if (!body) return null;
  const content = body.content as Record<string, { schema?: OpenApiSchema }> | undefined;
  return content?.['application/json']?.schema ?? null;
}

/** Returns the single declared request media type for an operation, if present. */
export function getApiRequestContentType(resolved: ResolvedApiOperation): string | null {
  const body = resolved.operation.requestBody;
  if (!body) return null;
  const content = body.content as Record<string, unknown> | undefined;
  return Object.keys(content ?? {})[0] ?? null;
}

/** Validates scalar and file multipart keys against a declared request schema. */
export function validateApiMultipartInputs(
  resolved: ResolvedApiOperation,
  fields: ApiInputMap,
  files: ApiInputMap,
): void {
  const body = resolved.operation.requestBody;
  const content = body?.content as Record<string, { schema?: OpenApiSchema }> | undefined;
  const schema = content?.['multipart/form-data']?.schema;
  if (!schema) throw new Error(`${resolved.operation.operationId} declares no multipart/form-data body`);
  const properties = (schema.properties ?? {}) as Record<string, OpenApiSchema>;
  const supplied = new Set([...Object.keys(fields), ...Object.keys(files)]);
  for (const name of supplied) {
    if (!Object.hasOwn(properties, name)) throw new Error(`Undeclared multipart field: ${name}`);
    const isFile = properties[name]?.contentMediaType === 'application/octet-stream';
    if (isFile !== Object.hasOwn(files, name)) {
      throw new Error(`Multipart field ${name} must use ${isFile ? '--file' : '--form'}`);
    }
  }
  for (const name of (schema.required ?? []) as string[]) {
    if (!supplied.has(name)) throw new Error(`Missing required multipart field: ${name}`);
  }
  for (const [name, value] of Object.entries(fields)) {
    const property = properties[name];
    const expected = property?.type;
    const allowed = Array.isArray(property?.enum) ? property.enum.map(String) : null;
    if (allowed && !allowed.includes(value)) {
      throw new Error(`Invalid multipart field ${name}; use: ${allowed.join(', ')}`);
    }
    if (expected === 'integer' && !/^-?\d+$/u.test(value)) {
      throw new Error(`Multipart field ${name} must be an integer`);
    }
    if (expected === 'number' && !Number.isFinite(Number(value))) {
      throw new Error(`Multipart field ${name} must be a number`);
    }
    if (expected === 'boolean' && value !== 'true' && value !== 'false') {
      throw new Error(`Multipart field ${name} must be true or false`);
    }
  }
}

/** Parses and validates an optional JSON request body against declared fields. */
export function parseApiBody(
  resolved: ResolvedApiOperation,
  value: string | undefined,
): unknown {
  const schema = requestSchema(resolved);
  if (!schema) {
    if (value !== undefined) throw new Error(`${resolved.operation.operationId} declares no JSON body`);
    return undefined;
  }
  if (value === undefined) throw new Error(`Missing JSON body for ${resolved.operation.operationId}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch (error) {
    throw new Error('Request body must be valid JSON', { cause: error });
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Request body must be a JSON object');
  }
  const body = parsed as Record<string, unknown>;
  const properties = (schema.properties ?? {}) as Record<string, OpenApiSchema>;
  for (const name of (schema.required ?? []) as string[]) {
    if (!Object.hasOwn(body, name)) throw new Error(`Missing required body field: ${name}`);
  }
  if (schema.additionalProperties === false) {
    const undeclared = Object.keys(body).find((name) => !Object.hasOwn(properties, name));
    if (undeclared) throw new Error(`Undeclared body field: ${undeclared}`);
  }
  for (const [name, fieldSchema] of Object.entries(properties)) {
    if (!Object.hasOwn(body, name)) continue;
    const fieldValue = body[name];
    const allowed = Array.isArray(fieldSchema.enum) ? fieldSchema.enum : null;
    if (allowed && !allowed.some((candidate) => Object.is(candidate, fieldValue))) {
      throw new Error(`Invalid body field ${name}; use a declared enum value`);
    }
    const expected = fieldSchema.type;
    const typeMatches = expected === undefined
      || (expected === 'string' && typeof fieldValue === 'string')
      || (expected === 'number' && typeof fieldValue === 'number' && Number.isFinite(fieldValue))
      || (expected === 'integer' && Number.isInteger(fieldValue))
      || (expected === 'boolean' && typeof fieldValue === 'boolean')
      || (expected === 'array' && Array.isArray(fieldValue))
      || (expected === 'object' && !!fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue));
    if (!typeMatches) throw new Error(`Body field ${name} must have type ${String(expected)}`);
    if (typeof fieldValue === 'string'
      && typeof fieldSchema.maxLength === 'number'
      && fieldValue.length > fieldSchema.maxLength) {
      throw new Error(`Body field ${name} exceeds maximum length ${fieldSchema.maxLength}`);
    }
    if (typeof fieldValue === 'string'
      && fieldSchema.format === 'date'
      && !/^\d{4}-\d{2}-\d{2}$/u.test(fieldValue)) {
      throw new Error(`Body field ${name} must use YYYY-MM-DD`);
    }
  }
  if (schema.minProperties === 1 && Object.keys(body).length === 0) {
    throw new Error('Request body must contain at least one field');
  }
  return parsed;
}

/** Builds a stable, network-free operation inspection envelope. */
export function inspectApiOperation(resolved: ResolvedApiOperation): Record<string, unknown> {
  return {
    operationId: resolved.operation.operationId,
    edition: resolved.edition,
    method: resolved.method,
    path: resolved.path,
    summary: resolved.operation.summary,
    resource: resolved.operation['x-monica-resource'],
    requiredAbility: resolved.operation['x-monica-required-ability'],
    parameters: resolved.operation.parameters ?? [],
    requestBody: resolved.operation.requestBody ?? null,
    responses: resolved.operation.responses,
    cli: resolved.operation['x-monica-cli'],
    sourceCommit: resolved.operation['x-monica-source-commit'],
  };
}
