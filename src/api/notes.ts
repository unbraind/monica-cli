import type {
  Note,
  NoteCreateInput,
  NoteUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listNotes(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Note>> {
  return get<PaginatedResponse<Note>>('/notes', params);
}

export async function listAllNotes(maxPages?: number): Promise<Note[]> {
  return getAllPages<Note>('/notes', undefined, maxPages);
}

export async function getNote(id: number): Promise<ApiResponse<Note>> {
  return get<ApiResponse<Note>>(`/notes/${id}`);
}

export async function createNote(data: NoteCreateInput): Promise<ApiResponse<Note>> {
  return post<ApiResponse<Note>>('/notes', data);
}

export async function updateNote(id: number, data: NoteUpdateInput): Promise<ApiResponse<Note>> {
  return put<ApiResponse<Note>>(`/notes/${id}`, data);
}

export async function deleteNote(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/notes/${id}`);
}

export async function listContactNotes(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Note>> {
  return get<PaginatedResponse<Note>>(`/contacts/${contactId}/notes`, params);
}
