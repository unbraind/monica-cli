import type {
  Gift,
  GiftCreateInput,
  GiftUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listGifts(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Gift>> {
  return get<PaginatedResponse<Gift>>('/gifts', params);
}

export async function listAllGifts(maxPages?: number): Promise<Gift[]> {
  return getAllPages<Gift>('/gifts', undefined, maxPages);
}

export async function getGift(id: number): Promise<ApiResponse<Gift>> {
  return get<ApiResponse<Gift>>(`/gifts/${id}`);
}

export async function listContactGifts(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Gift>> {
  return get<PaginatedResponse<Gift>>(`/contacts/${contactId}/gifts`, params);
}

export async function createGift(data: GiftCreateInput): Promise<ApiResponse<Gift>> {
  return post<ApiResponse<Gift>>('/gifts', data);
}

export async function updateGift(id: number, data: GiftUpdateInput): Promise<ApiResponse<Gift>> {
  return put<ApiResponse<Gift>>(`/gifts/${id}`, data);
}

export async function deleteGift(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/gifts/${id}`);
}

export async function associateGiftPhoto(
  giftId: number,
  photoId: number
): Promise<ApiResponse<Gift>> {
  return put<ApiResponse<Gift>>(`/gifts/${giftId}/photo/${photoId}`);
}
