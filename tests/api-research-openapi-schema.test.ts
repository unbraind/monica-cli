import { describe, expect, it } from 'vitest';
import {
  buildOpenApiParameters,
  buildRequestSchema,
  buildResponseSchema,
  extractPathParameters,
  normalizeOpenApiPath,
  schemaForType,
} from '../src/commands/api-research-openapi-schema';

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
    expect(buildResponseSchema({ deleted: 'boolean', id: 'integer' })).toEqual({
      type: 'object',
      properties: {
        deleted: { type: 'boolean' },
        id: { type: 'integer' },
      },
    });
    expect(buildResponseSchema({ nested: {} })).toMatchObject({
      properties: { nested: { type: 'string' } },
    });
    expect(buildResponseSchema('PaginatedResponse<Contact>')).toEqual({
      $ref: '#/components/schemas/PaginatedResponse',
      'x-monica-type': 'PaginatedResponse<Contact>',
    });
    expect(buildResponseSchema('Contact[]')).toMatchObject({
      type: 'array',
      items: { type: 'object', 'x-monica-type': 'Contact' },
    });
    expect(buildResponseSchema('string[]')).toMatchObject({
      type: 'array',
      items: { type: 'string' },
    });
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
    expect(() => buildOpenApiParameters({ parameters: [{}] }, '/vaults/{vault}', true))
      .toThrow('query parameter has no name');
    expect(buildOpenApiParameters({}, '/vaults/{vault}', true)[0])
      .toMatchObject({ schema: { type: 'string' } });
  });
});
