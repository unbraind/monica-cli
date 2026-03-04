import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { CapabilityReport } from '../api/capabilities';
import { getConfig } from '../api/client';

export interface CapabilityCacheEntry {
  apiUrl: string;
  generatedAt: string;
  report: CapabilityReport;
}

export interface CapabilityCacheOptions {
  refresh?: boolean;
  ttlSeconds?: number;
}

const DEFAULT_TTL_SECONDS = 300;

export function getCapabilityCachePath(): string {
  const baseDir = process.env.MONICA_CLI_HOME?.trim()
    ? path.resolve(process.env.MONICA_CLI_HOME.trim())
    : path.join(os.homedir(), '.monica-cli');
  return path.join(baseDir, 'cache', 'capabilities.json');
}

function ensureCacheDir(): void {
  const cacheDir = path.dirname(getCapabilityCachePath());
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true, mode: 0o700 });
  }
}

function parseTtlSeconds(value?: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  const envValue = Number.parseInt(process.env.MONICA_CAPABILITY_CACHE_TTL_SECONDS || '', 10);
  if (Number.isFinite(envValue) && envValue >= 0) {
    return envValue;
  }
  return DEFAULT_TTL_SECONDS;
}

function isExpired(generatedAt: string, ttlSeconds: number): boolean {
  if (ttlSeconds === 0) return true;
  const generatedAtMs = Date.parse(generatedAt);
  if (Number.isNaN(generatedAtMs)) return true;
  return (Date.now() - generatedAtMs) > ttlSeconds * 1000;
}

function readCache(): CapabilityCacheEntry | null {
  try {
    const cachePath = getCapabilityCachePath();
    if (!fs.existsSync(cachePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as CapabilityCacheEntry;
    if (!parsed || typeof parsed !== 'object' || !parsed.apiUrl || !parsed.generatedAt || !parsed.report) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: CapabilityCacheEntry): void {
  ensureCacheDir();
  fs.writeFileSync(getCapabilityCachePath(), JSON.stringify(entry, null, 2), { mode: 0o600 });
}

function matchesCurrentInstance(entry: CapabilityCacheEntry): boolean {
  const config = getConfig();
  return Boolean(config.apiUrl && entry.apiUrl === config.apiUrl);
}

export function clearCapabilityCache(): void {
  try {
    const cachePath = getCapabilityCachePath();
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch {
    // Ignore cache clear errors.
  }
}

export function getCapabilityCacheStats(): fs.Stats | null {
  try {
    const cachePath = getCapabilityCachePath();
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    return fs.statSync(cachePath);
  } catch {
    return null;
  }
}

export function loadCachedCapabilityReport(options?: CapabilityCacheOptions): CapabilityReport | null {
  if (options?.refresh) return null;
  const ttlSeconds = parseTtlSeconds(options?.ttlSeconds);
  const entry = readCache();
  if (!entry) return null;
  if (!matchesCurrentInstance(entry)) return null;
  if (isExpired(entry.generatedAt, ttlSeconds)) return null;
  return entry.report;
}

export function saveCapabilityReport(report: CapabilityReport): void {
  const config = getConfig();
  if (!config.apiUrl) return;
  const entry: CapabilityCacheEntry = {
    apiUrl: config.apiUrl,
    generatedAt: new Date().toISOString(),
    report,
  };
  writeCache(entry);
}
