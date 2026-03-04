import type {
  JournalEntry,
  JournalCreateInput,
  JournalUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listJournalEntries(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<JournalEntry>> {
  return get<PaginatedResponse<JournalEntry>>('/journal', params);
}

export async function listAllJournalEntries(maxPages?: number): Promise<JournalEntry[]> {
  return getAllPages<JournalEntry>('/journal', undefined, maxPages);
}

export async function getJournalEntry(id: number): Promise<ApiResponse<JournalEntry>> {
  return get<ApiResponse<JournalEntry>>(`/journal/${id}`);
}

export async function createJournalEntry(
  data: JournalCreateInput
): Promise<ApiResponse<JournalEntry>> {
  return post<ApiResponse<JournalEntry>>('/journal', data);
}

export async function updateJournalEntry(
  id: number,
  data: JournalUpdateInput
): Promise<ApiResponse<JournalEntry>> {
  return put<ApiResponse<JournalEntry>>(`/journal/${id}`, data);
}

export async function deleteJournalEntry(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/journal/${id}`);
}
