import type {
  Relationship,
  RelationshipType,
  RelationshipTypeGroup,
  RelationshipCreateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del } from './client';
import type { RelationshipUpdateInput } from '../types';

/** Executes the update relationship operation. */
export async function updateRelationship(
  id: number,
  data: RelationshipUpdateInput
): Promise<ApiResponse<Relationship>> {
  return put<ApiResponse<Relationship>>(`/relationships/${id}`, data);
}

/** Executes the list relationships operation. */
export async function listRelationships(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Relationship>> {
  return get<PaginatedResponse<Relationship>>(`/contacts/${contactId}/relationships`, params);
}

/** Gets relationship. */
export async function getRelationship(id: number): Promise<ApiResponse<Relationship>> {
  return get<ApiResponse<Relationship>>(`/relationships/${id}`);
}

/** Creates relationship. */
export async function createRelationship(
  data: RelationshipCreateInput
): Promise<ApiResponse<Relationship>> {
  return post<ApiResponse<Relationship>>('/relationships', data);
}

/** Executes the delete relationship operation. */
export async function deleteRelationship(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/relationships/${id}`);
}

/** Executes the list relationship types operation. */
export async function listRelationshipTypes(): Promise<ApiResponse<RelationshipType[]>> {
  return get<ApiResponse<RelationshipType[]>>('/relationshiptypes');
}

/** Gets relationship type. */
export async function getRelationshipType(id: number): Promise<ApiResponse<RelationshipType>> {
  return get<ApiResponse<RelationshipType>>(`/relationshiptypes/${id}`);
}

/** Executes the list relationship type groups operation. */
export async function listRelationshipTypeGroups(): Promise<ApiResponse<RelationshipTypeGroup[]>> {
  return get<ApiResponse<RelationshipTypeGroup[]>>('/relationshiptypegroups');
}

/** Gets relationship type group. */
export async function getRelationshipTypeGroup(id: number): Promise<ApiResponse<RelationshipTypeGroup>> {
  return get<ApiResponse<RelationshipTypeGroup>>(`/relationshiptypegroups/${id}`);
}
