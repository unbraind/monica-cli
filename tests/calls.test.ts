import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as calls from '../src/api/calls';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('calls API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCalls', () => {
    it('calls GET /calls with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await calls.listCalls({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/calls', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllCalls', () => {
    it('calls getAllPages /calls', async () => {
      const mockCalls = [{ id: 1, object: 'call' }];
      mockGetAllPages.mockResolvedValue(mockCalls);

      const result = await calls.listAllCalls(5);

      expect(mockGetAllPages).toHaveBeenCalledWith('/calls', undefined, 5);
      expect(result).toEqual(mockCalls);
    });
  });

  describe('getCall', () => {
    it('calls GET /calls/:id', async () => {
      const mockCall = { id: 1, object: 'call', content: 'Test call' };
      mockGet.mockResolvedValue({ data: mockCall });

      const result = await calls.getCall(1);

      expect(mockGet).toHaveBeenCalledWith('/calls/1');
      expect(result.data).toEqual(mockCall);
    });
  });

  describe('listContactCalls', () => {
    it('calls GET /contacts/:id/calls', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      await calls.listContactCalls(1, { page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/contacts/1/calls', { page: 1, limit: 10 });
    });
  });

  describe('createCall', () => {
    it('calls POST /calls with data', async () => {
      const mockCall = { id: 1, object: 'call', content: 'Test' };
      mockPost.mockResolvedValue({ data: mockCall });

      const input = { contact_id: 1, content: 'Test call', called_at: '2024-01-15' };
      const result = await calls.createCall(input);

      expect(mockPost).toHaveBeenCalledWith('/calls', input);
      expect(result.data).toEqual(mockCall);
    });
  });

  describe('updateCall', () => {
    it('calls PUT /calls/:id with data', async () => {
      const mockCall = { id: 1, object: 'call', content: 'Updated' };
      mockPut.mockResolvedValue({ data: mockCall });

      const input = { content: 'Updated call', called_at: '2024-01-15' };
      const result = await calls.updateCall(1, input);

      expect(mockPut).toHaveBeenCalledWith('/calls/1', input);
      expect(result.data).toEqual(mockCall);
    });
  });

  describe('deleteCall', () => {
    it('calls DELETE /calls/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await calls.deleteCall(1);

      expect(mockDel).toHaveBeenCalledWith('/calls/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });
});
