import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as notes from '../src/api/notes';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('notes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listNotes', () => {
    it('calls GET /notes with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await notes.listNotes({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/notes', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getNote', () => {
    it('calls GET /notes/:id', async () => {
      const mockNote = { id: 1, object: 'note', body: 'Test note' };
      mockGet.mockResolvedValue({ data: mockNote });
      
      const result = await notes.getNote(1);
      
      expect(mockGet).toHaveBeenCalledWith('/notes/1');
      expect(result.data).toEqual(mockNote);
    });
  });

  describe('createNote', () => {
    it('calls POST /notes with data', async () => {
      const mockNote = { id: 1, object: 'note', body: 'Test note' };
      mockPost.mockResolvedValue({ data: mockNote });
      
      const input = { body: 'Test note', contact_id: 1, is_favorited: 0 };
      const result = await notes.createNote(input);
      
      expect(mockPost).toHaveBeenCalledWith('/notes', input);
      expect(result.data).toEqual(mockNote);
    });
  });

  describe('updateNote', () => {
    it('calls PUT /notes/:id with data', async () => {
      const mockNote = { id: 1, object: 'note', body: 'Updated note' };
      mockPut.mockResolvedValue({ data: mockNote });
      
      const input = { body: 'Updated note', contact_id: 1, is_favorited: 1 };
      const result = await notes.updateNote(1, input);
      
      expect(mockPut).toHaveBeenCalledWith('/notes/1', input);
      expect(result.data).toEqual(mockNote);
    });
  });

  describe('deleteNote', () => {
    it('calls DELETE /notes/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await notes.deleteNote(1);
      
      expect(mockDel).toHaveBeenCalledWith('/notes/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('listContactNotes', () => {
    it('calls GET /contacts/:id/notes', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await notes.listContactNotes(1);
      
      expect(mockGet).toHaveBeenCalledWith('/contacts/1/notes', undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllNotes', () => {
    it('calls getAllPages for /notes', async () => {
      const mockNotes = [{ id: 1 }, { id: 2 }];
      mockGetAllPages.mockResolvedValue(mockNotes);
      
      const result = await notes.listAllNotes();
      
      expect(mockGetAllPages).toHaveBeenCalledWith('/notes', undefined, undefined);
      expect(result).toEqual(mockNotes);
    });
  });
});
