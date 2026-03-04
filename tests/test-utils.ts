import { vi, type MockedFunction } from 'vitest';

/**
 * Helper to cast a vi.fn() mock to a properly typed MockedFunction
 * Use this instead of vi.mocked() which has compatibility issues
 */
export function mockFn<T extends (...args: any[]) => any>(fn: T): MockedFunction<T> {
  return fn as MockedFunction<T>;
}

/**
 * Re-export vi for convenience
 */
export { vi };
