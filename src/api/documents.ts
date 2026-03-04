import * as fs from 'fs';
import * as path from 'path';
import type {
  Document,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, del, getAllPages, upload } from './client';

export async function listDocuments(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Document>> {
  return get<PaginatedResponse<Document>>('/documents', params);
}

export async function listAllDocuments(maxPages?: number): Promise<Document[]> {
  return getAllPages<Document>('/documents', undefined, maxPages);
}

export async function getDocument(id: number): Promise<ApiResponse<Document>> {
  return get<ApiResponse<Document>>(`/documents/${id}`);
}

export async function listContactDocuments(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Document>> {
  return get<PaginatedResponse<Document>>(`/contacts/${contactId}/documents`, params);
}

export async function deleteDocument(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/documents/${id}`);
}

export async function createDocument(
  contactId: number,
  filePath: string
): Promise<ApiResponse<Document>> {
  const formData = new FormData();
  formData.append('contact_id', String(contactId));

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const blob = new Blob([fileBuffer]);
  formData.append('document', blob, fileName);

  return upload<ApiResponse<Document>>('/documents', formData);
}
