import type {
  Address,
  AddressCreateInput,
  AddressUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

/** Executes the list addresses operation. */
export async function listAddresses(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Address>> {
  return get<PaginatedResponse<Address>>('/addresses', params);
}

/** Executes the list all addresses operation. */
export async function listAllAddresses(maxPages?: number): Promise<Address[]> {
  return getAllPages<Address>('/addresses', undefined, maxPages);
}

/** Gets address. */
export async function getAddress(id: number): Promise<ApiResponse<Address>> {
  return get<ApiResponse<Address>>(`/addresses/${id}`);
}

/** Executes the list contact addresses operation. */
export async function listContactAddresses(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Address>> {
  return get<PaginatedResponse<Address>>(`/contacts/${contactId}/addresses`, params);
}

/** Creates address. */
export async function createAddress(data: AddressCreateInput): Promise<ApiResponse<Address>> {
  return post<ApiResponse<Address>>('/addresses', data);
}

/** Executes the update address operation. */
export async function updateAddress(
  id: number,
  data: AddressUpdateInput
): Promise<ApiResponse<Address>> {
  return put<ApiResponse<Address>>(`/addresses/${id}`, data);
}

/** Executes the delete address operation. */
export async function deleteAddress(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/addresses/${id}`);
}
