import { describe, it, expect } from 'vitest';
import {
  buildDateReleaseVersion,
  formatVersionDate,
  isValidVersionDate,
  parseReleaseCount,
  toGitDate,
} from '../src/utils/versioning';

describe('versioning utils', () => {
  it('formats dates as YYYY.M.D', () => {
    expect(formatVersionDate(new Date('2026-03-03T08:00:00.000Z'))).toBe('2026.3.3');
  });

  it('validates version date format', () => {
    expect(isValidVersionDate('2026.3.3')).toBe(true);
    expect(isValidVersionDate('2026-03-03')).toBe(false);
    expect(isValidVersionDate('2026.03.03')).toBe(false);
  });

  it('builds date+release version and validates inputs', () => {
    expect(buildDateReleaseVersion('2026.3.3', 1)).toBe('2026.3.3');
    expect(buildDateReleaseVersion('2026.3.3', 2)).toBe('2026.3.3-2');
    expect(buildDateReleaseVersion('2026.3.3', 22)).toBe('2026.3.3-22');
    expect(() => buildDateReleaseVersion('2026-03-03', 1)).toThrow();
    expect(() => buildDateReleaseVersion('2026.3.3', 0)).toThrow();
  });

  it('parses release counts', () => {
    expect(parseReleaseCount('21\n')).toBe(21);
    expect(() => parseReleaseCount('not-a-number')).toThrow();
  });

  it('maps version date to git date', () => {
    expect(toGitDate('2026.3.3')).toBe('2026-3-3');
  });
});
