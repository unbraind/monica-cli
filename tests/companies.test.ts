import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as companies from '../src/api/companies';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('companies API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCompanies', () => {
    it('calls GET /companies with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await companies.listCompanies({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/companies', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCompany', () => {
    it('calls GET /companies/:id', async () => {
      const mockCompany = { id: 1, object: 'company', name: 'Test Corp' };
      mockGet.mockResolvedValue({ data: mockCompany });
      
      const result = await companies.getCompany(1);
      
      expect(mockGet).toHaveBeenCalledWith('/companies/1');
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('createCompany', () => {
    it('calls POST /companies with data', async () => {
      const mockCompany = { id: 1, object: 'company', name: 'Test Corp' };
      mockPost.mockResolvedValue({ data: mockCompany });
      
      const input = { name: 'Test Corp', website: 'https://test.com' };
      const result = await companies.createCompany(input);
      
      expect(mockPost).toHaveBeenCalledWith('/companies', input);
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('updateCompany', () => {
    it('calls PUT /companies/:id with data', async () => {
      const mockCompany = { id: 1, object: 'company', name: 'Updated Corp' };
      mockPut.mockResolvedValue({ data: mockCompany });
      
      const input = { name: 'Updated Corp' };
      const result = await companies.updateCompany(1, input);
      
      expect(mockPut).toHaveBeenCalledWith('/companies/1', input);
      expect(result.data).toEqual(mockCompany);
    });
  });

  describe('deleteCompany', () => {
    it('calls DELETE /companies/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await companies.deleteCompany(1);
      
      expect(mockDel).toHaveBeenCalledWith('/companies/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('listAllCompanies', () => {
    it('calls getAllPages for /companies', async () => {
      const mockCompanies = [{ id: 1 }, { id: 2 }];
      mockGetAllPages.mockResolvedValue(mockCompanies);
      
      const result = await companies.listAllCompanies();
      
      expect(mockGetAllPages).toHaveBeenCalledWith('/companies', undefined, undefined);
      expect(result).toEqual(mockCompanies);
    });
  });
});
