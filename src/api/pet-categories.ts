import type { PetCategory, PaginatedResponse, ApiResponse } from '../types';
import { get, getAllPages } from './client';

/** Executes the list pet categories operation. */
export async function listPetCategories(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<PetCategory>> {
  return get<PaginatedResponse<PetCategory>>('/petcategories', params);
}

/** Executes the list all pet categories operation. */
export async function listAllPetCategories(maxPages?: number): Promise<PetCategory[]> {
  return getAllPages<PetCategory>('/petcategories', undefined, maxPages);
}

/** Gets pet category. */
export async function getPetCategory(id: number): Promise<ApiResponse<PetCategory>> {
  return get<ApiResponse<PetCategory>>(`/petcategories/${id}`);
}
