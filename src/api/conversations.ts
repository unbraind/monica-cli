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

/** Executes the list conversations operation. */
export async function listConversations(params?: {
  limit?: number;
  page?: number;
}): Promise<PaginatedResponse<Conversation>> {
  return get<PaginatedResponse<Conversation>>('/conversations', params);
}

/** Executes the list all conversations operation. */
export async function listAllConversations(maxPages?: number): Promise<Conversation[]> {
  return getAllPages<Conversation>('/conversations', undefined, maxPages);
}

/** Gets conversation. */
export async function getConversation(id: number): Promise<ApiResponse<Conversation>> {
  return get<ApiResponse<Conversation>>(`/conversations/${id}`);
}

/** Executes the list contact conversations operation. */
export async function listContactConversations(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Conversation>> {
  return get<PaginatedResponse<Conversation>>(`/contacts/${contactId}/conversations`, params);
}

/** Creates conversation. */
export async function createConversation(
  data: ConversationCreateInput
): Promise<ApiResponse<Conversation>> {
  return post<ApiResponse<Conversation>>('/conversations', data);
}

/** Executes the update conversation operation. */
export async function updateConversation(
  id: number,
  data: ConversationUpdateInput
): Promise<ApiResponse<Conversation>> {
  return put<ApiResponse<Conversation>>(`/conversations/${id}`, data);
}

/** Executes the delete conversation operation. */
export async function deleteConversation(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/conversations/${id}`);
}

/** Executes the list conversation messages operation. */
export async function listConversationMessages(
  conversationId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<ConversationMessage>> {
  return get<PaginatedResponse<ConversationMessage>>(
    `/conversations/${conversationId}/messages`,
    params
  );
}

/** Creates conversation message. */
export async function createConversationMessage(
  conversationId: number,
  data: ConversationMessageCreateInput
): Promise<ApiResponse<ConversationMessage>> {
  return post<ApiResponse<ConversationMessage>>(
    `/conversations/${conversationId}/messages`,
    data
  );
}

/** Executes the update conversation message operation. */
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

/** Executes the delete conversation message operation. */
export async function deleteConversationMessage(
  conversationId: number,
  messageId: number
): Promise<DeleteResponse> {
  return del<DeleteResponse>(
    `/conversations/${conversationId}/messages/${messageId}`
  );
}
