import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
  MonicaApiError: class MonicaApiError extends Error {
    public readonly errorCode: number;
    public readonly statusCode: number;
    
    constructor(message: string, errorCode: number, statusCode: number) {
      super(message);
      this.errorCode = errorCode;
      this.statusCode = statusCode;
    }
  },
}));

import * as client from '../src/api/client';
import * as groups from '../src/api/groups';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('groups API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listGroups', () => {
    it('calls GET /groups with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await groups.listGroups({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/groups', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllGroups', () => {
    it('calls getAllPages /groups', async () => {
      const mockGroups = [{ id: 1, object: 'group' }];
      mockGetAllPages.mockResolvedValue(mockGroups);

      const result = await groups.listAllGroups(5);

      expect(mockGetAllPages).toHaveBeenCalledWith('/groups', undefined, 5);
      expect(result).toEqual(mockGroups);
    });
  });

  describe('getGroup', () => {
    it('calls GET /groups/:id', async () => {
      const mockGroup = { id: 1, object: 'group', name: 'Test Group' };
      mockGet.mockResolvedValue({ data: mockGroup });

      const result = await groups.getGroup(1);

      expect(mockGet).toHaveBeenCalledWith('/groups/1');
      expect(result.data).toEqual(mockGroup);
    });
  });

  describe('createGroup', () => {
    it('calls POST /groups with data', async () => {
      const mockGroup = { id: 1, object: 'group', name: 'Test Group' };
      mockPost.mockResolvedValue({ data: mockGroup });

      const input = { name: 'Test Group' };
      const result = await groups.createGroup(input);

      expect(mockPost).toHaveBeenCalledWith('/groups', input);
      expect(result.data).toEqual(mockGroup);
    });
  });

  describe('updateGroup', () => {
    it('calls PUT /groups/:id with data', async () => {
      const mockGroup = { id: 1, object: 'group', name: 'Updated Group' };
      mockPut.mockResolvedValue({ data: mockGroup });

      const input = { name: 'Updated Group' };
      const result = await groups.updateGroup(1, input);

      expect(mockPut).toHaveBeenCalledWith('/groups/1', input);
      expect(result.data).toEqual(mockGroup);
    });
  });

  describe('deleteGroup', () => {
    it('calls DELETE /groups/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await groups.deleteGroup(1);

      expect(mockDel).toHaveBeenCalledWith('/groups/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('attachContactsToGroup', () => {
    it('calls POST /groups/:id/attachContacts', async () => {
      mockPost.mockResolvedValue({ success: true });

      const result = await groups.attachContactsToGroup(1, { contacts: [1, 2, 3] });

      expect(mockPost).toHaveBeenCalledWith('/groups/1/attachContacts', { contacts: [1, 2, 3] });
      expect(result).toEqual({ success: true });
    });

    it('falls back to POST /groups/:id/attach when attachContacts is unavailable', async () => {
      mockPost
        .mockRejectedValueOnce({ statusCode: 404, message: 'HTTP 404' })
        .mockResolvedValueOnce({ success: true });

      const result = await groups.attachContactsToGroup(1, { contacts: [1, 2, 3] });

      expect(mockPost).toHaveBeenNthCalledWith(1, '/groups/1/attachContacts', { contacts: [1, 2, 3] });
      expect(mockPost).toHaveBeenNthCalledWith(2, '/groups/1/attach', { contacts: [1, 2, 3] });
      expect(result).toEqual({ success: true });
    });

    it('does not fall back when attachContacts fails with non-404', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));
      await expect(groups.attachContactsToGroup(1, { contacts: [1, 2, 3] })).rejects.toThrow('Network error');
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('detachContactsFromGroup', () => {
    it('calls POST /groups/:id/detachContacts', async () => {
      mockPost.mockResolvedValue({ success: true });

      const result = await groups.detachContactsFromGroup(1, { contacts: [1, 2] });

      expect(mockPost).toHaveBeenCalledWith('/groups/1/detachContacts', { contacts: [1, 2] });
      expect(result).toEqual({ success: true });
    });

    it('falls back to POST /groups/:id/detach when detachContacts is unavailable', async () => {
      mockPost
        .mockRejectedValueOnce({ statusCode: 404, message: 'HTTP 404' })
        .mockResolvedValueOnce({ success: true });

      const result = await groups.detachContactsFromGroup(1, { contacts: [1, 2] });

      expect(mockPost).toHaveBeenNthCalledWith(1, '/groups/1/detachContacts', { contacts: [1, 2] });
      expect(mockPost).toHaveBeenNthCalledWith(2, '/groups/1/detach', { contacts: [1, 2] });
      expect(result).toEqual({ success: true });
    });

    it('does not fall back when detachContacts fails with non-404', async () => {
      mockPost.mockRejectedValueOnce(new Error('Bad request'));
      await expect(groups.detachContactsFromGroup(1, { contacts: [1, 2] })).rejects.toThrow('Bad request');
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });
});
