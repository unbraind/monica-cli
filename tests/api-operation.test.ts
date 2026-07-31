import { describe, expect, it } from 'vitest';
import type { OpenApiDocument, OpenApiOperation } from '../src/commands/api-research-contract-types';
import {
  buildApiEndpoint,
  collectApiInput,
  inspectApiOperation,
  getApiRequestContentType,
  parseApiBody,
  parseApiInputs,
  resolveApiOperation,
  validateApiMultipartInputs,
} from '../src/commands/api-operation';

describe('exact Monica API operations', () => {
  it('collects and parses repeatable key/value inputs', () => {
    expect(collectApiInput('page=2', ['limit=10'])).toEqual(['limit=10', 'page=2']);
    expect(parseApiInputs(['id=42', 'query=a=b'], 'parameter')).toEqual({
      id: '42',
      query: 'a=b',
    });
    expect(() => parseApiInputs(['missing'], 'parameter')).toThrow('key=value');
    expect(() => parseApiInputs(['=empty'], 'parameter')).toThrow('key=value');
    expect(() => parseApiInputs(['id=1', 'id=2'], 'parameter')).toThrow('Duplicate');
  });

  it('resolves and inspects exact operations from each edition', () => {
    const stable = resolveApiOperation('stable_get_contacts_id', 'stable');
    expect(stable).toMatchObject({ method: 'GET', path: '/contacts/{id}' });
    expect(inspectApiOperation(stable)).toMatchObject({
      operationId: 'stable_get_contacts_id',
      edition: 'stable',
      resource: 'contacts',
    });
    expect(resolveApiOperation('next_post_vaults', 'next')).toMatchObject({ method: 'POST' });
    expect(() => resolveApiOperation('missing', 'stable')).toThrow('Unknown stable');
  });

  it('rejects duplicate operation IDs in malformed input contracts', () => {
    const operation = {
      operationId: 'duplicate',
      summary: 'Duplicate',
    } as OpenApiOperation;
    const document = {
      paths: {
        '/one': { get: operation },
        '/two': { get: operation },
      },
    } as unknown as OpenApiDocument;
    expect(() => resolveApiOperation('duplicate', 'stable', document)).toThrow('not unique');
  });

  it('builds encoded endpoints and validates declared parameters', () => {
    const operation = resolveApiOperation('stable_get_contacts_id', 'stable');
    expect(buildApiEndpoint(operation, { id: '42' }, { with: 'contactfields' })).toEqual({
      endpoint: '/contacts/42',
      query: { with: 'contactfields' },
    });
    expect(() => buildApiEndpoint(operation, {}, {})).toThrow('Missing required path');
    expect(() => buildApiEndpoint(operation, { other: '1' }, {})).toThrow('Undeclared path');
    expect(() => buildApiEndpoint(operation, { id: 'abc' }, {})).toThrow('must be an integer');
    expect(() => buildApiEndpoint(operation, { id: '1' }, { other: 'x' })).toThrow('Undeclared query');
  });

  it('validates enum, number, and boolean parameters', () => {
    const operation = resolveApiOperation('stable_get_me', 'stable');
    operation.operation.parameters = [
      { name: 'mode', in: 'query', schema: { type: 'string', enum: ['short', 'full'] } },
      { name: 'ratio', in: 'query', schema: { type: 'number' } },
      { name: 'enabled', in: 'query', schema: { type: 'boolean' } },
    ];
    expect(buildApiEndpoint(operation, {}, {
      mode: 'full', ratio: '1.2', enabled: 'false',
    }).query).toHaveProperty('ratio', '1.2');
    expect(() => buildApiEndpoint(operation, {}, { mode: 'other' })).toThrow('Invalid query');
    expect(() => buildApiEndpoint(operation, {}, { ratio: 'nan' })).toThrow('must be a number');
    expect(() => buildApiEndpoint(operation, {}, { enabled: '1' })).toThrow('true or false');
  });

  it('parses complete JSON request body contracts', () => {
    const create = resolveApiOperation('next_post_vaults', 'next');
    expect(parseApiBody(create, '{"name":"Private"}')).toEqual({ name: 'Private' });
    expect(() => parseApiBody(create, undefined)).toThrow('Missing JSON body');
    expect(() => parseApiBody(create, 'nope')).toThrow('valid JSON');
    expect(() => parseApiBody(create, '[]')).toThrow('JSON object');
    expect(() => parseApiBody(create, '{}')).toThrow('Missing required body field');
    expect(() => parseApiBody(create, '{"name":"x","other":true}')).toThrow('Undeclared body');

    const patch = resolveApiOperation('next_patch_vaults_vault', 'next');
    expect(() => parseApiBody(patch, '{}')).toThrow('at least one field');
    expect(parseApiBody(patch, '{"description":"x"}')).toEqual({ description: 'x' });
  });

  it('rejects bodies on bodyless operations', () => {
    const read = resolveApiOperation('stable_get_me', 'stable');
    expect(parseApiBody(read, undefined)).toBeUndefined();
    expect(() => parseApiBody(read, '{}')).toThrow('declares no JSON body');

    read.operation.requestBody = {};
    expect(parseApiBody(read, undefined)).toBeUndefined();
    read.operation.requestBody = { content: {} };
    expect(parseApiBody(read, undefined)).toBeUndefined();
    read.operation.requestBody = {
      content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
    };
    expect(parseApiBody(read, '{"custom":true}')).toEqual({ custom: true });
  });

  it('validates declared JSON body field constraints', () => {
    const operation = resolveApiOperation('stable_get_me', 'stable');
    operation.operation.requestBody = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              text: { type: 'string', maxLength: 4 },
              count: { type: 'integer' },
              ratio: { type: 'number' },
              enabled: { type: 'boolean' },
              rows: { type: 'array' },
              meta: { type: 'object' },
              mode: { enum: ['safe'] },
              date: { type: 'string', format: 'date' },
            },
          },
        },
      },
    };
    expect(parseApiBody(operation, JSON.stringify({
      text: 'okay', count: 2, ratio: 1.5, enabled: true, rows: [], meta: {},
      mode: 'safe', date: '2026-07-31',
    }))).toMatchObject({ count: 2, enabled: true });
    expect(() => parseApiBody(operation, '{"mode":"unsafe"}')).toThrow('enum value');
    expect(() => parseApiBody(operation, '{"text":1}')).toThrow('type string');
    expect(() => parseApiBody(operation, '{"count":1.2}')).toThrow('type integer');
    expect(() => parseApiBody(operation, '{"ratio":null}')).toThrow('type number');
    expect(() => parseApiBody(operation, '{"enabled":1}')).toThrow('type boolean');
    expect(() => parseApiBody(operation, '{"rows":{}}')).toThrow('type array');
    expect(() => parseApiBody(operation, '{"meta":[]}')).toThrow('type object');
    expect(() => parseApiBody(operation, '{"text":"longer"}')).toThrow('maximum length');
    expect(() => parseApiBody(operation, '{"date":"31-07-2026"}')).toThrow('YYYY-MM-DD');
  });

  it('validates declared multipart scalar and file inputs', () => {
    const operation = resolveApiOperation('stable_post_documents', 'stable');
    expect(getApiRequestContentType(operation)).toBe('multipart/form-data');
    expect(() => validateApiMultipartInputs(operation, { contact_id: '42' }, {}))
      .toThrow('Missing required multipart field');
    expect(() => validateApiMultipartInputs(operation, { contact_id: 'abc' }, { document: 'x' }))
      .toThrow('must be an integer');
    expect(() => validateApiMultipartInputs(operation, { contact_id: '42', document: 'x' }, {}))
      .toThrow('must use --file');
    expect(() => validateApiMultipartInputs(operation, { contact_id: '42' }, { other: 'x' }))
      .toThrow('Undeclared multipart');
    expect(() => validateApiMultipartInputs(operation, {}, {
      contact_id: '42', document: 'x',
    })).toThrow('must use --form');
    expect(validateApiMultipartInputs(operation, { contact_id: '42' }, { document: 'x' }))
      .toBeUndefined();

    operation.operation.requestBody = {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              ratio: { type: 'number' },
              enabled: { type: 'boolean' },
            },
          },
        },
      },
    };
    expect(validateApiMultipartInputs(operation, { ratio: '1.5', enabled: 'true' }, {}))
      .toBeUndefined();
    expect(() => validateApiMultipartInputs(operation, { ratio: 'nan' }, {}))
      .toThrow('must be a number');
    expect(() => validateApiMultipartInputs(operation, { enabled: 'yes' }, {}))
      .toThrow('true or false');

    operation.operation.requestBody = {};
    expect(() => validateApiMultipartInputs(operation, {}, {})).toThrow('declares no multipart');
    expect(getApiRequestContentType(resolveApiOperation('stable_get_me', 'stable'))).toBeNull();
    expect(getApiRequestContentType(operation)).toBeNull();
    operation.operation.requestBody = { content: {} };
    expect(getApiRequestContentType(operation)).toBeNull();
    operation.operation.requestBody = {
      content: { 'multipart/form-data': { schema: { type: 'object' } } },
    };
    expect(validateApiMultipartInputs(operation, {}, {})).toBeUndefined();
  });
});
