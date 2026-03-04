import { afterEach, describe, expect, it } from 'vitest';
import { InvalidArgumentError } from 'commander';
import { applyRequestTimeoutOverride, parseRequestTimeoutMs } from '../src/commands/global-options';

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
