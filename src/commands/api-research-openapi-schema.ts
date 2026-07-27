import type {
  ContractEndpoint,
  ContractInputField,
  ContractResource,
  OpenApiSchema,
} from './api-research-contract-types';

/** Converts Laravel-style route placeholders to OpenAPI path templates. */
export function normalizeOpenApiPath(value: string): string {
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return normalized.replace(/:([A-Za-z0-9_]+)/gu, '{$1}');
}

/** Returns every template parameter declared by an OpenAPI path. */
export function extractPathParameters(value: string): string[] {
  return Array.from(value.matchAll(/\{([^}]+)\}/gu), (match) => match[1]!);
}

/** Converts a documented primitive name into a JSON Schema type. */
export function schemaForType(value: string | undefined): OpenApiSchema {
  const type = value?.toLowerCase();
  if (type === 'int' || type === 'integer') return { type: 'integer' };
  if (type === 'number' || type === 'float' || type === 'decimal') return { type: 'number' };
  if (type === 'bool' || type === 'boolean') return { type: 'boolean' };
  if (type === 'array') return { type: 'array', items: {} };
  if (type === 'object') return { type: 'object' };
  if (type === 'file') {
    return { type: 'string', contentMediaType: 'application/octet-stream' };
  }
  return { type: 'string' };
}

function schemaForInputField(field: ContractInputField): OpenApiSchema {
  const schema = schemaForType(field.type);
  if (field.description) schema.description = field.description;
  if (field.enum) schema.enum = field.enum;
  if (field.maxLength !== undefined) schema.maxLength = field.maxLength;
  if (field.format) {
    schema.format = field.format === 'YYYY-MM-DD' ? 'date' : field.format;
  }
  return schema;
}

/** Builds a request schema while resolving shorthand references to a resource POST body. */
export function buildRequestSchema(
  endpoint: ContractEndpoint,
  resource: ContractResource,
): { schema: OpenApiSchema; complete: boolean } {
  let input = endpoint.input;
  if (typeof input === 'string' && input.toLowerCase().startsWith('same as post')) {
    input = resource.endpoints?.find((candidate) => candidate.method?.toUpperCase() === 'POST')
      ?.input;
  }
  if (!input || typeof input === 'string') {
    return {
      schema: {
        type: 'object',
        additionalProperties: true,
        description: 'The authoritative route reference does not declare individual request fields.',
      },
      complete: false,
    };
  }

  const properties: Record<string, OpenApiSchema> = {};
  const required: string[] = [];
  Object.entries(input).forEach(([name, field]) => {
    properties[name] = schemaForInputField(field);
    if (field.required === true) required.push(name);
  });
  return {
    schema: {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required: required.sort() } : {}),
      ...(endpoint.method?.toUpperCase() === 'PATCH' ? { minProperties: 1 } : {}),
      additionalProperties: false,
    },
    complete: true,
  };
}

function schemaForResponseMap(value: Record<string, unknown>): OpenApiSchema {
  const properties = Object.fromEntries(
    Object.entries(value).map(([name, type]) => [
      name,
      schemaForType(typeof type === 'string' ? type : undefined),
    ]),
  );
  return { type: 'object', properties };
}

/** Converts Monica's concise response notation into an OpenAPI response schema. */
export function buildResponseSchema(response: unknown): OpenApiSchema {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    return schemaForResponseMap(response as Record<string, unknown>);
  }
  if (typeof response !== 'string') return { type: 'object' };
  if (response.startsWith('PaginatedResponse<')) {
    return {
      $ref: '#/components/schemas/PaginatedResponse',
      'x-monica-type': response,
    };
  }
  if (response.endsWith('[]') || response.toLowerCase().startsWith('array of ')) {
    const itemType = response.endsWith('[]') ? response.slice(0, -2) : response.slice(9);
    const primitiveTypes = new Set([
      'bool', 'boolean', 'decimal', 'float', 'int', 'integer', 'number', 'string',
    ]);
    return {
      type: 'array',
      items: primitiveTypes.has(itemType.toLowerCase())
        ? schemaForType(itemType)
        : { type: 'object', 'x-monica-type': itemType },
      'x-monica-type': response,
    };
  }
  if (response.toLowerCase().startsWith('object with ')) {
    return { type: 'object', additionalProperties: true, 'x-monica-type': response };
  }
  return {
    type: 'object',
    description: `Monica ${response} resource envelope.`,
    'x-monica-type': response,
  };
}

/** Builds operation parameters from path templates and documented query inputs. */
export function buildOpenApiParameters(
  endpoint: ContractEndpoint,
  path: string,
  stringPathIds: boolean,
): Array<Record<string, unknown>> {
  const pathParameters = extractPathParameters(path).map((name) => ({
    name,
    in: 'path',
    required: true,
    schema: stringPathIds ? { type: 'string' } : { type: 'integer' },
  }));
  const queryParameters = (endpoint.parameters ?? []).map((parameter) => {
    const name = parameter.name?.trim();
    if (!name) throw new Error('Contract query parameter has no name');
    return {
      name,
      in: 'query',
      required: parameter.required === true,
      ...(parameter.description ? { description: parameter.description } : {}),
      schema: {
        ...schemaForType(parameter.type),
        ...(parameter.enum ? { enum: parameter.enum } : {}),
      },
    };
  });
  return [...pathParameters, ...queryParameters];
}

/** Returns reusable schemas shared by generated Monica OpenAPI documents. */
export function buildComponentSchemas(): Record<string, OpenApiSchema> {
  return {
    PaginationLinks: {
      type: 'object',
      properties: {
        first: { type: ['string', 'null'] },
        last: { type: ['string', 'null'] },
        prev: { type: ['string', 'null'] },
        next: { type: ['string', 'null'] },
      },
    },
    PaginationMeta: {
      type: 'object',
      additionalProperties: true,
      properties: {
        current_page: { type: 'integer' },
        per_page: { type: 'integer' },
        total: { type: 'integer' },
      },
    },
    PaginatedResponse: {
      type: 'object',
      required: ['data', 'links', 'meta'],
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        links: { $ref: '#/components/schemas/PaginationLinks' },
        meta: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    Error: {
      type: 'object',
      additionalProperties: true,
      properties: {
        message: { type: 'string' },
        error: { type: ['object', 'string', 'null'] },
      },
    },
  };
}
