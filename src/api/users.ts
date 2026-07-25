import type { AccountUser, ApiResponse, PaginatedResponse } from '../types';
import { get, getAllPages } from './client';

/** Gets the authenticated user from the current Monica API. */
export function getAuthenticatedUser(): Promise<ApiResponse<AccountUser>> {
  return get<ApiResponse<AccountUser>>('/user');
}

/** Lists account users from the current Monica API. */
export function listAccountUsers(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AccountUser>> {
  return get<PaginatedResponse<AccountUser>>('/users', params);
}

/** Lists all account users from the current Monica API. */
export function listAllAccountUsers(maxPages?: number): Promise<AccountUser[]> {
  return getAllPages<AccountUser>('/users', {}, maxPages);
}

/** Gets one account user from the current Monica API. */
export function getAccountUser(id: string): Promise<ApiResponse<AccountUser>> {
  return get<ApiResponse<AccountUser>>(`/users/${encodeURIComponent(id)}`);
}
