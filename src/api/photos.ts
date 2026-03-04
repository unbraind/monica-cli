import * as fs from 'fs';
import * as path from 'path';
import type {
  Photo,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, del, getAllPages, upload } from './client';

export async function listPhotos(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Photo>> {
  return get<PaginatedResponse<Photo>>('/photos', params);
}

export async function listAllPhotos(maxPages?: number): Promise<Photo[]> {
  return getAllPages<Photo>('/photos', undefined, maxPages);
}

export async function getPhoto(id: number): Promise<ApiResponse<Photo>> {
  return get<ApiResponse<Photo>>(`/photos/${id}`);
}

export async function listContactPhotos(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Photo>> {
  return get<PaginatedResponse<Photo>>(`/contacts/${contactId}/photos`, params);
}

export async function deletePhoto(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/photos/${id}`);
}

export async function createPhoto(
  contactId: number,
  filePath: string
): Promise<ApiResponse<Photo>> {
  const formData = new FormData();
  formData.append('contact_id', String(contactId));

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const blob = new Blob([fileBuffer]);
  formData.append('photo', blob, fileName);

  return upload<ApiResponse<Photo>>('/photos', formData);
}
