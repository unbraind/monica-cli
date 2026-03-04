const DEFAULT_MAX_GET_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 250;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export function getMaxGetRetries(): number {
  const raw = process.env.MONICA_MAX_GET_RETRIES;
  if (!raw) return DEFAULT_MAX_GET_RETRIES;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) return DEFAULT_MAX_GET_RETRIES;
  return parsed;
}

function parseRetryAfterMs(headerValue: string | null): number | null {
  if (!headerValue) return null;

  const seconds = Number.parseInt(headerValue, 10);
  if (!Number.isNaN(seconds) && seconds >= 0) return seconds * 1000;

  const dateValue = Date.parse(headerValue);
  if (Number.isNaN(dateValue)) return null;

  const delta = dateValue - Date.now();
  return delta > 0 ? delta : 0;
}

export function getRetryDelayMs(response: Response, attempt: number): number {
  const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'));
  if (retryAfterMs !== null) return retryAfterMs;
  return DEFAULT_RETRY_DELAY_MS * Math.pow(2, attempt);
}

export async function delay(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function getRequestTimeoutMs(): number {
  const raw = process.env.MONICA_REQUEST_TIMEOUT_MS;
  if (!raw) return DEFAULT_REQUEST_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_REQUEST_TIMEOUT_MS;
  return parsed;
}

export function createRequestTimeoutController(timeoutMs: number): { signal?: AbortSignal; cleanup: () => void } {
  if (timeoutMs <= 0) return { signal: undefined, cleanup: () => undefined };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
}

export function isAbortError(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as { name?: string }).name === 'AbortError';
}
