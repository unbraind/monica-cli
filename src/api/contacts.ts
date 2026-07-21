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
  ContactAvatarSource,
} from '../types';
import { get, post, put, del, getAllPages, MonicaApiError } from './client';

async function useLegacyRouteOnMissing<T>(primary: () => Promise<T>, legacy: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    if (error instanceof MonicaApiError && (error.statusCode === 404 || error.statusCode === 405)) {
      return legacy();
    }
    throw error;
  }
}

/** Executes the list contacts operation. */
export async function listContacts(params?: {
  limit?: number;
  page?: number;
  query?: string;
  sort?: string;
}): Promise<PaginatedResponse<Contact>> {
  return get<PaginatedResponse<Contact>>('/contacts', params);
}

/** Executes the list all contacts operation. */
export async function listAllContacts(
  params?: { query?: string; sort?: string },
  maxPages?: number
): Promise<Contact[]> {
  return getAllPages<Contact>('/contacts', params, maxPages);
}

/** Gets contact. */
export async function getContact(
  id: number,
  withFields?: 'contactfields'
): Promise<ApiResponse<Contact>> {
  const params = withFields ? { with: withFields } : undefined;
  return get<ApiResponse<Contact>>(`/contacts/${id}`, params);
}

/** Creates contact. */
export async function createContact(data: ContactCreateInput): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>('/contacts', data);
}

/** Executes the update contact operation. */
export async function updateContact(
  id: number,
  data: ContactUpdateInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}`, data);
}

/** Executes the delete contact operation. */
export async function deleteContact(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/contacts/${id}`);
}

/** Executes the search contacts operation. */
export async function searchContacts(
  query: string,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Contact>> {
  return get<PaginatedResponse<Contact>>('/contacts', { ...params, query });
}

/** Executes the update contact career operation. */
export async function updateContactCareer(
  id: number,
  data: { job?: string; company?: string }
): Promise<ApiResponse<Contact>> {
  return useLegacyRouteOnMissing(
    () => put<ApiResponse<Contact>>(`/contacts/${id}/work`, data),
    () => put<ApiResponse<Contact>>(`/contacts/${id}/career`, data)
  );
}

/** Gets contact logs. */
export async function getContactLogs(
  id: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<AuditLog>> {
  return get<PaginatedResponse<AuditLog>>(`/contacts/${id}/logs`, params);
}

/** Gets contact fields. */
export async function getContactFields(
  id: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<ContactField>> {
  return get<PaginatedResponse<ContactField>>(`/contacts/${id}/contactfields`, params);
}

/** Gets contact activities. */
export async function getContactActivities(id: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Activity>> {
  return get<PaginatedResponse<Activity>>(`/contacts/${id}/activities`, params);
}

/** Gets contact notes. */
export async function getContactNotes(id: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Note>> {
  return get<PaginatedResponse<Note>>(`/contacts/${id}/notes`, params);
}

/** Gets contact tasks. */
export async function getContactTasks(id: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Task>> {
  return get<PaginatedResponse<Task>>(`/contacts/${id}/tasks`, params);
}

/** Gets contact reminders. */
export async function getContactReminders(id: number, params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Reminder>> {
  return get<PaginatedResponse<Reminder>>(`/contacts/${id}/reminders`, params);
}

/** Describes the birthdate input data contract. */
export interface BirthdateInput {
  birthdate_date: string;
  birthdate_is_age_based?: boolean;
  birthdate_is_year_unknown?: boolean;
  birthdate_age?: number;
}

/** Executes the update contact birthdate operation. */
export async function updateContactBirthdate(
  id: number,
  data: BirthdateInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/birthdate`, data);
}

/** Describes the deceased date input data contract. */
export interface DeceasedDateInput {
  is_deceased: boolean;
  is_deceased_date_known?: boolean;
  deceased_date_date?: string;
  deceased_date_is_age_based?: boolean;
  deceased_date_is_year_unknown?: boolean;
  deceased_date_age?: number;
  is_deceased_add_reminder?: boolean;
}

/** Executes the update contact deceased date operation. */
export async function updateContactDeceasedDate(
  id: number,
  data: DeceasedDateInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/deceasedDate`, data);
}

/** Describes the stay in touch input data contract. */
export interface StayInTouchInput {
  stay_in_touch_frequency?: number;
  stay_in_touch_trigger_date?: string;
}

/** Executes the update contact stay in touch operation. */
export async function updateContactStayInTouch(
  id: number,
  data: StayInTouchInput
): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>(`/contacts/${id}/stayInTouch`, data);
}

/** Describes the first met input data contract. */
export interface FirstMetInput {
  first_met_date?: string;
  first_met_date_is_age_based?: boolean;
  first_met_date_is_year_unknown?: boolean;
  first_met_age?: number;
  first_met_through_contact_id?: number;
  first_met_general_information?: string;
}

/** Executes the update contact first met operation. */
export async function updateContactFirstMet(
  id: number,
  data: FirstMetInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/firstMet`, data);
}

/** Describes the food preferences input data contract. */
export interface FoodPreferencesInput {
  food_preferences: string;
}

/** Executes the update contact food preferences operation. */
export async function updateContactFoodPreferences(
  id: number,
  data: FoodPreferencesInput
): Promise<ApiResponse<Contact>> {
  return useLegacyRouteOnMissing(
    () => put<ApiResponse<Contact>>(`/contacts/${id}/food`, data),
    () => put<ApiResponse<Contact>>(`/contacts/${id}/foodpreferences`, data)
  );
}

/** Describes the contact introduction input data contract. */
export interface ContactIntroductionInput {
  met_through_contact_id?: number;
  general_information?: string;
  where?: string;
  is_date_known: boolean;
  is_age_based?: boolean;
  day?: number;
  month?: number;
  year?: number;
  age?: number;
  add_reminder?: boolean;
}

/** Executes the update contact introduction operation. */
export async function updateContactIntroduction(
  id: number,
  data: ContactIntroductionInput
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/introduction`, data);
}

/** Executes the update contact avatar operation. */
export async function updateContactAvatar(
  id: number,
  source: ContactAvatarSource,
  photoId?: number
): Promise<ApiResponse<Contact>> {
  return put<ApiResponse<Contact>>(`/contacts/${id}/avatar`, { source, photo_id: photoId });
}

/** Executes the set contact avatar operation. */
export async function setContactAvatar(
  id: number,
  avatarUrl: string
): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>(`/contacts/${id}/avatar`, { avatar: avatarUrl });
}

/** Executes the delete contact avatar operation. */
export async function deleteContactAvatar(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/contacts/${id}/avatar`);
}
