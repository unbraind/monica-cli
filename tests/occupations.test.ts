import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as occupations from '../src/api/occupations';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('occupations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listOccupations', () => {
    it('calls GET /occupations with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await occupations.listOccupations({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/occupations', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllOccupations', () => {
    it('calls getAllPages /occupations', async () => {
      const mockOccupations = [{ id: 1, object: 'occupation' }];
      mockGetAllPages.mockResolvedValue(mockOccupations);

      const result = await occupations.listAllOccupations(5);

      expect(mockGetAllPages).toHaveBeenCalledWith('/occupations', undefined, 5);
      expect(result).toEqual(mockOccupations);
    });
  });

  describe('getOccupation', () => {
    it('calls GET /occupations/:id', async () => {
      const mockOccupation = { id: 1, object: 'occupation', title: 'Developer' };
      mockGet.mockResolvedValue({ data: mockOccupation });

      const result = await occupations.getOccupation(1);

      expect(mockGet).toHaveBeenCalledWith('/occupations/1');
      expect(result.data).toEqual(mockOccupation);
    });
  });

  describe('listContactOccupations', () => {
    it('calls GET /contacts/:id/occupations', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      await occupations.listContactOccupations(1, { page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/contacts/1/occupations', { page: 1, limit: 10 });
    });
  });

  describe('createOccupation', () => {
    it('calls POST /occupations with data', async () => {
      const mockOccupation = { id: 1, object: 'occupation', title: 'Developer' };
      mockPost.mockResolvedValue({ data: mockOccupation });

      const input = {
        contact_id: 1,
        title: 'Developer',
        company_id: 1,
      };
      const result = await occupations.createOccupation(input);

      expect(mockPost).toHaveBeenCalledWith('/occupations', input);
      expect(result.data).toEqual(mockOccupation);
    });
  });

  describe('updateOccupation', () => {
    it('calls PUT /occupations/:id with data', async () => {
      const mockOccupation = { id: 1, object: 'occupation', title: 'Senior Developer' };
      mockPut.mockResolvedValue({ data: mockOccupation });

      const input = { title: 'Senior Developer' };
      const result = await occupations.updateOccupation(1, input);

      expect(mockPut).toHaveBeenCalledWith('/occupations/1', input);
      expect(result.data).toEqual(mockOccupation);
    });
  });

  describe('deleteOccupation', () => {
    it('calls DELETE /occupations/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await occupations.deleteOccupation(1);

      expect(mockDel).toHaveBeenCalledWith('/occupations/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });
});
