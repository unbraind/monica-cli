import { describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  statSync: vi.fn(() => { throw new Error('denied'); }),
}));

import { getCapabilityCacheStats } from '../src/utils/capability-cache';

describe('capability cache metadata errors', () => {
  it('returns null when cache metadata cannot be read', () => {
    expect(getCapabilityCacheStats()).toBeNull();
  });
});
