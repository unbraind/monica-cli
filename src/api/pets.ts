import type { Pet, PetCreateInput, PetUpdateInput, PaginatedResponse, ApiResponse, DeleteResponse } from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listPets(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Pet>> {
  return get<PaginatedResponse<Pet>>('/pets', params);
}

export async function listAllPets(maxPages?: number): Promise<Pet[]> {
  return getAllPages<Pet>('/pets', undefined, maxPages);
}

export async function listContactPets(contactId: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Pet>> {
  return get<PaginatedResponse<Pet>>(`/contacts/${contactId}/pets`, params);
}

export async function getPet(id: number): Promise<ApiResponse<Pet>> {
  return get<ApiResponse<Pet>>(`/pets/${id}`);
}

export async function createPet(data: PetCreateInput): Promise<ApiResponse<Pet>> {
  return post<ApiResponse<Pet>>('/pets', data);
}

export async function updatePet(id: number, data: PetUpdateInput): Promise<ApiResponse<Pet>> {
  return put<ApiResponse<Pet>>(`/pets/${id}`, data);
}

export async function deletePet(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/pets/${id}`);
}
