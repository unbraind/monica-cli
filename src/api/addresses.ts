import type {
  Address,
  AddressCreateInput,
  AddressUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listAddresses(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Address>> {
  return get<PaginatedResponse<Address>>('/addresses', params);
}

export async function listAllAddresses(maxPages?: number): Promise<Address[]> {
  return getAllPages<Address>('/addresses', undefined, maxPages);
}

export async function getAddress(id: number): Promise<ApiResponse<Address>> {
  return get<ApiResponse<Address>>(`/addresses/${id}`);
}

export async function listContactAddresses(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Address>> {
  return get<PaginatedResponse<Address>>(`/contacts/${contactId}/addresses`, params);
}

export async function createAddress(data: AddressCreateInput): Promise<ApiResponse<Address>> {
  return post<ApiResponse<Address>>('/addresses', data);
}

export async function updateAddress(
  id: number,
  data: AddressUpdateInput
): Promise<ApiResponse<Address>> {
  return put<ApiResponse<Address>>(`/addresses/${id}`, data);
}

export async function deleteAddress(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/addresses/${id}`);
}
