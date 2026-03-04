import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as addresses from '../src/api/addresses';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('addresses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAddresses', () => {
    it('calls GET /addresses with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await addresses.listAddresses({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/addresses', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllAddresses', () => {
    it('calls getAllPages /addresses', async () => {
      const mockAddresses = [{ id: 1, object: 'address' }];
      mockGetAllPages.mockResolvedValue(mockAddresses);

      const result = await addresses.listAllAddresses(5);

      expect(mockGetAllPages).toHaveBeenCalledWith('/addresses', undefined, 5);
      expect(result).toEqual(mockAddresses);
    });
  });

  describe('getAddress', () => {
    it('calls GET /addresses/:id', async () => {
      const mockAddress = { id: 1, object: 'address', city: 'Vienna' };
      mockGet.mockResolvedValue({ data: mockAddress });

      const result = await addresses.getAddress(1);

      expect(mockGet).toHaveBeenCalledWith('/addresses/1');
      expect(result.data).toEqual(mockAddress);
    });
  });

  describe('listContactAddresses', () => {
    it('calls GET /contacts/:id/addresses', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      await addresses.listContactAddresses(1, { page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/contacts/1/addresses', { page: 1, limit: 10 });
    });
  });

  describe('createAddress', () => {
    it('calls POST /addresses with data', async () => {
      const mockAddress = { id: 1, object: 'address', city: 'Vienna' };
      mockPost.mockResolvedValue({ data: mockAddress });

      const input = {
        contact_id: 1,
        city: 'Vienna',
        country_id: 'AT',
      };
      const result = await addresses.createAddress(input);

      expect(mockPost).toHaveBeenCalledWith('/addresses', input);
      expect(result.data).toEqual(mockAddress);
    });
  });

  describe('updateAddress', () => {
    it('calls PUT /addresses/:id with data', async () => {
      const mockAddress = { id: 1, object: 'address', city: 'Berlin' };
      mockPut.mockResolvedValue({ data: mockAddress });

      const input = { city: 'Berlin' };
      const result = await addresses.updateAddress(1, input);

      expect(mockPut).toHaveBeenCalledWith('/addresses/1', input);
      expect(result.data).toEqual(mockAddress);
    });
  });

  describe('deleteAddress', () => {
    it('calls DELETE /addresses/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await addresses.deleteAddress(1);

      expect(mockDel).toHaveBeenCalledWith('/addresses/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });
});
