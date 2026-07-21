import type {
  JournalEntry,
  JournalCreateInput,
  JournalUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

/** Executes the list journal entries operation. */
export async function listJournalEntries(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<JournalEntry>> {
  return get<PaginatedResponse<JournalEntry>>('/journal', params);
}

/** Executes the list all journal entries operation. */
export async function listAllJournalEntries(maxPages?: number): Promise<JournalEntry[]> {
  return getAllPages<JournalEntry>('/journal', undefined, maxPages);
}

/** Gets journal entry. */
export async function getJournalEntry(id: number): Promise<ApiResponse<JournalEntry>> {
  return get<ApiResponse<JournalEntry>>(`/journal/${id}`);
}

/** Creates journal entry. */
export async function createJournalEntry(
  data: JournalCreateInput
): Promise<ApiResponse<JournalEntry>> {
  return post<ApiResponse<JournalEntry>>('/journal', data);
}

/** Executes the update journal entry operation. */
export async function updateJournalEntry(
  id: number,
  data: JournalUpdateInput
): Promise<ApiResponse<JournalEntry>> {
  return put<ApiResponse<JournalEntry>>(`/journal/${id}`, data);
}

/** Executes the delete journal entry operation. */
export async function deleteJournalEntry(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/journal/${id}`);
}
