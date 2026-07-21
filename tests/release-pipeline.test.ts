import { describe, expect, it } from 'vitest';

import {
  isReleaseRelevantPath,
  latestReleaseTag,
  nextVersionForDate,
  parseArgs,
  utcVersionDate,
} from '../scripts/release/run-release-pipeline.mjs';

describe('auto-release pipeline helpers', () => {
  it('formats UTC calendar versions without zero padding', () => {
    expect(utcVersionDate(new Date('2026-07-03T23:59:59Z'))).toBe('2026.7.3');
  });

  it('allocates the first and subsequent release versions for a UTC day', () => {
    expect(nextVersionForDate('2026.7.21', ['v2026.7.20'])).toBe('2026.7.21');
    expect(nextVersionForDate('2026.7.21', ['v2026.7.21', 'v2026.7.21-2'])).toBe('2026.7.21-3');
  });

  it('selects the latest calendar release even when a tag is not on the current ancestry path', () => {
    expect(latestReleaseTag(['v2026.3.6', 'v2026.3.6-2', 'v2026.3.4'])).toBe('v2026.3.6-2');
  });

  it('treats tracker-only paths as release-irrelevant', () => {
    expect(isReleaseRelevantPath('.agents/pm/issues/monica-a.toon')).toBe(false);
    expect(isReleaseRelevantPath('src/program.ts')).toBe(true);
  });

  it('parses non-mutating dry-run options', () => {
    expect(parseArgs(['--dry-run', '--json', '--author', 'release-bot'])).toMatchObject({
      dryRun: true,
      push: false,
      json: true,
      author: 'release-bot',
    });
  });
});
