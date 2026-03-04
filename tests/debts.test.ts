import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as debts from '../src/api/debts';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('debts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listDebts', () => {
    it('calls GET /debts with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await debts.listDebts({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/debts', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllDebts', () => {
    it('calls getAllPages /debts', async () => {
      const mockDebts = [{ id: 1, object: 'debt' }];
      mockGetAllPages.mockResolvedValue(mockDebts);

      const result = await debts.listAllDebts(5);

      expect(mockGetAllPages).toHaveBeenCalledWith('/debts', undefined, 5);
      expect(result).toEqual(mockDebts);
    });
  });

  describe('getDebt', () => {
    it('calls GET /debts/:id', async () => {
      const mockDebt = { id: 1, object: 'debt', amount: 100 };
      mockGet.mockResolvedValue({ data: mockDebt });

      const result = await debts.getDebt(1);

      expect(mockGet).toHaveBeenCalledWith('/debts/1');
      expect(result.data).toEqual(mockDebt);
    });
  });

  describe('createDebt', () => {
    it('calls POST /debts with data', async () => {
      const mockDebt = { id: 1, object: 'debt', amount: 100 };
      mockPost.mockResolvedValue({ data: mockDebt });

      const input = {
        contact_id: 1,
        in_debt: 'yes' as const,
        status: 'inprogress' as const,
        amount: 100,
      };
      const result = await debts.createDebt(input);

      expect(mockPost).toHaveBeenCalledWith('/debts', input);
      expect(result.data).toEqual(mockDebt);
    });
  });

  describe('updateDebt', () => {
    it('calls PUT /debts/:id with data', async () => {
      const mockDebt = { id: 1, object: 'debt', amount: 200 };
      mockPut.mockResolvedValue({ data: mockDebt });

      const input = { amount: 200, status: 'finished' as const };
      const result = await debts.updateDebt(1, input);

      expect(mockPut).toHaveBeenCalledWith('/debts/1', input);
      expect(result.data).toEqual(mockDebt);
    });
  });

  describe('deleteDebt', () => {
    it('calls DELETE /debts/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await debts.deleteDebt(1);

      expect(mockDel).toHaveBeenCalledWith('/debts/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });
});
