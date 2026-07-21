import { afterEach, describe, expect, it, vi } from 'vitest';

const reference = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('fs', () => ({ readFileSync: reference.read }));

import { loadSelectedReference, parseSourceOption, summarizeResource } from '../src/commands/api-research-shared';

describe('API reference selection edge cases', () => {
  afterEach(() => vi.clearAllMocks());

  it('selects named references and falls back to API docs when Monica docs cannot load', () => {
    expect(parseSourceOption('api').format).toBe('api-reference');
    expect(parseSourceOption('monica').format).toBe('monica-api-reference');
    reference.read.mockImplementation(() => { throw new Error('missing'); });
    expect(parseSourceOption('auto').format).toBe('api-reference');
    reference.read.mockReturnValue(JSON.stringify({ resources: { contacts: {} } }));
    expect(parseSourceOption('auto').format).toBe('monica-api-reference');
  });

  it('recognizes both supported custom reference shapes', () => {
    reference.read.mockReturnValueOnce(JSON.stringify({ endpoints: {} }));
    expect(parseSourceOption('./custom-api.json').format).toBe('api-reference');
    reference.read.mockReturnValueOnce(JSON.stringify({ resources: {} }));
    expect(parseSourceOption('./custom-monica.json').format).toBe('monica-api-reference');
  });

  it('rejects unsupported custom reference shapes', () => {
    reference.read.mockReturnValue(JSON.stringify({ unknown: true }));
    expect(() => parseSourceOption('./invalid.json')).toThrow('Unsupported API reference shape');
  });

  it('converts sparse custom Monica resources into canonical endpoints', () => {
    reference.read.mockReturnValue(JSON.stringify({
      version: '4.x', baseUrl: '/api', resources: {
        sparse: { endpoints: [{}, { method: 'GET', path: '/sparse' }] },
        empty: {},
      },
    }));
    const selected = loadSelectedReference({
      path: '/tmp/custom-monica.json', format: 'monica-api-reference',
    });
    expect(selected.endpoints.sparse.methods).toEqual({
      unknown_1: { method: undefined, path: undefined },
      get_2: { method: 'GET', path: '/sparse' },
    });
    expect(selected.endpoints.empty.methods).toEqual({});
  });

  it('summarizes missing method metadata with stable placeholders', () => {
    expect(summarizeResource('custom', {
      methods: { missing: {}, get: { method: 'GET' } },
    }, true)).toMatchObject({
      description: '', methods: ['GET', 'UNKNOWN'],
      endpoints: [
        { key: 'missing', method: 'UNKNOWN', path: '' },
        { key: 'get', method: 'GET', path: '' },
      ],
    });
  });

  it('converts a Monica reference with no resource map', () => {
    reference.read.mockReturnValue('{}');
    expect(loadSelectedReference({
      path: '/tmp/empty-monica.json', format: 'monica-api-reference',
    }).endpoints).toEqual({});
  });
});
