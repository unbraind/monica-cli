import { describe, expect, it } from 'vitest';
import type {
  ContractReference,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiVersion,
} from '../src/commands/api-research-contract-types';
import {
  buildContractDiff,
  changedContractOperations,
  comparableOperations,
  validateOpenApiDocument,
} from '../src/commands/api-research-contracts';
import {
  buildOpenApiDocument,
  parseApiEdition,
  parseOpenApiVersion,
} from '../src/commands/api-research-openapi';
import {
  buildOpenApiParameters,
  buildRequestSchema,
  buildResponseSchema,
  extractPathParameters,
  normalizeOpenApiPath,
  schemaForType,
} from '../src/commands/api-research-openapi-schema';
import { findSchema } from '../src/commands/schema-registry';
import { validateValueAgainstSchema } from '../src/commands/schema-validator';

function operationAt(document: OpenApiDocument, path: string, method: string): OpenApiOperation {
  return document.paths[path]![method]!;
}

describe('OpenAPI schema conversion', () => {
  it('normalizes paths and primitive schemas', () => {
    expect(normalizeOpenApiPath('contacts/:id/photos/:photoId')).toBe(
      '/contacts/{id}/photos/{photoId}',
    );
    expect(normalizeOpenApiPath('/vaults/{vault}')).toBe('/vaults/{vault}');
    expect(extractPathParameters('/contacts/{id}/photos/{photoId}')).toEqual(['id', 'photoId']);
    expect(schemaForType('int')).toEqual({ type: 'integer' });
    expect(schemaForType('integer')).toEqual({ type: 'integer' });
    expect(schemaForType('float')).toEqual({ type: 'number' });
    expect(schemaForType('decimal')).toEqual({ type: 'number' });
    expect(schemaForType('boolean')).toEqual({ type: 'boolean' });
    expect(schemaForType('array')).toEqual({ type: 'array', items: {} });
    expect(schemaForType('object')).toEqual({ type: 'object' });
    expect(schemaForType('file')).toEqual({
      type: 'string',
      contentMediaType: 'application/octet-stream',
    });
    expect(schemaForType(undefined)).toEqual({ type: 'string' });
  });

  it('builds complete, shorthand, patch, and undocumented request schemas', () => {
    const post = {
      method: 'POST',
      input: {
        name: {
          type: 'string',
          required: true,
          description: 'Name',
          enum: ['one'],
          format: 'slug',
          maxLength: 10,
        },
      },
    };
    const resource = { endpoints: [post] };
    expect(buildRequestSchema(post, resource)).toEqual({
      complete: true,
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name',
            enum: ['one'],
            format: 'slug',
            maxLength: 10,
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
    });
    expect(buildRequestSchema({ method: 'PUT', input: 'same as POST' }, resource).complete)
      .toBe(true);
    expect(buildRequestSchema({
      method: 'PATCH',
      input: { name: { type: 'string', required: false } },
    }, resource).schema).toMatchObject({ minProperties: 1 });
    expect(buildRequestSchema({ method: 'POST', input: 'unknown shorthand' }, resource))
      .toMatchObject({ complete: false });
    expect(buildRequestSchema({ method: 'POST' }, resource)).toMatchObject({ complete: false });
  });

  it('builds response and parameter variants', () => {
    expect(buildResponseSchema({ deleted: 'boolean', id: 'integer' })).toMatchObject({
      type: 'object',
      required: ['deleted', 'id'],
    });
    expect(buildResponseSchema({ nested: {} })).toMatchObject({
      properties: { nested: { type: 'string' } },
    });
    expect(buildResponseSchema('PaginatedResponse<Contact>')).toEqual({
      $ref: '#/components/schemas/PaginatedResponse',
    });
    expect(buildResponseSchema('Contact[]')).toMatchObject({ type: 'array' });
    expect(buildResponseSchema('Array of contacts')).toMatchObject({ type: 'array' });
    expect(buildResponseSchema('Object with country codes')).toMatchObject({
      type: 'object',
      additionalProperties: true,
    });
    expect(buildResponseSchema('Contact')).toMatchObject({ type: 'object' });
    expect(buildResponseSchema(undefined)).toEqual({ type: 'object' });
    expect(buildOpenApiParameters({
      parameters: [{
        name: 'sort',
        type: 'string',
        required: true,
        description: 'Sort',
        enum: ['name'],
      }],
    }, '/contacts/{id}', false)).toEqual([
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      {
        name: 'sort',
        in: 'query',
        required: true,
        description: 'Sort',
        schema: { type: 'string', enum: ['name'] },
      },
    ]);
    expect(buildOpenApiParameters({ parameters: [{}] }, '/vaults/{vault}', true)[0])
      .toMatchObject({ schema: { type: 'string' } });
  });
});

describe('OpenAPI document generation and validation', () => {
  it('builds complete stable and next documents in both supported OAS versions', () => {
    const stable = buildOpenApiDocument('stable');
    const next = buildOpenApiDocument('next', '3.1.2');
    expect(stable.openapi).toBe('3.2.0');
    expect(stable['x-monica-contract']).toEqual({
      resources: 35,
      operations: 172,
      generatedBy: 'monica-cli api-research openapi',
    });
    expect(next.openapi).toBe('3.1.2');
    expect(next.info.license.identifier).toBe('AGPL-3.0-only');
    expect(next['x-monica-contract'].operations).toBe(9);
    expect(operationAt(stable, '/photos', 'post').requestBody).toHaveProperty(
      'content.multipart/form-data',
    );
    expect(operationAt(stable, '/gifts/{id}/photo/{photoId}', 'put').requestBody)
      .toBeUndefined();
    expect(operationAt(next, '/vaults/{vault}', 'patch').requestBody)
      .toHaveProperty('content.application/json.schema.minProperties', 1);
    expect(operationAt(next, '/vaults', 'post').responses).toHaveProperty('201');
    expect(operationAt(next, '/vaults', 'post').responses).toHaveProperty('401');
    expect(validateOpenApiDocument(stable)).toMatchObject({
      valid: true,
      operations: 172,
      warnings: [],
    });
    expect(validateOpenApiDocument(next)).toMatchObject({
      valid: true,
      operations: 9,
      warnings: [],
    });
  });

  it('rejects invalid options and incomplete or duplicate source documents', () => {
    expect(parseApiEdition('stable')).toBe('stable');
    expect(parseApiEdition('next')).toBe('next');
    expect(() => parseApiEdition('all')).toThrow('Invalid API edition');
    expect(parseOpenApiVersion('3.2.0')).toBe('3.2.0');
    expect(() => parseOpenApiVersion('3.0.0')).toThrow('Invalid OAS version');
    const incomplete: ContractReference = {
      resources: { contacts: { endpoints: [{ method: 'GET', path: '/contacts' }] } },
    };
    expect(() => buildOpenApiDocument('stable', '3.2.0', incomplete)).toThrow(
      'incomplete source provenance',
    );
    const source = {
      repository: 'monicahq/monica',
      branch: '4.x',
      commit: 'abc',
      routeFile: 'routes/api.php',
    };
    const sparse = buildOpenApiDocument('stable', '3.2.0', {
      source,
      resources: { contacts: { endpoints: [{}] } },
    });
    expect(sparse).toMatchObject({
      info: { version: 'unknown' },
      servers: [{ url: '/api' }],
      'x-monica-contract': { operations: 1 },
    });
    expect(operationAt(sparse, '/', '').operationId).toBe('stable__root');
    expect(buildOpenApiDocument('stable', '3.2.0', { source })['x-monica-contract'].operations)
      .toBe(0);
    expect(buildOpenApiDocument('stable', '3.2.0', {
      source,
      resources: { contacts: {} },
    })['x-monica-contract'].operations).toBe(0);
    expect(() => buildOpenApiDocument('stable', '3.2.0', {
      source,
      resources: { unknown: { endpoints: [{ method: 'GET', path: '/unknown' }] } },
    })).toThrow('No CLI command mapping');
    expect(() => buildOpenApiDocument('stable', '3.2.0', {
      source,
      resources: {
        contacts: {
          endpoints: [
            { method: 'GET', path: '/contacts' },
            { method: 'GET', path: '/contacts' },
          ],
        },
      },
    })).toThrow('Duplicate Monica operation');
  });

  it('reports every structural invariant failure and incomplete body warning', () => {
    const document = structuredClone(buildOpenApiDocument('next'));
    const first = operationAt(document, '/user', 'get');
    document.openapi = 'invalid' as OpenApiVersion;
    document['x-monica-source'].commit = '';
    delete document.components.securitySchemes.bearerAuth;
    document.info.license.identifier = '';
    document['x-monica-contract'].operations = 99;
    document.paths['/broken/{missing}'] = {
      trace: {
        ...first,
        operationId: first.operationId,
        parameters: [{ name: 'unused', in: 'path', required: true }],
        requestBody: { 'x-monica-contract-complete': false },
        responses: {},
        'x-monica-cli': { ...first['x-monica-cli'], helpCommand: 'invalid' },
      },
    };
    const result = validateOpenApiDocument(document);
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('Unsupported OpenAPI version');
    expect(result.errors.join('\n')).toContain('duplicate operationId');
    expect(result.errors.join('\n')).toContain('path parameter {missing} is not declared');
    expect(result.errors.join('\n')).toContain('declares unused path parameter unused');
    expect(result.errors.join('\n')).toContain('executable CLI help mapping is missing');
    expect(result.errors.join('\n')).toContain('API source license is missing');
    expect(result.errors.join('\n')).toContain('authenticated operation has no 401 response');
    expect(result.warnings).toEqual([
      'TRACE /broken/{missing}: request fields are not documented by the authoritative reference',
    ]);
  });

  it('produces deterministic comparable operations and compatibility diffs', () => {
    const stable = comparableOperations(buildOpenApiDocument('stable'));
    expect(stable).toHaveLength(172);
    expect(stable[0]!.key.localeCompare(stable[1]!.key)).toBeLessThanOrEqual(0);
    expect(buildContractDiff('stable', 'stable')).toMatchObject({
      summary: { added: 0, removed: 0, changed: 0, unchanged: 172, breaking: 0 },
      breaking: false,
    });
    expect(buildContractDiff('stable', 'next')).toMatchObject({
      summary: { added: 9, removed: 172, changed: 0, unchanged: 0, breaking: 172 },
      breaking: true,
    });
    const previous = buildOpenApiDocument('next');
    const current = structuredClone(previous);
    operationAt(current, '/user', 'get').summary = 'Changed summary';
    operationAt(current, '/users', 'get').summary = 'Changed users';
    expect(changedContractOperations(previous, current)).toEqual([
      {
        key: 'GET /user',
        from: expect.objectContaining({ summary: 'Get the authenticated user' }),
        to: expect.objectContaining({ summary: 'Changed summary' }),
      },
      {
        key: 'GET /users',
        from: expect.objectContaining({ summary: 'List account users' }),
        to: expect.objectContaining({ summary: 'Changed users' }),
      },
    ]);
  });

  it('registers schemas that accept all new payload families', () => {
    const openapi = buildOpenApiDocument('next');
    const diff = buildContractDiff('stable', 'next');
    const validation = {
      generatedAt: '',
      validation: validateOpenApiDocument(openapi),
      sourceStatus: null,
      gate: { failed: false, failOnWarnings: false, failOnUnavailable: false },
    };
    expect(validateValueAgainstSchema(
      openapi,
      findSchema('api-research-openapi')!.schema,
    )).toEqual([]);
    expect(validateValueAgainstSchema(
      diff,
      findSchema('api-research-diff')!.schema,
    )).toEqual([]);
    expect(validateValueAgainstSchema(
      validation,
      findSchema('api-research-contract-validation')!.schema,
    )).toEqual([]);
  });
});
