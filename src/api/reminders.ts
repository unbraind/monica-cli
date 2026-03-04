import type {
  Reminder,
  ReminderCreateInput,
  ReminderUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listReminders(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Reminder>> {
  return get<PaginatedResponse<Reminder>>('/reminders', params);
}

export async function listAllReminders(maxPages?: number): Promise<Reminder[]> {
  return getAllPages<Reminder>('/reminders', undefined, maxPages);
}

export async function getReminder(id: number): Promise<ApiResponse<Reminder>> {
  return get<ApiResponse<Reminder>>(`/reminders/${id}`);
}

export async function createReminder(data: ReminderCreateInput): Promise<ApiResponse<Reminder>> {
  return post<ApiResponse<Reminder>>('/reminders', data);
}

export async function updateReminder(
  id: number,
  data: ReminderUpdateInput
): Promise<ApiResponse<Reminder>> {
  return put<ApiResponse<Reminder>>(`/reminders/${id}`, data);
}

export async function deleteReminder(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/reminders/${id}`);
}

export async function listContactReminders(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Reminder>> {
  return get<PaginatedResponse<Reminder>>(`/contacts/${contactId}/reminders`, params);
}
