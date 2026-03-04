import type { PetCategory, PaginatedResponse, ApiResponse } from '../types';
import { get, getAllPages } from './client';

export async function listPetCategories(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<PetCategory>> {
  return get<PaginatedResponse<PetCategory>>('/petcategories', params);
}

export async function listAllPetCategories(maxPages?: number): Promise<PetCategory[]> {
  return getAllPages<PetCategory>('/petcategories', undefined, maxPages);
}

export async function getPetCategory(id: number): Promise<ApiResponse<PetCategory>> {
  return get<ApiResponse<PetCategory>>(`/petcategories/${id}`);
}
