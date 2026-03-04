import type { AuditLog, PaginatedResponse } from '../types';
import { get } from './client';

export async function listAuditLogs(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<AuditLog>> {
  return get<PaginatedResponse<AuditLog>>('/logs', params);
}

export async function listContactAuditLogs(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<AuditLog>> {
  return get<PaginatedResponse<AuditLog>>(`/contacts/${contactId}/logs`, params);
}
