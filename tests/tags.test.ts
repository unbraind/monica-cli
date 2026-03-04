import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as tags from '../src/api/tags';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('tags API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTags', () => {
    it('calls GET /tags with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await tags.listTags({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/tags', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTag', () => {
    it('calls GET /tags/:id', async () => {
      const mockTag = { id: 1, object: 'tag', name: 'family' };
      mockGet.mockResolvedValue({ data: mockTag });
      
      const result = await tags.getTag(1);
      
      expect(mockGet).toHaveBeenCalledWith('/tags/1');
      expect(result.data).toEqual(mockTag);
    });
  });

  describe('createTag', () => {
    it('calls POST /tags with data', async () => {
      const mockTag = { id: 1, object: 'tag', name: 'family' };
      mockPost.mockResolvedValue({ data: mockTag });
      
      const input = { name: 'family' };
      const result = await tags.createTag(input);
      
      expect(mockPost).toHaveBeenCalledWith('/tags', input);
      expect(result.data).toEqual(mockTag);
    });
  });

  describe('updateTag', () => {
    it('calls PUT /tags/:id with data', async () => {
      const mockTag = { id: 1, object: 'tag', name: 'friends' };
      mockPut.mockResolvedValue({ data: mockTag });
      
      const input = { name: 'friends' };
      const result = await tags.updateTag(1, input);
      
      expect(mockPut).toHaveBeenCalledWith('/tags/1', input);
      expect(result.data).toEqual(mockTag);
    });
  });

  describe('deleteTag', () => {
    it('calls DELETE /tags/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await tags.deleteTag(1);
      
      expect(mockDel).toHaveBeenCalledWith('/tags/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('setContactTags', () => {
    it('calls POST /contacts/:id/setTags', async () => {
      mockPost.mockResolvedValue({ success: true });
      
      const result = await tags.setContactTags(1, ['family', 'friend']);
      
      expect(mockPost).toHaveBeenCalledWith('/contacts/1/setTags', { tags: ['family', 'friend'] });
    });
  });

  describe('unsetContactTag', () => {
    it('calls POST /contacts/:id/unsetTag', async () => {
      mockPost.mockResolvedValue({ success: true });
      
      await tags.unsetContactTag(1, [1, 2]);
      
      expect(mockPost).toHaveBeenCalledWith('/contacts/1/unsetTag', { tags: [1, 2] });
    });
  });

  describe('unsetAllContactTags', () => {
    it('calls POST /contacts/:id/unsetTags', async () => {
      mockPost.mockResolvedValue({ success: true });
      
      await tags.unsetAllContactTags(1);
      
      expect(mockPost).toHaveBeenCalledWith('/contacts/1/unsetTags');
    });
  });

  describe('listContactsByTag', () => {
    it('calls GET /tags/:id/contacts', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await tags.listContactsByTag(1);
      
      expect(mockGet).toHaveBeenCalledWith('/tags/1/contacts', undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllTags', () => {
    it('calls getAllPages for /tags', async () => {
      const mockTags = [{ id: 1 }, { id: 2 }];
      mockGetAllPages.mockResolvedValue(mockTags);
      
      const result = await tags.listAllTags();
      
      expect(mockGetAllPages).toHaveBeenCalledWith('/tags', undefined, undefined);
      expect(result).toEqual(mockTags);
    });
  });
});
