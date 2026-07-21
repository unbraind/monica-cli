import type { Pet, PetCreateInput, PetUpdateInput, PaginatedResponse, ApiResponse, DeleteResponse } from '../types';
import { get, post, put, del, getAllPages } from './client';

/** Executes the list pets operation. */
export async function listPets(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Pet>> {
  return get<PaginatedResponse<Pet>>('/pets', params);
}

/** Executes the list all pets operation. */
export async function listAllPets(maxPages?: number): Promise<Pet[]> {
  return getAllPages<Pet>('/pets', undefined, maxPages);
}

/** Executes the list contact pets operation. */
export async function listContactPets(contactId: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Pet>> {
  return get<PaginatedResponse<Pet>>(`/contacts/${contactId}/pets`, params);
}

/** Gets pet. */
export async function getPet(id: number): Promise<ApiResponse<Pet>> {
  return get<ApiResponse<Pet>>(`/pets/${id}`);
}

/** Creates pet. */
export async function createPet(data: PetCreateInput): Promise<ApiResponse<Pet>> {
  return post<ApiResponse<Pet>>('/pets', data);
}

/** Executes the update pet operation. */
export async function updatePet(id: number, data: PetUpdateInput): Promise<ApiResponse<Pet>> {
  return put<ApiResponse<Pet>>(`/pets/${id}`, data);
}

/** Executes the delete pet operation. */
export async function deletePet(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/pets/${id}`);
}
