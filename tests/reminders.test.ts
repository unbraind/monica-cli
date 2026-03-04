import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as reminders from '../src/api/reminders';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('reminders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listReminders', () => {
    it('calls GET /reminders with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await reminders.listReminders({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/reminders', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getReminder', () => {
    it('calls GET /reminders/:id', async () => {
      const mockReminder = { id: 1, object: 'reminder', title: 'Test reminder' };
      mockGet.mockResolvedValue({ data: mockReminder });
      
      const result = await reminders.getReminder(1);
      
      expect(mockGet).toHaveBeenCalledWith('/reminders/1');
      expect(result.data).toEqual(mockReminder);
    });
  });

  describe('createReminder', () => {
    it('calls POST /reminders with data', async () => {
      const mockReminder = { id: 1, object: 'reminder', title: 'Test reminder' };
      mockPost.mockResolvedValue({ data: mockReminder });
      
      const input = {
        title: 'Test reminder',
        next_expected_date: '2024-06-15',
        frequency_type: 'year' as const,
        contact_id: 1,
      };
      const result = await reminders.createReminder(input);
      
      expect(mockPost).toHaveBeenCalledWith('/reminders', input);
      expect(result.data).toEqual(mockReminder);
    });
  });

  describe('updateReminder', () => {
    it('calls PUT /reminders/:id with data', async () => {
      const mockReminder = { id: 1, object: 'reminder', title: 'Updated reminder' };
      mockPut.mockResolvedValue({ data: mockReminder });
      
      const input = {
        title: 'Updated reminder',
        next_expected_date: '2024-06-15',
        frequency_type: 'month' as const,
        contact_id: 1,
      };
      const result = await reminders.updateReminder(1, input);
      
      expect(mockPut).toHaveBeenCalledWith('/reminders/1', input);
      expect(result.data).toEqual(mockReminder);
    });
  });

  describe('deleteReminder', () => {
    it('calls DELETE /reminders/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await reminders.deleteReminder(1);
      
      expect(mockDel).toHaveBeenCalledWith('/reminders/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('listContactReminders', () => {
    it('calls GET /contacts/:id/reminders', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await reminders.listContactReminders(1);
      
      expect(mockGet).toHaveBeenCalledWith('/contacts/1/reminders', undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllReminders', () => {
    it('calls getAllPages for /reminders', async () => {
      const mockReminders = [{ id: 1 }, { id: 2 }];
      mockGetAllPages.mockResolvedValue(mockReminders);
      
      const result = await reminders.listAllReminders();
      
      expect(mockGetAllPages).toHaveBeenCalledWith('/reminders', undefined, undefined);
      expect(result).toEqual(mockReminders);
    });
  });
});
