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
import { findSchema } from '../src/commands/schema-registry';
import { validateValueAgainstSchema } from '../src/commands/schema-validator';

function operationAt(document: OpenApiDocument, path: string, method: string): OpenApiOperation {
  return document.paths[path]![method]!;
}

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
    expect(() => buildOpenApiDocument('stable', '3.2.0', {
      source,
      resources: { contacts: { endpoints: [{}] } },
    })).toThrow('has no method or path');
    const root = buildOpenApiDocument('stable', '3.2.0', {
      source,
      resources: { contacts: { endpoints: [{ method: 'GET', path: '/' }] } },
    });
    expect(root).toMatchObject({
      info: { version: 'unknown' },
      servers: [{ url: '/api' }],
      'x-monica-contract': { operations: 1 },
    });
    expect(operationAt(root, '/', 'get').operationId).toBe('stable_get_root');
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
      resources: { contacts: { endpoints: [{ method: 'TRACE', path: '/contacts' }] } },
    })).toThrow('invalid method');
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
    expect(stable.every((entry, index) =>
      index === 0 || stable[index - 1]!.key.localeCompare(entry.key, 'en') <= 0)).toBe(true);
    expect(buildContractDiff('stable', 'stable')).toMatchObject({
      summary: { added: 0, removed: 0, changed: 0, unchanged: 172, breakingChanges: 0 },
      breaking: false,
    });
    expect(buildContractDiff('stable', 'next')).toMatchObject({
      summary: { added: 9, removed: 172, changed: 0, unchanged: 0, breakingChanges: 172 },
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
