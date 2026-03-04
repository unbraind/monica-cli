import type {
  Activity,
  ActivityCreateInput,
  ActivityUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listActivities(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Activity>> {
  return get<PaginatedResponse<Activity>>('/activities', params);
}

export async function listAllActivities(maxPages?: number): Promise<Activity[]> {
  return getAllPages<Activity>('/activities', undefined, maxPages);
}

export async function getActivity(id: number): Promise<ApiResponse<Activity>> {
  return get<ApiResponse<Activity>>(`/activities/${id}`);
}

export async function createActivity(data: ActivityCreateInput): Promise<ApiResponse<Activity>> {
  return post<ApiResponse<Activity>>('/activities', data);
}

export async function updateActivity(
  id: number,
  data: ActivityUpdateInput
): Promise<ApiResponse<Activity>> {
  return put<ApiResponse<Activity>>(`/activities/${id}`, data);
}

export async function deleteActivity(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/activities/${id}`);
}

export async function listContactActivities(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Activity>> {
  return get<PaginatedResponse<Activity>>(`/contacts/${contactId}/activities`, params);
}
