import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as journal from '../src/api/journal';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('journal API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listJournalEntries', () => {
    it('calls GET /journal with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await journal.listJournalEntries({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/journal', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllJournalEntries', () => {
    it('calls getAllPages /journal', async () => {
      const mockEntries = [{ id: 1, object: 'journalentry' }];
      mockGetAllPages.mockResolvedValue(mockEntries);

      const result = await journal.listAllJournalEntries(5);

      expect(mockGetAllPages).toHaveBeenCalledWith('/journal', undefined, 5);
      expect(result).toEqual(mockEntries);
    });
  });

  describe('getJournalEntry', () => {
    it('calls GET /journal/:id', async () => {
      const mockEntry = { id: 1, object: 'journalentry', title: 'Test' };
      mockGet.mockResolvedValue({ data: mockEntry });

      const result = await journal.getJournalEntry(1);

      expect(mockGet).toHaveBeenCalledWith('/journal/1');
      expect(result.data).toEqual(mockEntry);
    });
  });

  describe('createJournalEntry', () => {
    it('calls POST /journal with data', async () => {
      const mockEntry = { id: 1, object: 'journalentry', title: 'Test' };
      mockPost.mockResolvedValue({ data: mockEntry });

      const input = { title: 'Test entry', post: 'Content here' };
      const result = await journal.createJournalEntry(input);

      expect(mockPost).toHaveBeenCalledWith('/journal', input);
      expect(result.data).toEqual(mockEntry);
    });
  });

  describe('updateJournalEntry', () => {
    it('calls PUT /journal/:id with data', async () => {
      const mockEntry = { id: 1, object: 'journalentry', title: 'Updated' };
      mockPut.mockResolvedValue({ data: mockEntry });

      const input = { title: 'Updated entry' };
      const result = await journal.updateJournalEntry(1, input);

      expect(mockPut).toHaveBeenCalledWith('/journal/1', input);
      expect(result.data).toEqual(mockEntry);
    });
  });

  describe('deleteJournalEntry', () => {
    it('calls DELETE /journal/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await journal.deleteJournalEntry(1);

      expect(mockDel).toHaveBeenCalledWith('/journal/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });
});
