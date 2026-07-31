import type { OutputSchemaDescriptor } from './schema-registry';

/** Provides OpenAPI export, compatibility diff, and validation output schemas. */
export const OPENAPI_OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [
  {
    id: 'api-operation-inspect',
    title: 'api inspect',
    description: 'Exact bundled Monica OpenAPI operation inspection envelope',
    schema: {
      type: 'object',
      required: [
        'operationId',
        'edition',
        'method',
        'path',
        'summary',
        'resource',
        'requiredAbility',
        'parameters',
        'requestBody',
        'responses',
        'cli',
        'sourceCommit',
      ],
      properties: {
        operationId: { type: 'string' },
        edition: { type: 'string', enum: ['stable', 'next'] },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        path: { type: 'string' },
        summary: { type: 'string' },
        resource: { type: 'string' },
        requiredAbility: { type: 'string', enum: ['read', 'write'] },
        parameters: { type: 'array', items: { type: 'object' } },
        requestBody: { type: ['object', 'null'] },
        responses: { type: 'object' },
        cli: { type: 'object' },
        sourceCommit: { type: 'string' },
      },
    },
  },
  {
    id: 'api-research-openapi',
    title: 'api-research openapi',
    description: 'Edition-aware Monica OpenAPI 3.2 or 3.1 document',
    schema: {
      type: 'object',
      required: [
        'openapi',
        'jsonSchemaDialect',
        'info',
        'servers',
        'security',
        'tags',
        'paths',
        'components',
        'x-monica-edition',
        'x-monica-source',
        'x-monica-contract',
      ],
      properties: {
        openapi: { type: 'string', enum: ['3.2.0', '3.1.2'] },
        jsonSchemaDialect: { type: 'string' },
        info: {
          type: 'object',
          required: ['title', 'version', 'description', 'license'],
        },
        servers: { type: 'array', items: { type: 'object', required: ['url', 'description'] } },
        security: { type: 'array', items: { type: 'object' } },
        tags: { type: 'array', items: { type: 'object', required: ['name', 'description'] } },
        paths: { type: 'object' },
        components: {
          type: 'object',
          required: ['securitySchemes', 'schemas'],
        },
        'x-monica-edition': { type: 'string', enum: ['stable', 'next'] },
        'x-monica-source': {
          type: 'object',
          required: ['repository', 'branch', 'commit', 'routeFile'],
        },
        'x-monica-contract': {
          type: 'object',
          required: ['resources', 'operations', 'generatedBy'],
        },
      },
    },
  },
  {
    id: 'api-research-diff',
    title: 'api-research diff',
    description: 'Deterministic compatibility diff between Monica API editions',
    schema: {
      type: 'object',
      required: ['generatedAt', 'from', 'to', 'summary', 'added', 'removed', 'changed', 'breaking'],
      properties: {
        generatedAt: { type: 'string' },
        from: {
          type: 'object',
          required: ['edition', 'commit', 'operations'],
        },
        to: {
          type: 'object',
          required: ['edition', 'commit', 'operations'],
        },
        summary: {
          type: 'object',
          required: ['added', 'removed', 'changed', 'unchanged', 'breakingChanges'],
          properties: {
            added: { type: 'number' },
            removed: { type: 'number' },
            changed: { type: 'number' },
            unchanged: { type: 'number' },
            breakingChanges: { type: 'number' },
          },
        },
        added: { type: 'array', items: { type: 'object', required: ['key', 'method', 'path'] } },
        removed: { type: 'array', items: { type: 'object', required: ['key', 'method', 'path'] } },
        changed: { type: 'array', items: { type: 'object', required: ['key', 'from', 'to'] } },
        breaking: { type: 'boolean' },
      },
    },
  },
  {
    id: 'api-research-contract-validation',
    title: 'api-research validate-contract',
    description: 'OpenAPI structural, Monica invariant, provenance, and CI gate result',
    schema: {
      type: 'object',
      required: ['generatedAt', 'validation', 'sourceStatus', 'gate'],
      properties: {
        generatedAt: { type: 'string' },
        validation: {
          type: 'object',
          required: ['edition', 'valid', 'operations', 'paths', 'errors', 'warnings'],
          properties: {
            edition: { type: 'string', enum: ['stable', 'next'] },
            valid: { type: 'boolean' },
            operations: { type: 'number' },
            paths: { type: 'number' },
            errors: { type: 'array', items: { type: 'string' } },
            warnings: { type: 'array', items: { type: 'string' } },
          },
        },
        sourceStatus: { type: ['object', 'null'] },
        gate: {
          type: 'object',
          required: ['failed', 'failOnWarnings', 'failOnUnavailable'],
        },
      },
    },
  },
];
