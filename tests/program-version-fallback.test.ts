import { describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({ readFileSync: vi.fn(() => { throw new Error('missing'); }) }));
vi.mock('../src/utils/settings', () => ({
  GLOBAL_SETTINGS_PATH: '/tmp/settings.json',
  KEY_MAP: {},
  VALID_UNSET_KEYS: [],
  deleteSettingsFile: vi.fn(),
  getSettingsStats: vi.fn(() => null),
  loadSettings: vi.fn(() => null),
  maskApiKey: vi.fn(() => '[hidden]'),
  normalizeSettings: vi.fn((value) => value),
  saveSettings: vi.fn(),
}));

import { createProgram } from '../src/program';

describe('program version fallback', () => {
  it('uses a deterministic version when package metadata cannot load', () => {
    expect(createProgram(['node', 'monica']).version()).toBe('0.0.0');
  });
});
