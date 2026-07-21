import { vi } from 'vitest';
import type { PaginatedResponse } from '../src/types';

/** Build a structurally valid empty Monica page for API contract tests. */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    data: [],
    links: { first: '', last: '', prev: null, next: null },
    meta: { current_page: 1, from: 0, last_page: 1, path: '', per_page: 10, to: 0, total: 0 },
  };
}

/**
 * Re-export vi for convenience
 */
export { vi };
