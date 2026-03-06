import { afterEach, describe, expect, it } from 'vitest';
import { InvalidArgumentError } from 'commander';
import {
  applyRequestTimeoutOverride,
  parseFieldsOption,
  parseOutputFormat,
  parsePositiveInteger,
  parseRequestTimeoutMs,
} from '../src/commands/global-options';

describe('global options helpers', () => {
  const originalTimeout = process.env.MONICA_REQUEST_TIMEOUT_MS;

  afterEach(() => {
    if (originalTimeout === undefined) {
      delete process.env.MONICA_REQUEST_TIMEOUT_MS;
      return;
    }
    process.env.MONICA_REQUEST_TIMEOUT_MS = originalTimeout;
  });

  it('parses positive timeout values', () => {
    expect(parseRequestTimeoutMs('15000')).toBe(15000);
  });

  it('parses output format aliases', () => {
    expect(parseOutputFormat('markdown')).toBe('md');
    expect(parseOutputFormat('yml')).toBe('yaml');
  });

  it('throws InvalidArgumentError for invalid output format values', () => {
    expect(() => parseOutputFormat('invalid')).toThrow(InvalidArgumentError);
  });

  it('parses --fields option values', () => {
    expect(parseFieldsOption('id,name')).toEqual(['id', 'name']);
    expect(parseFieldsOption(' id, name ,id ')).toEqual(['id', 'name']);
  });

  it('throws InvalidArgumentError for empty --fields option values', () => {
    expect(() => parseFieldsOption(' ,  , ')).toThrow(InvalidArgumentError);
  });

  it('parses positive integer values', () => {
    expect(parsePositiveInteger('1')).toBe(1);
    expect(parsePositiveInteger('200')).toBe(200);
  });

  it('throws InvalidArgumentError for invalid positive integer values', () => {
    expect(() => parsePositiveInteger('0')).toThrow(InvalidArgumentError);
    expect(() => parsePositiveInteger('-1')).toThrow(InvalidArgumentError);
    expect(() => parsePositiveInteger('abc')).toThrow(InvalidArgumentError);
    expect(() => parsePositiveInteger('3x')).toThrow(InvalidArgumentError);
  });

  it('throws InvalidArgumentError for invalid timeout values', () => {
    expect(() => parseRequestTimeoutMs('0')).toThrow(InvalidArgumentError);
    expect(() => parseRequestTimeoutMs('-5')).toThrow(InvalidArgumentError);
    expect(() => parseRequestTimeoutMs('abc')).toThrow(InvalidArgumentError);
  });

  it('applies timeout override to MONICA_REQUEST_TIMEOUT_MS', () => {
    applyRequestTimeoutOverride(45000);
    expect(process.env.MONICA_REQUEST_TIMEOUT_MS).toBe('45000');
  });

  it('does not modify env when timeout override is undefined', () => {
    process.env.MONICA_REQUEST_TIMEOUT_MS = '12000';
    applyRequestTimeoutOverride(undefined);
    expect(process.env.MONICA_REQUEST_TIMEOUT_MS).toBe('12000');
  });
});
