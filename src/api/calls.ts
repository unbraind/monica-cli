import type {
  Call,
  CallCreateInput,
  CallUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listCalls(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Call>> {
  return get<PaginatedResponse<Call>>('/calls', params);
}

export async function listAllCalls(maxPages?: number): Promise<Call[]> {
  return getAllPages<Call>('/calls', undefined, maxPages);
}

export async function getCall(id: number): Promise<ApiResponse<Call>> {
  return get<ApiResponse<Call>>(`/calls/${id}`);
}

export async function listContactCalls(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Call>> {
  return get<PaginatedResponse<Call>>(`/contacts/${contactId}/calls`, params);
}

export async function createCall(data: CallCreateInput): Promise<ApiResponse<Call>> {
  return post<ApiResponse<Call>>('/calls', data);
}

export async function updateCall(id: number, data: CallUpdateInput): Promise<ApiResponse<Call>> {
  return put<ApiResponse<Call>>(`/calls/${id}`, data);
}

export async function deleteCall(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/calls/${id}`);
}
