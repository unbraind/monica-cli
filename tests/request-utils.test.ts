import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRequestTimeoutController,
  delay,
  getMaxGetRetries,
  getRequestTimeoutMs,
  getRetryDelayMs,
  isAbortError,
} from '../src/api/request-utils';

describe('request utils', () => {
  afterEach(() => {
    delete process.env.MONICA_MAX_GET_RETRIES;
    delete process.env.MONICA_REQUEST_TIMEOUT_MS;
    vi.restoreAllMocks();
  });

  it('parses max GET retries from environment with fallback', () => {
    expect(getMaxGetRetries()).toBe(2);

    process.env.MONICA_MAX_GET_RETRIES = '4';
    expect(getMaxGetRetries()).toBe(4);

    process.env.MONICA_MAX_GET_RETRIES = '-1';
    expect(getMaxGetRetries()).toBe(2);

    process.env.MONICA_MAX_GET_RETRIES = 'abc';
    expect(getMaxGetRetries()).toBe(2);
  });

  it('parses request timeout from environment with fallback', () => {
    expect(getRequestTimeoutMs()).toBe(15000);

    process.env.MONICA_REQUEST_TIMEOUT_MS = '2500';
    expect(getRequestTimeoutMs()).toBe(2500);

    process.env.MONICA_REQUEST_TIMEOUT_MS = '0';
    expect(getRequestTimeoutMs()).toBe(15000);

    process.env.MONICA_REQUEST_TIMEOUT_MS = 'invalid';
    expect(getRequestTimeoutMs()).toBe(15000);
  });

  it('resolves retry delay from Retry-After header in seconds', () => {
    const response = new Response('', {
      status: 429,
      headers: { 'Retry-After': '3' },
    });

    expect(getRetryDelayMs(response, 0)).toBe(3000);
  });

  it('resolves retry delay from Retry-After date header', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const retryDate = new Date(3_000).toUTCString();
    const response = new Response('', {
      status: 429,
      headers: { 'Retry-After': retryDate },
    });

    expect(getRetryDelayMs(response, 0)).toBe(2000);
    nowSpy.mockRestore();
  });

  it('uses exponential backoff when Retry-After is missing', () => {
    const response = new Response('', { status: 429 });

    expect(getRetryDelayMs(response, 0)).toBe(250);
    expect(getRetryDelayMs(response, 1)).toBe(500);
    expect(getRetryDelayMs(response, 2)).toBe(1000);
  });

  it('delay returns immediately for non-positive values', async () => {
    await expect(delay(0)).resolves.toBeUndefined();
    await expect(delay(-5)).resolves.toBeUndefined();
  });

  it('creates timeout controller with abort signal for positive timeout', async () => {
    const controller = createRequestTimeoutController(5);
    expect(controller.signal).toBeDefined();
    expect(controller.signal?.aborted).toBe(false);

    await delay(10);
    expect(controller.signal?.aborted).toBe(true);

    controller.cleanup();
  });

  it('creates noop timeout controller for non-positive timeout', () => {
    const controller = createRequestTimeoutController(0);
    expect(controller.signal).toBeUndefined();
    expect(() => controller.cleanup()).not.toThrow();
  });

  it('detects abort errors', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
    expect(isAbortError(new Error('x'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
