import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as conversations from '../src/api/conversations';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('conversations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listConversations', () => {
    it('calls GET /conversations with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await conversations.listConversations({ page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/conversations', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getConversation', () => {
    it('calls GET /conversations/:id', async () => {
      const mockConversation = { id: 1, object: 'conversation', happened_at: '2023-01-01' };
      mockGet.mockResolvedValue({ data: mockConversation });

      const result = await conversations.getConversation(1);

      expect(mockGet).toHaveBeenCalledWith('/conversations/1');
      expect(result.data).toEqual(mockConversation);
    });
  });

  describe('createConversation', () => {
    it('calls POST /conversations with data', async () => {
      const mockConversation = { id: 1, object: 'conversation', happened_at: '2023-01-01' };
      mockPost.mockResolvedValue({ data: mockConversation });

      const input = {
        contact_id: 1,
        happened_at: '2023-01-01',
        contact_field_type_id: 1,
      };
      const result = await conversations.createConversation(input);

      expect(mockPost).toHaveBeenCalledWith('/conversations', input);
      expect(result.data).toEqual(mockConversation);
    });
  });

  describe('updateConversation', () => {
    it('calls PUT /conversations/:id with data', async () => {
      const mockConversation = { id: 1, object: 'conversation', happened_at: '2023-01-01' };
      mockPut.mockResolvedValue({ data: mockConversation });

      const input = {
        happened_at: '2023-01-02',
      };
      const result = await conversations.updateConversation(1, input);

      expect(mockPut).toHaveBeenCalledWith('/conversations/1', input);
      expect(result.data).toEqual(mockConversation);
    });
  });

  describe('deleteConversation', () => {
    it('calls DELETE /conversations/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await conversations.deleteConversation(1);

      expect(mockDel).toHaveBeenCalledWith('/conversations/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('listContactConversations', () => {
    it('calls GET /contacts/:id/conversations', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await conversations.listContactConversations(1, { page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/contacts/1/conversations', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listConversationMessages', () => {
    it('calls GET /conversations/:id/messages', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await conversations.listConversationMessages(1, { page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/conversations/1/messages', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createConversationMessage', () => {
    it('calls POST /conversations/:id/messages with data', async () => {
      const mockMessage = { id: 1, object: 'message', body: 'Hello' };
      mockPost.mockResolvedValue({ data: mockMessage });

      const input = { 
        content: 'Hello',
        written_at: '2023-01-01',
        written_by_me: true,
        contact_id: 1,
      };
      const result = await conversations.createConversationMessage(1, input);

      expect(mockPost).toHaveBeenCalledWith('/conversations/1/messages', input);
      expect(result.data).toEqual(mockMessage);
    });
  });

  describe('listAllConversations', () => {
    it('calls getAllPages for /conversations', async () => {
      const mockConversations = [
        { id: 1, object: 'conversation' },
        { id: 2, object: 'conversation' },
      ];
      mockGetAllPages.mockResolvedValue(mockConversations);

      const result = await conversations.listAllConversations(5);

      expect(mockGetAllPages).toHaveBeenCalledWith('/conversations', undefined, 5);
      expect(result).toEqual(mockConversations);
    });
  });

  describe('updateConversationMessage', () => {
    it('calls PUT /conversations/:id/messages/:messageId', async () => {
      const mockMessage = { id: 1, object: 'message', body: 'Updated' };
      mockPut.mockResolvedValue({ data: mockMessage });

      const input = { content: 'Updated message' };
      const result = await conversations.updateConversationMessage(1, 2, input);

      expect(mockPut).toHaveBeenCalledWith('/conversations/1/messages/2', input);
      expect(result.data).toEqual(mockMessage);
    });
  });

  describe('deleteConversationMessage', () => {
    it('calls DELETE /conversations/:id/messages/:messageId', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 2 });

      const result = await conversations.deleteConversationMessage(1, 2);

      expect(mockDel).toHaveBeenCalledWith('/conversations/1/messages/2');
      expect(result).toEqual({ deleted: true, id: 2 });
    });
  });
});
