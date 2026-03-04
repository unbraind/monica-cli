import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as activities from '../src/api/activities';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('activities API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listActivities', () => {
    it('calls GET /activities with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await activities.listActivities({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/activities', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getActivity', () => {
    it('calls GET /activities/:id', async () => {
      const mockActivity = { id: 1, object: 'activity', summary: 'Test' };
      mockGet.mockResolvedValue({ data: mockActivity });
      
      const result = await activities.getActivity(1);
      
      expect(mockGet).toHaveBeenCalledWith('/activities/1');
      expect(result.data).toEqual(mockActivity);
    });
  });

  describe('createActivity', () => {
    it('calls POST /activities with data', async () => {
      const mockActivity = { id: 1, object: 'activity', summary: 'Test' };
      mockPost.mockResolvedValue({ data: mockActivity });
      
      const input = {
        activity_type_id: 1,
        summary: 'Test activity',
        happened_at: '2024-01-15',
        contacts: [1, 2],
      };
      const result = await activities.createActivity(input);
      
      expect(mockPost).toHaveBeenCalledWith('/activities', input);
      expect(result.data).toEqual(mockActivity);
    });
  });

  describe('updateActivity', () => {
    it('calls PUT /activities/:id with data', async () => {
      const mockActivity = { id: 1, object: 'activity', summary: 'Updated' };
      mockPut.mockResolvedValue({ data: mockActivity });
      
      const input = {
        activity_type_id: 1,
        summary: 'Updated activity',
        happened_at: '2024-01-15',
        contacts: [1],
      };
      const result = await activities.updateActivity(1, input);
      
      expect(mockPut).toHaveBeenCalledWith('/activities/1', input);
      expect(result.data).toEqual(mockActivity);
    });
  });

  describe('deleteActivity', () => {
    it('calls DELETE /activities/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await activities.deleteActivity(1);
      
      expect(mockDel).toHaveBeenCalledWith('/activities/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('listContactActivities', () => {
    it('calls GET /contacts/:id/activities', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await activities.listContactActivities(1);
      
      expect(mockGet).toHaveBeenCalledWith('/contacts/1/activities', undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllActivities', () => {
    it('calls getAllPages for /activities', async () => {
      const mockActivities = [{ id: 1 }, { id: 2 }];
      mockGetAllPages.mockResolvedValue(mockActivities);
      
      const result = await activities.listAllActivities();
      
      expect(mockGetAllPages).toHaveBeenCalledWith('/activities', undefined, undefined);
      expect(result).toEqual(mockActivities);
    });
  });
});
