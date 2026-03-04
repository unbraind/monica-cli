import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { MonicaConfig, ApiError, PaginatedResponse } from '../types';
import { normalizeSettings } from '../utils/settings';
import {
  createRequestTimeoutController,
  delay,
  getMaxGetRetries,
  getRequestTimeoutMs,
  getRetryDelayMs,
  isAbortError,
} from './request-utils';

const GLOBAL_SETTINGS_PATH = path.join(os.homedir(), '.monica-cli', 'settings.json');

function loadGlobalSettings(): Partial<MonicaConfig> | null {
  try {
    if (fs.existsSync(GLOBAL_SETTINGS_PATH)) {
      const content = fs.readFileSync(GLOBAL_SETTINGS_PATH, 'utf-8');
      return normalizeSettings(JSON.parse(content) as Partial<MonicaConfig>);
    }
  } catch {
    // Ignore errors reading global settings
  }
  return null;
}

let config: MonicaConfig | null = null;

export function resolveReadOnlyMode(
  envValue: string | undefined,
  globalSettings?: Partial<MonicaConfig> | null
): boolean {
  if (envValue !== undefined) {
    return envValue === '1' || envValue.toLowerCase() === 'true';
  }
  return globalSettings?.readOnlyMode === true;
}

function getReadOnlyMode(globalSettings?: Partial<MonicaConfig> | null): boolean {
  return resolveReadOnlyMode(process.env.MONICA_READ_ONLY, globalSettings);
}

export function getConfig(): MonicaConfig {
  if (!config) {
    const globalSettings = loadGlobalSettings();
    
    const apiUrl = process.env.MONICA_API_URL || globalSettings?.apiUrl;
    const apiKey = process.env.MONICA_API_KEY || globalSettings?.apiKey;
    
    if (!apiUrl || !apiKey) {
      throw new Error('MONICA_API_URL and MONICA_API_KEY must be set in environment or ~/.monica-cli/settings.json');
    }
    
    config = {
      apiUrl: apiUrl.replace(/\/$/, ''),
      apiKey,
      userEmail: process.env.MONICA_USER_EMAIL || globalSettings?.userEmail,
      userPassword: process.env.MONICA_USER_PASSWORD || globalSettings?.userPassword,
      readOnlyMode: getReadOnlyMode(globalSettings),
    };
  }
  return config;
}

export function setConfig(newConfig: MonicaConfig): void {
  config = newConfig;
}

export class MonicaApiError extends Error {
  public readonly errorCode: number;
  public readonly statusCode: number;
  
  constructor(message: string, errorCode: number, statusCode: number) {
    super(message);
    this.name = 'MonicaApiError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function toMonicaApiError(responseData: unknown, status: number): MonicaApiError {
  const data = responseData as ApiError;
  const message =
    data?.error?.message ||
    (typeof responseData === 'string' && responseData.trim() ? responseData : `HTTP ${status}`);
  const errorCode = data?.error?.error_code || 0;
  return new MonicaApiError(message, errorCode, status);
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const cfg = getConfig();
  const { method = 'GET', body, params } = options;

  if (cfg.readOnlyMode && method !== 'GET') {
    throw new Error(`Read-only mode enabled: blocked ${method} ${endpoint}`);
  }
  
  let url = `${cfg.apiUrl}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${cfg.apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const maxGetRetries = getMaxGetRetries();
  const requestTimeoutMs = getRequestTimeoutMs();
  let attempt = 0;

  while (true) {
    const timeoutController = createRequestTimeoutController(requestTimeoutMs);
    let response: Response;
    try {
      response = await fetch(url, { ...fetchOptions, signal: timeoutController.signal });
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error(`Request timed out after ${requestTimeoutMs}ms: ${method} ${endpoint}`);
      }
      throw error;
    } finally {
      timeoutController.cleanup();
    }
    const responseData = await parseResponseBody(response);

    if (response.ok) {
      return responseData as T;
    }

    if (method === 'GET' && response.status === 429 && attempt < maxGetRetries) {
      const delayMs = getRetryDelayMs(response, attempt);
      attempt++;
      await delay(delayMs);
      continue;
    }

    throw toMonicaApiError(responseData, response.status);
  }
}

export async function get<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  return request<T>(endpoint, { method: 'GET', params });
}

export async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, { method: 'POST', body });
}

export async function put<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>(endpoint, { method: 'PUT', body });
}

export async function del<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

export async function upload<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const cfg = getConfig();

  if (cfg.readOnlyMode) {
    throw new Error(`Read-only mode enabled: blocked POST ${endpoint}`);
  }

  const url = `${cfg.apiUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${cfg.apiKey}`,
    'Accept': 'application/json',
  };

  const requestTimeoutMs = getRequestTimeoutMs();
  const timeoutController = createRequestTimeoutController(requestTimeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: timeoutController.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`Request timed out after ${requestTimeoutMs}ms: POST ${endpoint}`);
    }
    throw error;
  } finally {
    timeoutController.cleanup();
  }

  const responseData = await response.json();

  if (!response.ok) {
    const apiError = responseData as ApiError;
    const message = apiError.error?.message || `HTTP ${response.status}`;
    const errorCode = apiError.error?.error_code || 0;
    throw new MonicaApiError(message, errorCode, response.status);
  }

  return responseData as T;
}

export async function* paginate<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  maxPages?: number
): AsyncGenerator<T[], void, unknown> {
  let page = 1;
  let pageCount = 1;
  
  do {
    const response = await get<PaginatedResponse<T>>(endpoint, {
      ...params,
      page,
    });
    
    pageCount = response.meta.last_page;
    yield response.data;
    
    page++;
    if (maxPages && page > maxPages) break;
  } while (page <= pageCount);
}

export async function getAllPages<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  maxPages?: number
): Promise<T[]> {
  const results: T[] = [];
  for await (const items of paginate<T>(endpoint, params, maxPages)) {
    results.push(...items);
  }
  return results;
}
