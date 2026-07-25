import type {
  ApiResponse,
  PaginatedResponse,
  StringDeleteResponse,
  Vault,
  VaultCreateInput,
  VaultPatchInput,
  VaultUpdateInput,
} from '../types';
import { del, get, getAllPages, patch, post, put } from './client';

/** Lists vaults from the current Monica API. */
export function listVaults(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Vault>> {
  return get<PaginatedResponse<Vault>>('/vaults', params);
}

/** Lists all vaults from the current Monica API. */
export function listAllVaults(maxPages?: number): Promise<Vault[]> {
  return getAllPages<Vault>('/vaults', {}, maxPages);
}

/** Gets one vault from the current Monica API. */
export function getVault(id: string): Promise<ApiResponse<Vault>> {
  return get<ApiResponse<Vault>>(`/vaults/${encodeURIComponent(id)}`);
}

/** Creates a vault through the current Monica API. */
export function createVault(data: VaultCreateInput): Promise<ApiResponse<Vault>> {
  return post<ApiResponse<Vault>>('/vaults', data);
}

/** Replaces a vault through the current Monica API. */
export function updateVault(id: string, data: VaultUpdateInput): Promise<ApiResponse<Vault>> {
  return put<ApiResponse<Vault>>(`/vaults/${encodeURIComponent(id)}`, data);
}

/** Partially updates a vault through the current Monica API. */
export function patchVault(id: string, data: VaultPatchInput): Promise<ApiResponse<Vault>> {
  return patch<ApiResponse<Vault>>(`/vaults/${encodeURIComponent(id)}`, data);
}

/** Deletes a vault through the current Monica API. */
export function deleteVault(id: string): Promise<StringDeleteResponse> {
  return del<StringDeleteResponse>(`/vaults/${encodeURIComponent(id)}`);
}
