import type {
  Reminder,
  ReminderCreateInput,
  ReminderUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
  ReminderOutbox,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

/** Executes the list reminders operation. */
export async function listReminders(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Reminder>> {
  return get<PaginatedResponse<Reminder>>('/reminders', params);
}

/** Executes the list all reminders operation. */
export async function listAllReminders(maxPages?: number): Promise<Reminder[]> {
  return getAllPages<Reminder>('/reminders', undefined, maxPages);
}

/** Executes the list upcoming reminders operation. */
export async function listUpcomingReminders(month = 0): Promise<ApiResponse<ReminderOutbox[]>> {
  return get<ApiResponse<ReminderOutbox[]>>(`/reminders/upcoming/${month}`);
}

/** Gets reminder. */
export async function getReminder(id: number): Promise<ApiResponse<Reminder>> {
  return get<ApiResponse<Reminder>>(`/reminders/${id}`);
}

/** Creates reminder. */
export async function createReminder(data: ReminderCreateInput): Promise<ApiResponse<Reminder>> {
  return post<ApiResponse<Reminder>>('/reminders', data);
}

/** Executes the update reminder operation. */
export async function updateReminder(
  id: number,
  data: ReminderUpdateInput
): Promise<ApiResponse<Reminder>> {
  return put<ApiResponse<Reminder>>(`/reminders/${id}`, data);
}

/** Executes the delete reminder operation. */
export async function deleteReminder(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/reminders/${id}`);
}

/** Executes the list contact reminders operation. */
export async function listContactReminders(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Reminder>> {
  return get<PaginatedResponse<Reminder>>(`/contacts/${contactId}/reminders`, params);
}
