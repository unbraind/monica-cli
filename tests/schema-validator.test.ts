import { describe, it, expect } from 'vitest';
import { validateValueAgainstSchema } from '../src/commands/schema-validator';

describe('schema validator', () => {
  it('validates required keys and nested types', () => {
    const errors = validateValueAgainstSchema(
      { ok: true, data: [{ id: 1, name: 'A' }] },
      {
        type: 'object',
        required: ['ok', 'data'],
        properties: {
          ok: { type: 'boolean' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
            },
          },
        },
      }
    );

    expect(errors).toHaveLength(0);
  });

  it('returns detailed path errors for invalid payloads', () => {
    const errors = validateValueAgainstSchema(
      { ok: 'yes', data: [{ id: '1' }] },
      {
        type: 'object',
        required: ['ok', 'data'],
        properties: {
          ok: { type: 'boolean' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
            },
          },
        },
      }
    );

    expect(errors.some((error) => error.path === '$.ok')).toBe(true);
    expect(errors.some((error) => error.path === '$.data[0].id')).toBe(true);
    expect(errors.some((error) => error.message.includes('Missing required key: name'))).toBe(true);
  });
});
