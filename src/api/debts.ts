import type {
  Debt,
  DebtCreateInput,
  DebtUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listDebts(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Debt>> {
  return get<PaginatedResponse<Debt>>('/debts', params);
}

export async function listAllDebts(maxPages?: number): Promise<Debt[]> {
  return getAllPages<Debt>('/debts', undefined, maxPages);
}

export async function getDebt(id: number): Promise<ApiResponse<Debt>> {
  return get<ApiResponse<Debt>>(`/debts/${id}`);
}

export async function createDebt(data: DebtCreateInput): Promise<ApiResponse<Debt>> {
  return post<ApiResponse<Debt>>('/debts', data);
}

export async function updateDebt(id: number, data: DebtUpdateInput): Promise<ApiResponse<Debt>> {
  return put<ApiResponse<Debt>>(`/debts/${id}`, data);
}

export async function deleteDebt(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/debts/${id}`);
}
