import type {
  Group,
  GroupCreateInput,
  GroupUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { MonicaApiError } from './client';
import { get, post, put, del, getAllPages } from './client';

/** Executes the list groups operation. */
export async function listGroups(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Group>> {
  return get<PaginatedResponse<Group>>('/groups', params);
}

/** Executes the list all groups operation. */
export async function listAllGroups(maxPages?: number): Promise<Group[]> {
  return getAllPages<Group>('/groups', undefined, maxPages);
}

/** Gets group. */
export async function getGroup(id: number): Promise<ApiResponse<Group>> {
  return get<ApiResponse<Group>>(`/groups/${id}`);
}

/** Creates group. */
export async function createGroup(data: GroupCreateInput): Promise<ApiResponse<Group>> {
  return post<ApiResponse<Group>>('/groups', data);
}

/** Executes the update group operation. */
export async function updateGroup(id: number, data: GroupUpdateInput): Promise<ApiResponse<Group>> {
  return put<ApiResponse<Group>>(`/groups/${id}`, data);
}

/** Executes the delete group operation. */
export async function deleteGroup(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/groups/${id}`);
}

/** Describes the attach contacts input data contract. */
export interface AttachContactsInput {
  contacts: number[];
}

function isEndpointNotFoundError(error: unknown): boolean {
  if (error instanceof MonicaApiError) {
    return error.statusCode === 404;
  }
  const maybeError = error as { statusCode?: number; message?: string };
  return maybeError.statusCode === 404 || maybeError.message?.includes('HTTP 404') === true;
}

async function postWithFallback(
  primaryEndpoint: string,
  fallbackEndpoint: string,
  data: AttachContactsInput
): Promise<{ success: boolean }> {
  try {
    return await post<{ success: boolean }>(primaryEndpoint, data);
  } catch (error) {
    if (!isEndpointNotFoundError(error)) {
      throw error;
    }
  }
  return post<{ success: boolean }>(fallbackEndpoint, data);
}

/** Executes the attach contacts to group operation. */
export async function attachContactsToGroup(
  id: number,
  data: AttachContactsInput
): Promise<{ success: boolean }> {
  return postWithFallback(
    `/groups/${id}/attachContacts`,
    `/groups/${id}/attach`,
    data
  );
}

/** Executes the detach contacts from group operation. */
export async function detachContactsFromGroup(
  id: number,
  data: AttachContactsInput
): Promise<{ success: boolean }> {
  return postWithFallback(
    `/groups/${id}/detachContacts`,
    `/groups/${id}/detach`,
    data
  );
}
