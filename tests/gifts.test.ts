import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as gifts from '../src/api/gifts';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('gifts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listGifts', () => {
    it('calls GET /gifts with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await gifts.listGifts({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/gifts', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllGifts', () => {
    it('calls getAllPages /gifts', async () => {
      const mockGifts = [{ id: 1, object: 'gift' }];
      mockGetAllPages.mockResolvedValue(mockGifts);

      const result = await gifts.listAllGifts(5);

      expect(mockGetAllPages).toHaveBeenCalledWith('/gifts', undefined, 5);
      expect(result).toEqual(mockGifts);
    });
  });

  describe('getGift', () => {
    it('calls GET /gifts/:id', async () => {
      const mockGift = { id: 1, object: 'gift', name: 'Test gift' };
      mockGet.mockResolvedValue({ data: mockGift });

      const result = await gifts.getGift(1);

      expect(mockGet).toHaveBeenCalledWith('/gifts/1');
      expect(result.data).toEqual(mockGift);
    });
  });

  describe('listContactGifts', () => {
    it('calls GET /contacts/:id/gifts', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      await gifts.listContactGifts(1, { page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/contacts/1/gifts', { page: 1, limit: 10 });
    });
  });

  describe('createGift', () => {
    it('calls POST /gifts with data', async () => {
      const mockGift = { id: 1, object: 'gift', name: 'Test' };
      mockPost.mockResolvedValue({ data: mockGift });

      const input = { name: 'Test gift', contact_id: 1, status: 'idea' as const };
      const result = await gifts.createGift(input);

      expect(mockPost).toHaveBeenCalledWith('/gifts', input);
      expect(result.data).toEqual(mockGift);
    });
  });

  describe('updateGift', () => {
    it('calls PUT /gifts/:id with data', async () => {
      const mockGift = { id: 1, object: 'gift', name: 'Updated' };
      mockPut.mockResolvedValue({ data: mockGift });

      const input = { name: 'Updated gift', status: 'offered' as const };
      const result = await gifts.updateGift(1, input);

      expect(mockPut).toHaveBeenCalledWith('/gifts/1', input);
      expect(result.data).toEqual(mockGift);
    });
  });

  describe('deleteGift', () => {
    it('calls DELETE /gifts/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await gifts.deleteGift(1);

      expect(mockDel).toHaveBeenCalledWith('/gifts/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('associateGiftPhoto', () => {
    it('calls PUT /gifts/:id/photo/:photoId', async () => {
      const mockGift = { id: 1, object: 'gift', name: 'Test' };
      mockPut.mockResolvedValue({ data: mockGift });

      const result = await gifts.associateGiftPhoto(1, 5);

      expect(mockPut).toHaveBeenCalledWith('/gifts/1/photo/5');
      expect(result.data).toEqual(mockGift);
    });
  });
});
