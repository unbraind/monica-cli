import type { AuditLog, PaginatedResponse } from '../types';
import { get } from './client';

/** Executes the list audit logs operation. */
export async function listAuditLogs(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<AuditLog>> {
  return get<PaginatedResponse<AuditLog>>('/logs', params);
}

/** Executes the list contact audit logs operation. */
export async function listContactAuditLogs(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<AuditLog>> {
  return get<PaginatedResponse<AuditLog>>(`/contacts/${contactId}/logs`, params);
}
