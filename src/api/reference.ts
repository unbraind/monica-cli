import type {
  Gender,
  GenderCreateInput,
  GenderUpdateInput,
  Country,
  Currency,
  ActivityType,
  ActivityTypeCreateInput,
  ActivityTypeUpdateInput,
  ActivityTypeCategory,
  ActivityTypeCategoryCreateInput,
  ActivityTypeCategoryUpdateInput,
  ContactFieldType,
  ContactFieldTypeCreateInput,
  ContactFieldTypeUpdateInput,
  ContactField,
  ContactFieldCreateInput,
  ContactFieldUpdateInput,
  User,
  Term,
  ComplianceStatus,
  ComplianceSignInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del } from './client';

/** Gets user. */
export async function getUser(): Promise<ApiResponse<User>> {
  return get<ApiResponse<User>>('/me');
}

/** Executes the set me contact operation. */
export async function setMeContact(contactId: number): Promise<string[]> {
  return post<string[]>('/me/contact', { contact_id: contactId });
}

/** Executes the unset me contact operation. */
export async function unsetMeContact(): Promise<string[]> {
  return del<string[]>('/me/contact');
}

/** Executes the list genders operation. */
export async function listGenders(): Promise<PaginatedResponse<Gender>> {
  return get<PaginatedResponse<Gender>>('/genders');
}

/** Gets gender. */
export async function getGender(id: number): Promise<ApiResponse<Gender>> {
  return get<ApiResponse<Gender>>(`/genders/${id}`);
}

/** Creates gender. */
export async function createGender(data: GenderCreateInput): Promise<ApiResponse<Gender>> {
  return post<ApiResponse<Gender>>('/genders', data);
}

/** Executes the update gender operation. */
export async function updateGender(id: number, data: GenderUpdateInput): Promise<ApiResponse<Gender>> {
  return put<ApiResponse<Gender>>(`/genders/${id}`, data);
}

/** Executes the delete gender operation. */
export async function deleteGender(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/genders/${id}`);
}

/** Executes the list countries operation. */
export async function listCountries(): Promise<ApiResponse<Record<string, Country>>> {
  return get<ApiResponse<Record<string, Country>>>('/countries');
}

/** Executes the list currencies operation. */
export async function listCurrencies(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Currency>> {
  return get<PaginatedResponse<Currency>>('/currencies', params);
}

/** Gets currency. */
export async function getCurrency(id: number): Promise<ApiResponse<Currency>> {
  return get<ApiResponse<Currency>>(`/currencies/${id}`);
}

/** Executes the list activity types operation. */
export async function listActivityTypes(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<ActivityType>> {
  return get<PaginatedResponse<ActivityType>>('/activitytypes', params);
}

/** Gets activity type. */
export async function getActivityType(id: number): Promise<ApiResponse<ActivityType>> {
  return get<ApiResponse<ActivityType>>(`/activitytypes/${id}`);
}

/** Creates activity type. */
export async function createActivityType(data: ActivityTypeCreateInput): Promise<ApiResponse<ActivityType>> {
  return post<ApiResponse<ActivityType>>('/activitytypes', data);
}

/** Executes the update activity type operation. */
export async function updateActivityType(id: number, data: ActivityTypeUpdateInput): Promise<ApiResponse<ActivityType>> {
  return put<ApiResponse<ActivityType>>(`/activitytypes/${id}`, data);
}

/** Executes the delete activity type operation. */
export async function deleteActivityType(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/activitytypes/${id}`);
}

/** Executes the list activity type categories operation. */
export async function listActivityTypeCategories(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<ActivityTypeCategory>> {
  return get<PaginatedResponse<ActivityTypeCategory>>('/activitytypecategories', params);
}

/** Gets activity type category. */
export async function getActivityTypeCategory(id: number): Promise<ApiResponse<ActivityTypeCategory>> {
  return get<ApiResponse<ActivityTypeCategory>>(`/activitytypecategories/${id}`);
}

/** Creates activity type category. */
export async function createActivityTypeCategory(data: ActivityTypeCategoryCreateInput): Promise<ApiResponse<ActivityTypeCategory>> {
  return post<ApiResponse<ActivityTypeCategory>>('/activitytypecategories', data);
}

/** Executes the update activity type category operation. */
export async function updateActivityTypeCategory(id: number, data: ActivityTypeCategoryUpdateInput): Promise<ApiResponse<ActivityTypeCategory>> {
  return put<ApiResponse<ActivityTypeCategory>>(`/activitytypecategories/${id}`, data);
}

/** Executes the delete activity type category operation. */
export async function deleteActivityTypeCategory(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/activitytypecategories/${id}`);
}

/** Executes the list contact field types operation. */
export async function listContactFieldTypes(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<ContactFieldType>> {
  return get<PaginatedResponse<ContactFieldType>>('/contactfieldtypes', params);
}

/** Gets contact field type. */
export async function getContactFieldType(id: number): Promise<ApiResponse<ContactFieldType>> {
  return get<ApiResponse<ContactFieldType>>(`/contactfieldtypes/${id}`);
}

/** Creates contact field type. */
export async function createContactFieldType(data: ContactFieldTypeCreateInput): Promise<ApiResponse<ContactFieldType>> {
  return post<ApiResponse<ContactFieldType>>('/contactfieldtypes', data);
}

/** Executes the update contact field type operation. */
export async function updateContactFieldType(id: number, data: ContactFieldTypeUpdateInput): Promise<ApiResponse<ContactFieldType>> {
  return put<ApiResponse<ContactFieldType>>(`/contactfieldtypes/${id}`, data);
}

/** Executes the delete contact field type operation. */
export async function deleteContactFieldType(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/contactfieldtypes/${id}`);
}

/** Executes the list contact fields operation. */
export async function listContactFields(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<ContactField>> {
  return get<PaginatedResponse<ContactField>>(`/contacts/${contactId}/contactfields`, params);
}

/** Executes the list all contact fields operation. */
export async function listAllContactFields(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<ContactField>> {
  return get<PaginatedResponse<ContactField>>('/contactfields', params);
}

/** Gets contact field. */
export async function getContactField(id: number): Promise<ApiResponse<ContactField>> {
  return get<ApiResponse<ContactField>>(`/contactfields/${id}`);
}

/** Creates contact field. */
export async function createContactField(
  data: ContactFieldCreateInput
): Promise<ApiResponse<ContactField>> {
  return post<ApiResponse<ContactField>>('/contactfields', data);
}

/** Executes the update contact field operation. */
export async function updateContactField(
  id: number,
  data: ContactFieldUpdateInput
): Promise<ApiResponse<ContactField>> {
  return put<ApiResponse<ContactField>>(`/contactfields/${id}`, data);
}

/** Executes the delete contact field operation. */
export async function deleteContactField(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/contactfields/${id}`);
}

/** Executes the list compliance operation. */
export async function listCompliance(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Term>> {
  return get<PaginatedResponse<Term>>('/compliance', params);
}

/** Gets compliance. */
export async function getCompliance(id: number): Promise<ApiResponse<Term>> {
  return get<ApiResponse<Term>>(`/compliance/${id}`);
}

/** Gets user compliance status. */
export async function getUserComplianceStatus(): Promise<ApiResponse<ComplianceStatus[]>> {
  return get<ApiResponse<ComplianceStatus[]>>('/me/compliance');
}

/** Gets user compliance status for term. */
export async function getUserComplianceStatusForTerm(id: number): Promise<ApiResponse<ComplianceStatus>> {
  return get<ApiResponse<ComplianceStatus>>(`/me/compliance/${id}`);
}

/** Executes the sign compliance operation. */
export async function signCompliance(data: ComplianceSignInput): Promise<ApiResponse<ComplianceStatus>> {
  return post<ApiResponse<ComplianceStatus>>('/me/compliance', data);
}
