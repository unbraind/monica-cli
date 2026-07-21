import { InvalidArgumentError } from 'commander';
import type { OutputFormat } from '../types';

const REQUEST_TIMEOUT_ENV = 'MONICA_REQUEST_TIMEOUT_MS';
const VALID_OUTPUT_FORMATS: ReadonlyArray<OutputFormat> = ['toon', 'json', 'yaml', 'table', 'md'];

/** Parses output format. */
export function parseOutputFormat(value: string): OutputFormat {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'markdown') return 'md';
  if (normalized === 'yml') return 'yaml';
  if (VALID_OUTPUT_FORMATS.includes(normalized as OutputFormat)) {
    return normalized as OutputFormat;
  }
  throw new InvalidArgumentError(`Invalid format "${value}". Use: toon, json, yaml, table, md`);
}

/** Parses positive integer. */
export function parsePositiveInteger(value: string): number {
  const normalized = value.trim();
  if (!/^\d+$/u.test(normalized)) {
    throw new InvalidArgumentError(`Invalid number "${value}". Expected a positive integer.`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new InvalidArgumentError(`Invalid number "${value}". Expected a positive integer.`);
  }
  return parsed;
}

/** Parse a finite numeric CLI value without silently accepting partial input. */
export function parseFiniteNumber(value: string): number {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new InvalidArgumentError('Invalid number. Expected a finite numeric value.');
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new InvalidArgumentError(`Invalid number "${value}". Expected a finite numeric value.`);
  }
  return parsed;
}

/** Parses fields option. */
export function parseFieldsOption(value: string): string[] {
  const fields = value
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

  if (fields.length === 0) {
    throw new InvalidArgumentError('Invalid fields value. Provide a comma-separated list like: id,name');
  }

  return Array.from(new Set(fields));
}

/** Parses request timeout ms. */
export function parseRequestTimeoutMs(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(`Invalid timeout "${value}". Expected a positive integer in milliseconds.`);
  }
  return parsed;
}

/** Applies request timeout override. */
export function applyRequestTimeoutOverride(timeoutMs?: number): void {
  if (timeoutMs === undefined) return;
  process.env[REQUEST_TIMEOUT_ENV] = String(timeoutMs);
}
