import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  mkdirSync: vi.fn(), chmodSync: vi.fn(), writeFileSync: vi.fn(),
  existsSync: vi.fn(), readFileSync: vi.fn(), statSync: vi.fn(), unlinkSync: vi.fn(),
}));

import * as fs from 'fs';
import {
  deleteSettingsFile,
  ensureSettingsDir,
  getSettingsStats,
  loadSettings,
  saveSettings,
} from '../src/utils/settings';

describe('settings filesystem behavior', () => {
  const exists = fs.existsSync as unknown as ReturnType<typeof vi.fn>;
  const read = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
  const stat = fs.statSync as unknown as ReturnType<typeof vi.fn>;
  beforeEach(() => vi.clearAllMocks());

  it('creates the private settings directory and saves normalized JSON', () => {
    ensureSettingsDir();
    saveSettings({ readOnly: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('.monica-cli'), {
      recursive: true, mode: 0o700,
    });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('settings.json'), expect.stringContaining('"readOnlyMode": true'),
      { mode: 0o600 },
    );
  });

  it('loads and normalizes valid settings and ignores malformed files', () => {
    exists.mockReturnValue(true);
    read.mockReturnValueOnce('{"readOnly":true}');
    expect(loadSettings()).toMatchObject({ readOnlyMode: true });
    read.mockImplementationOnce(() => { throw new Error('denied'); });
    expect(loadSettings()).toBeNull();
    exists.mockReturnValue(false);
    expect(loadSettings()).toBeNull();
  });

  it('returns stats and deletes only existing settings', () => {
    const stats = { mtimeMs: 1 };
    exists.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(false);
    stat.mockReturnValue(stats);
    expect(getSettingsStats()).toBe(stats);
    expect(deleteSettingsFile()).toBe(true);
    expect(deleteSettingsFile()).toBe(false);
    expect(fs.unlinkSync).toHaveBeenCalledOnce();
  });

  it('returns null stats when the settings file is absent', () => {
    exists.mockReturnValue(false);
    expect(getSettingsStats()).toBeNull();
  });
});
