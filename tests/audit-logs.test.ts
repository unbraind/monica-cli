import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  setConfig: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as client from '../src/api/client';
import {
  listAuditLogs,
} from '../src/api/audit-logs';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;

describe('audit-logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAuditLogs', () => {
    it('calls GET /logs with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await listAuditLogs({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/logs', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });

    it('calls GET /logs without params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await listAuditLogs();
      
      expect(mockGet).toHaveBeenCalledWith('/logs', undefined);
      expect(result).toEqual(mockResponse);
    });
  });
});
