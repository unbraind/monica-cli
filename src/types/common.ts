export type OutputFormat = 'toon' | 'json' | 'yaml' | 'table' | 'md';

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

export interface ApiResponse<T> {
  data: T;
}

export interface DeleteResponse {
  deleted: boolean;
  id: number;
}

export interface ApiError {
  error: {
    message: string;
    error_code: number;
  };
}

export interface GlobalOptions {
  format: OutputFormat;
  verbose: boolean;
  page?: number;
  limit?: number;
}
