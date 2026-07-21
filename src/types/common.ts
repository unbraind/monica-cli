/** Describes the output format data contract. */
export type OutputFormat = 'toon' | 'json' | 'yaml' | 'table' | 'md';

/** Describes the monica config data contract. */
export interface MonicaConfig {
  apiUrl: string;
  apiKey: string;
  userEmail?: string;
  userPassword?: string;
  // Backward-compatible alias accepted in persisted settings.
  readOnly?: boolean;
  readOnlyMode?: boolean;
  githubRepoStarred?: boolean;
  githubStarPrompted?: boolean;
  defaultFormat?: OutputFormat;
}

/** Describes the paginated response data contract. */
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: string | number;
    to: number;
    total: number;
  };
}

/** Describes the api response data contract. */
export interface ApiResponse<T> {
  data: T;
}

/** Describes the delete response data contract. */
export interface DeleteResponse {
  deleted: boolean;
  id: number;
}

/** Describes the api error data contract. */
export interface ApiError {
  message?: string;
  error?: {
    message: string;
    error_code: number;
  };
}

/** Describes the global options data contract. */
export interface GlobalOptions {
  format: OutputFormat;
  verbose: boolean;
  page?: number;
  limit?: number;
}
