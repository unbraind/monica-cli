import * as fs from 'fs';
import * as path from 'path';
import type {
  Photo,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, del, getAllPages, upload } from './client';

/** Executes the list photos operation. */
export async function listPhotos(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Photo>> {
  return get<PaginatedResponse<Photo>>('/photos', params);
}

/** Executes the list all photos operation. */
export async function listAllPhotos(maxPages?: number): Promise<Photo[]> {
  return getAllPages<Photo>('/photos', undefined, maxPages);
}

/** Gets photo. */
export async function getPhoto(id: number): Promise<ApiResponse<Photo>> {
  return get<ApiResponse<Photo>>(`/photos/${id}`);
}

/** Executes the list contact photos operation. */
export async function listContactPhotos(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Photo>> {
  return get<PaginatedResponse<Photo>>(`/contacts/${contactId}/photos`, params);
}

/** Executes the delete photo operation. */
export async function deletePhoto(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/photos/${id}`);
}

/** Creates photo. */
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
