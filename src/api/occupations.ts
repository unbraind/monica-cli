import type {
  Occupation,
  OccupationCreateInput,
  OccupationUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

/** Executes the list occupations operation. */
export async function listOccupations(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Occupation>> {
  return get<PaginatedResponse<Occupation>>('/occupations', params);
}

/** Executes the list all occupations operation. */
export async function listAllOccupations(maxPages?: number): Promise<Occupation[]> {
  return getAllPages<Occupation>('/occupations', undefined, maxPages);
}

/** Gets occupation. */
export async function getOccupation(id: number): Promise<ApiResponse<Occupation>> {
  return get<ApiResponse<Occupation>>(`/occupations/${id}`);
}

/** Executes the list contact occupations operation. */
export async function listContactOccupations(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Occupation>> {
  return get<PaginatedResponse<Occupation>>(`/contacts/${contactId}/occupations`, params);
}

/** Creates occupation. */
export async function createOccupation(
  data: OccupationCreateInput
): Promise<ApiResponse<Occupation>> {
  return post<ApiResponse<Occupation>>('/occupations', data);
}

/** Executes the update occupation operation. */
export async function updateOccupation(
  id: number,
  data: OccupationUpdateInput
): Promise<ApiResponse<Occupation>> {
  return put<ApiResponse<Occupation>>(`/occupations/${id}`, data);
}

/** Executes the delete occupation operation. */
export async function deleteOccupation(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/occupations/${id}`);
}
