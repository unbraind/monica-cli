import type {
  Company,
  CompanyCreateInput,
  CompanyUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listCompanies(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Company>> {
  return get<PaginatedResponse<Company>>('/companies', params);
}

export async function listAllCompanies(maxPages?: number): Promise<Company[]> {
  return getAllPages<Company>('/companies', undefined, maxPages);
}

export async function getCompany(id: number): Promise<ApiResponse<Company>> {
  return get<ApiResponse<Company>>(`/companies/${id}`);
}

export async function createCompany(data: CompanyCreateInput): Promise<ApiResponse<Company>> {
  return post<ApiResponse<Company>>('/companies', data);
}

export async function updateCompany(
  id: number,
  data: CompanyUpdateInput
): Promise<ApiResponse<Company>> {
  return put<ApiResponse<Company>>(`/companies/${id}`, data);
}

export async function deleteCompany(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/companies/${id}`);
}
