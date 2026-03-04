import { InvalidArgumentError } from 'commander';

const REQUEST_TIMEOUT_ENV = 'MONICA_REQUEST_TIMEOUT_MS';

export function parseRequestTimeoutMs(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(`Invalid timeout "${value}". Expected a positive integer in milliseconds.`);
  }
  return parsed;
}

export function applyRequestTimeoutOverride(timeoutMs?: number): void {
  if (timeoutMs === undefined) return;
  process.env[REQUEST_TIMEOUT_ENV] = String(timeoutMs);
}
