import type {
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
  ContactField,
  AuditLog,
  Activity,
  Note,
  Task,
  Reminder,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listContacts(params?: {
  limit?: number;
  page?: number;
  query?: string;
  sort?: string;
}): Promise<PaginatedResponse<Contact>> {
  return get<PaginatedResponse<Contact>>('/contacts', params);
}

export async function listAllContacts(
  params?: { query?: string; sort?: string },
  maxPages?: number
): Promise<Contact[]> {
  return getAllPages<Contact>('/contacts', params, maxPages);
}

export async function getContact(
  id: number,
  withFields?: 'contactfields'
): Promise<ApiResponse<Contact>> {
  const params = withFields ? { with: withFields } : undefined;
  return get<ApiResponse<Contact>>(`/contacts/${id}`, params);
}

export async function createContact(data: ContactCreateInput): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>('/contacts', data);
}

export async function updateContact(
  id: number,
  data: ContactUpdateInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}`, data);
}

export async function deleteContact(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/contacts/${id}`);
}

export async function searchContacts(
  query: string,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Contact>> {
  return get<PaginatedResponse<Contact>>('/contacts', { ...params, query });
}

export async function updateContactCareer(
  id: number,
  data: { job?: string; company?: string }
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/career`, data);
}

export async function getContactLogs(
  id: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<AuditLog>> {
  return get<PaginatedResponse<AuditLog>>(`/contacts/${id}/logs`, params);
}

export async function getContactFields(
  id: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<ContactField>> {
  return get<PaginatedResponse<ContactField>>(`/contacts/${id}/contactfields`, params);
}

export async function getContactActivities(id: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Activity>> {
  return get<PaginatedResponse<Activity>>(`/contacts/${id}/activities`, params);
}

export async function getContactNotes(id: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Note>> {
  return get<PaginatedResponse<Note>>(`/contacts/${id}/notes`, params);
}

export async function getContactTasks(id: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Task>> {
  return get<PaginatedResponse<Task>>(`/contacts/${id}/tasks`, params);
}

export async function getContactReminders(id: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Reminder>> {
  return get<PaginatedResponse<Reminder>>(`/contacts/${id}/reminders`, params);
}

export interface BirthdateInput {
  birthdate_date: string;
  birthdate_is_age_based?: boolean;
  birthdate_is_year_unknown?: boolean;
  birthdate_age?: number;
}

export async function updateContactBirthdate(
  id: number,
  data: BirthdateInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/birthdate`, data);
}

export interface DeceasedDateInput {
  is_deceased: boolean;
  is_deceased_date_known?: boolean;
  deceased_date_date?: string;
  deceased_date_is_age_based?: boolean;
  deceased_date_is_year_unknown?: boolean;
  deceased_date_age?: number;
  is_deceased_add_reminder?: boolean;
}

export async function updateContactDeceasedDate(
  id: number,
  data: DeceasedDateInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/deceasedDate`, data);
}

export interface StayInTouchInput {
  stay_in_touch_frequency?: number;
  stay_in_touch_trigger_date?: string;
}

export async function updateContactStayInTouch(
  id: number,
  data: StayInTouchInput
): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>(`/contacts/${id}/stayInTouch`, data);
}

export interface FirstMetInput {
  first_met_date?: string;
  first_met_date_is_age_based?: boolean;
  first_met_date_is_year_unknown?: boolean;
  first_met_age?: number;
  first_met_through_contact_id?: number;
  first_met_general_information?: string;
}

export async function updateContactFirstMet(
  id: number,
  data: FirstMetInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/firstMet`, data);
}

export interface FoodPreferencesInput {
  food_preferences: string;
}

export async function updateContactFoodPreferences(
  id: number,
  data: FoodPreferencesInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/foodpreferences`, data);
}

export async function setContactAvatar(
  id: number,
  avatarUrl: string
): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>(`/contacts/${id}/avatar`, { avatar: avatarUrl });
}

export async function deleteContactAvatar(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/contacts/${id}/avatar`);
}
