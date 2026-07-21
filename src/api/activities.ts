import type {
  Activity,
  ActivityCreateInput,
  ActivityUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

/** Executes the list activities operation. */
export async function listActivities(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Activity>> {
  return get<PaginatedResponse<Activity>>('/activities', params);
}

/** Executes the list all activities operation. */
export async function listAllActivities(maxPages?: number): Promise<Activity[]> {
  return getAllPages<Activity>('/activities', undefined, maxPages);
}

/** Gets activity. */
export async function getActivity(id: number): Promise<ApiResponse<Activity>> {
  return get<ApiResponse<Activity>>(`/activities/${id}`);
}

/** Creates activity. */
export async function createActivity(data: ActivityCreateInput): Promise<ApiResponse<Activity>> {
  return post<ApiResponse<Activity>>('/activities', data);
}

/** Executes the update activity operation. */
export async function updateActivity(
  id: number,
  data: ActivityUpdateInput
): Promise<ApiResponse<Activity>> {
  return put<ApiResponse<Activity>>(`/activities/${id}`, data);
}

/** Executes the delete activity operation. */
export async function deleteActivity(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/activities/${id}`);
}

/** Executes the list contact activities operation. */
export async function listContactActivities(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Activity>> {
  return get<PaginatedResponse<Activity>>(`/contacts/${contactId}/activities`, params);
}
