import type {
  Tag,
  TagCreateInput,
  TagUpdateInput,
  SetTagsInput,
  UnsetTagInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
  Contact,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listTags(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Tag>> {
  return get<PaginatedResponse<Tag>>('/tags', params);
}

export async function listAllTags(maxPages?: number): Promise<Tag[]> {
  return getAllPages<Tag>('/tags', undefined, maxPages);
}

export async function getTag(id: number): Promise<ApiResponse<Tag>> {
  return get<ApiResponse<Tag>>(`/tags/${id}`);
}

export async function createTag(data: TagCreateInput): Promise<ApiResponse<Tag>> {
  return post<ApiResponse<Tag>>('/tags', data);
}

export async function updateTag(id: number, data: TagUpdateInput): Promise<ApiResponse<Tag>> {
  return put<ApiResponse<Tag>>(`/tags/${id}`, data);
}

export async function deleteTag(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/tags/${id}`);
}

export async function setContactTags(
  contactId: number,
  tags: string[]
): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>(`/contacts/${contactId}/setTags`, { tags });
}

export async function unsetContactTag(
  contactId: number,
  tagIds: number[]
): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>(`/contacts/${contactId}/unsetTag`, { tags: tagIds });
}

export async function unsetAllContactTags(contactId: number): Promise<ApiResponse<Contact>> {
  return post<ApiResponse<Contact>>(`/contacts/${contactId}/unsetTags`);
}

export async function listContactsByTag(
  tagId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Contact>> {
  return get<PaginatedResponse<Contact>>(`/tags/${tagId}/contacts`, params);
}
