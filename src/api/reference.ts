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

export async function getUser(): Promise<ApiResponse<User>> {
  return get<ApiResponse<User>>('/me');
}

export async function listGenders(): Promise<PaginatedResponse<Gender>> {
  return get<PaginatedResponse<Gender>>('/genders');
}

export async function getGender(id: number): Promise<ApiResponse<Gender>> {
  return get<ApiResponse<Gender>>(`/genders/${id}`);
}

export async function createGender(data: GenderCreateInput): Promise<ApiResponse<Gender>> {
  return post<ApiResponse<Gender>>('/genders', data);
}

export async function updateGender(id: number, data: GenderUpdateInput): Promise<ApiResponse<Gender>> {
  return put<ApiResponse<Gender>>(`/genders/${id}`, data);
}

export async function deleteGender(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/genders/${id}`);
}

export async function listCountries(): Promise<ApiResponse<Record<string, Country>>> {
  return get<ApiResponse<Record<string, Country>>>('/countries');
}

export async function listCurrencies(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Currency>> {
  return get<PaginatedResponse<Currency>>('/currencies', params);
}

export async function getCurrency(id: number): Promise<ApiResponse<Currency>> {
  return get<ApiResponse<Currency>>(`/currencies/${id}`);
}

export async function listActivityTypes(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<ActivityType>> {
  return get<PaginatedResponse<ActivityType>>('/activitytypes', params);
}

export async function getActivityType(id: number): Promise<ApiResponse<ActivityType>> {
  return get<ApiResponse<ActivityType>>(`/activitytypes/${id}`);
}

export async function createActivityType(data: ActivityTypeCreateInput): Promise<ApiResponse<ActivityType>> {
  return post<ApiResponse<ActivityType>>('/activitytypes', data);
}

export async function updateActivityType(id: number, data: ActivityTypeUpdateInput): Promise<ApiResponse<ActivityType>> {
  return put<ApiResponse<ActivityType>>(`/activitytypes/${id}`, data);
}

export async function deleteActivityType(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/activitytypes/${id}`);
}

export async function listActivityTypeCategories(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<ActivityTypeCategory>> {
  return get<PaginatedResponse<ActivityTypeCategory>>('/activitytypecategories', params);
}

export async function getActivityTypeCategory(id: number): Promise<ApiResponse<ActivityTypeCategory>> {
  return get<ApiResponse<ActivityTypeCategory>>(`/activitytypecategories/${id}`);
}

export async function createActivityTypeCategory(data: ActivityTypeCategoryCreateInput): Promise<ApiResponse<ActivityTypeCategory>> {
  return post<ApiResponse<ActivityTypeCategory>>('/activitytypecategories', data);
}

export async function updateActivityTypeCategory(id: number, data: ActivityTypeCategoryUpdateInput): Promise<ApiResponse<ActivityTypeCategory>> {
  return put<ApiResponse<ActivityTypeCategory>>(`/activitytypecategories/${id}`, data);
}

export async function deleteActivityTypeCategory(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/activitytypecategories/${id}`);
}

export async function listContactFieldTypes(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<ContactFieldType>> {
  return get<PaginatedResponse<ContactFieldType>>('/contactfieldtypes', params);
}

export async function getContactFieldType(id: number): Promise<ApiResponse<ContactFieldType>> {
  return get<ApiResponse<ContactFieldType>>(`/contactfieldtypes/${id}`);
}

export async function createContactFieldType(data: ContactFieldTypeCreateInput): Promise<ApiResponse<ContactFieldType>> {
  return post<ApiResponse<ContactFieldType>>('/contactfieldtypes', data);
}

export async function updateContactFieldType(id: number, data: ContactFieldTypeUpdateInput): Promise<ApiResponse<ContactFieldType>> {
  return put<ApiResponse<ContactFieldType>>(`/contactfieldtypes/${id}`, data);
}

export async function deleteContactFieldType(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/contactfieldtypes/${id}`);
}

export async function listContactFields(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<ContactField>> {
  return get<PaginatedResponse<ContactField>>(`/contacts/${contactId}/contactfields`, params);
}

export async function listAllContactFields(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<ContactField>> {
  return get<PaginatedResponse<ContactField>>('/contactfields', params);
}

export async function getContactField(id: number): Promise<ApiResponse<ContactField>> {
  return get<ApiResponse<ContactField>>(`/contactfields/${id}`);
}

export async function createContactField(
  data: ContactFieldCreateInput
): Promise<ApiResponse<ContactField>> {
  return post<ApiResponse<ContactField>>('/contactfields', data);
}

export async function updateContactField(
  id: number,
  data: ContactFieldUpdateInput
): Promise<ApiResponse<ContactField>> {
  return put<ApiResponse<ContactField>>(`/contactfields/${id}`, data);
}

export async function deleteContactField(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/contactfields/${id}`);
}

export async function listCompliance(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Term>> {
  return get<PaginatedResponse<Term>>('/compliance', params);
}

export async function getCompliance(id: number): Promise<ApiResponse<Term>> {
  return get<ApiResponse<Term>>(`/compliance/${id}`);
}

export async function getUserComplianceStatus(): Promise<ApiResponse<ComplianceStatus[]>> {
  return get<ApiResponse<ComplianceStatus[]>>('/me/compliance');
}

export async function getUserComplianceStatusForTerm(id: number): Promise<ApiResponse<ComplianceStatus>> {
  return get<ApiResponse<ComplianceStatus>>(`/me/compliance/${id}`);
}

export async function signCompliance(data: ComplianceSignInput): Promise<ApiResponse<ComplianceStatus>> {
  return post<ApiResponse<ComplianceStatus>>('/me/compliance', data);
}
