import { describe, it, expect } from 'vitest';
import { generateSampleFromSchema } from '../src/commands/schema-example';

describe('schema sample generator', () => {
  it('prefers enum first value over primitive defaults', () => {
    expect(generateSampleFromSchema({ type: 'string', enum: ['cache', 'live'] })).toBe('cache');
  });

  it('generates nested object and array sample values', () => {
    const sample = generateSampleFromSchema({
      type: 'object',
      required: ['name', 'items'],
      properties: {
        name: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'enabled'],
            properties: {
              id: { type: 'number' },
              enabled: { type: 'boolean' },
            },
          },
        },
      },
    });

    expect(sample).toEqual({
      name: 'string',
      items: [{ id: 0, enabled: false }],
    });
  });
});
