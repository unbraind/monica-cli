import { describe, expect, it } from 'vitest';
import { generateSampleFromSchema } from '../src/commands/schema-example';
import { validateValueAgainstSchema } from '../src/commands/schema-validator';

describe('schema sample and validation utilities', () => {
  it('generates deterministic samples for every supported schema shape', () => {
    expect(generateSampleFromSchema({ enum: ['first', 'second'] })).toBe('first');
    expect(generateSampleFromSchema({ type: 'array' })).toEqual([]);
    expect(generateSampleFromSchema({ type: 'array', items: { type: 'number' } })).toEqual([0]);
    expect(generateSampleFromSchema({ type: 'string' })).toBe('string');
    expect(generateSampleFromSchema({ type: 'number' })).toBe(0);
    expect(generateSampleFromSchema({ type: 'boolean' })).toBe(false);
    expect(generateSampleFromSchema({ type: 'null' })).toBeNull();
    expect(generateSampleFromSchema({ properties: { name: { type: 'string' } } }))
      .toEqual({ name: 'string' });
    expect(generateSampleFromSchema({ items: { type: 'boolean' } })).toEqual([false]);
    expect(generateSampleFromSchema({})).toBeNull();
    expect(generateSampleFromSchema({ type: 'object' })).toEqual({});
    expect(generateSampleFromSchema({
      type: 'object', required: ['missing'], properties: {},
    })).toEqual({ missing: null });
  });

  it('validates types, enums, required keys, nested objects, and arrays', () => {
    const schema = {
      type: 'object',
      required: ['status', 'items'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        items: { type: 'array', items: { type: 'number' } },
      },
    };
    expect(validateValueAgainstSchema({ status: 'ok', items: [1, 2] }, schema)).toEqual([]);
    const errors = validateValueAgainstSchema({ status: 'bad', items: [1, 'x'] }, schema);
    expect(errors.some((error) => error.message.includes('not in enum'))).toBe(true);
    expect(errors.some((error) => error.path === '$.items[1]')).toBe(true);
    expect(validateValueAgainstSchema({}, schema)).toHaveLength(2);
  });

  it('covers every primitive type and unknown schema type', () => {
    expect(validateValueAgainstSchema([], { type: 'object' })[0]?.message).toContain('array');
    expect(validateValueAgainstSchema({}, { type: 'array' })).not.toHaveLength(0);
    expect(validateValueAgainstSchema(1, { type: 'string' })).not.toHaveLength(0);
    expect(validateValueAgainstSchema('1', { type: 'number' })).not.toHaveLength(0);
    expect(validateValueAgainstSchema(Number.NaN, { type: 'number' })).not.toHaveLength(0);
    expect(validateValueAgainstSchema(1, { type: 'boolean' })).not.toHaveLength(0);
    expect(validateValueAgainstSchema(false, { type: 'null' })).not.toHaveLength(0);
    expect(validateValueAgainstSchema('anything', { type: 'custom' })).toEqual([]);
  });
});
