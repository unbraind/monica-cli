import type {
  Occupation,
  OccupationCreateInput,
  OccupationUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listOccupations(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Occupation>> {
  return get<PaginatedResponse<Occupation>>('/occupations', params);
}

export async function listAllOccupations(maxPages?: number): Promise<Occupation[]> {
  return getAllPages<Occupation>('/occupations', undefined, maxPages);
}

export async function getOccupation(id: number): Promise<ApiResponse<Occupation>> {
  return get<ApiResponse<Occupation>>(`/occupations/${id}`);
}

export async function listContactOccupations(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Occupation>> {
  return get<PaginatedResponse<Occupation>>(`/contacts/${contactId}/occupations`, params);
}

export async function createOccupation(
  data: OccupationCreateInput
): Promise<ApiResponse<Occupation>> {
  return post<ApiResponse<Occupation>>('/occupations', data);
}

export async function updateOccupation(
  id: number,
  data: OccupationUpdateInput
): Promise<ApiResponse<Occupation>> {
  return put<ApiResponse<Occupation>>(`/occupations/${id}`, data);
}

export async function deleteOccupation(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/occupations/${id}`);
}
