import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { CapabilityReport } from '../src/api/capabilities';
import { setConfig } from '../src/api/client';
import {
  clearCapabilityCache,
  getCapabilityCachePath,
  getCapabilityCacheStats,
  loadCachedCapabilityReport,
  saveCapabilityReport,
} from '../src/utils/capability-cache';

const REPORT: CapabilityReport = {
  generatedAt: '2026-07-21T00:00:00.000Z',
  summary: { total: 1, supported: 1, unsupported: 0 },
  probes: [{
    key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true,
    statusCode: 200, message: 'OK',
  }],
};

describe('capability cache', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'monica-capabilities-'));
    process.env.MONICA_CLI_HOME = root;
    delete process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS;
    setConfig({ apiUrl: 'https://monica.test/api', apiKey: 'token', readOnlyMode: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.MONICA_CLI_HOME;
    delete process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS;
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('resolves the isolated cache path and saves private cache data', () => {
    expect(getCapabilityCachePath()).toBe(path.join(root, 'cache', 'capabilities.json'));
    saveCapabilityReport(REPORT);
    saveCapabilityReport(REPORT);
    const cachePath = getCapabilityCachePath();
    expect(fs.existsSync(cachePath)).toBe(true);
    if (process.platform !== 'win32') {
      expect(fs.statSync(path.dirname(cachePath)).mode & 0o777).toBe(0o700);
      expect(fs.statSync(cachePath).mode & 0o777).toBe(0o600);
    }
    expect(loadCachedCapabilityReport({ ttlSeconds: 3600 })).toEqual(REPORT);
    expect(getCapabilityCacheStats()?.isFile()).toBe(true);
  });

  it('supports refresh, explicit expiry, and environment TTL', () => {
    saveCapabilityReport(REPORT);
    expect(loadCachedCapabilityReport({ refresh: true })).toBeNull();
    expect(loadCachedCapabilityReport({ ttlSeconds: 0 })).toBeNull();
    process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS = '0';
    expect(loadCachedCapabilityReport()).toBeNull();
    process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS = 'invalid';
    expect(loadCachedCapabilityReport()).toEqual(REPORT);
  });

  it('rejects another instance, malformed timestamps, JSON, and entry shapes', () => {
    saveCapabilityReport(REPORT);
    setConfig({ apiUrl: 'https://other.test/api', apiKey: 'token', readOnlyMode: true });
    expect(loadCachedCapabilityReport({ ttlSeconds: 3600 })).toBeNull();

    setConfig({ apiUrl: 'https://monica.test/api', apiKey: 'token', readOnlyMode: true });
    const cachePath = getCapabilityCachePath();
    const entry = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Record<string, unknown>;
    fs.writeFileSync(cachePath, JSON.stringify({ ...entry, generatedAt: 'not-a-date' }));
    expect(loadCachedCapabilityReport({ ttlSeconds: 3600 })).toBeNull();
    fs.writeFileSync(cachePath, '{broken');
    expect(loadCachedCapabilityReport()).toBeNull();
    fs.writeFileSync(cachePath, JSON.stringify({ apiUrl: 'https://monica.test/api' }));
    expect(loadCachedCapabilityReport()).toBeNull();
  });

  it('clears existing cache and tolerates missing cache state', () => {
    expect(getCapabilityCacheStats()).toBeNull();
    expect(loadCachedCapabilityReport()).toBeNull();
    clearCapabilityCache();
    saveCapabilityReport(REPORT);
    clearCapabilityCache();
    expect(fs.existsSync(getCapabilityCachePath())).toBe(false);
  });

  it('does not save without a configured URL', () => {
    setConfig({ apiUrl: '', apiKey: 'token', readOnlyMode: true });
    saveCapabilityReport(REPORT);
    expect(fs.existsSync(getCapabilityCachePath())).toBe(false);
  });

  (process.platform === 'win32' ? it.skip : it)('tolerates filesystem read and clear failures', () => {
    saveCapabilityReport(REPORT);
    const cachePath = getCapabilityCachePath();
    const cacheDir = path.dirname(cachePath);
    fs.chmodSync(cachePath, 0o000);
    expect(loadCachedCapabilityReport()).toBeNull();
    fs.chmodSync(cachePath, 0o600);
    fs.chmodSync(cacheDir, 0o500);
    expect(() => clearCapabilityCache()).not.toThrow();
    expect(fs.existsSync(cachePath)).toBe(true);
    fs.chmodSync(cacheDir, 0o700);
  });
});
