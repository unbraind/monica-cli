import type {
  Conversation,
  ConversationCreateInput,
  ConversationUpdateInput,
  ConversationMessage,
  ConversationMessageCreateInput,
  ConversationMessageUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listConversations(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Conversation>> {
  return get<PaginatedResponse<Conversation>>('/conversations', params);
}

export async function listAllConversations(maxPages?: number): Promise<Conversation[]> {
  return getAllPages<Conversation>('/conversations', undefined, maxPages);
}

export async function getConversation(id: number): Promise<ApiResponse<Conversation>> {
  return get<ApiResponse<Conversation>>(`/conversations/${id}`);
}

export async function listContactConversations(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Conversation>> {
  return get<PaginatedResponse<Conversation>>(`/contacts/${contactId}/conversations`, params);
}

export async function createConversation(
  data: ConversationCreateInput
): Promise<ApiResponse<Conversation>> {
  return post<ApiResponse<Conversation>>('/conversations', data);
}

export async function updateConversation(
  id: number,
  data: ConversationUpdateInput
): Promise<ApiResponse<Conversation>> {
  return put<ApiResponse<Conversation>>(`/conversations/${id}`, data);
}

export async function deleteConversation(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/conversations/${id}`);
}

export async function listConversationMessages(
  conversationId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<ConversationMessage>> {
  return get<PaginatedResponse<ConversationMessage>>(
    `/conversations/${conversationId}/messages`,
    params
  );
}

export async function createConversationMessage(
  conversationId: number,
  data: ConversationMessageCreateInput
): Promise<ApiResponse<ConversationMessage>> {
  return post<ApiResponse<ConversationMessage>>(
    `/conversations/${conversationId}/messages`,
    data
  );
}

export async function updateConversationMessage(
  conversationId: number,
  messageId: number,
  data: ConversationMessageUpdateInput
): Promise<ApiResponse<ConversationMessage>> {
  return put<ApiResponse<ConversationMessage>>(
    `/conversations/${conversationId}/messages/${messageId}`,
    data
  );
}

export async function deleteConversationMessage(
  conversationId: number,
  messageId: number
): Promise<DeleteResponse> {
  return del<DeleteResponse>(
    `/conversations/${conversationId}/messages/${messageId}`
  );
}
