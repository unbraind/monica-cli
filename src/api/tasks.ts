import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

export async function listTasks(params?: {
  limit?: number;
  page?: number;
  sort?: string;
}): Promise<PaginatedResponse<Task>> {
  return get<PaginatedResponse<Task>>('/tasks', params);
}

export async function listAllTasks(
  params?: { sort?: string },
  maxPages?: number
): Promise<Task[]> {
  return getAllPages<Task>('/tasks', params, maxPages);
}

export async function getTask(id: number): Promise<ApiResponse<Task>> {
  return get<ApiResponse<Task>>(`/tasks/${id}`);
}

export async function createTask(data: TaskCreateInput): Promise<ApiResponse<Task>> {
  return post<ApiResponse<Task>>('/tasks', data);
}

export async function updateTask(id: number, data: TaskUpdateInput): Promise<ApiResponse<Task>> {
  return put<ApiResponse<Task>>(`/tasks/${id}`, data);
}

export async function deleteTask(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/tasks/${id}`);
}

export async function listContactTasks(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Task>> {
  return get<PaginatedResponse<Task>>(`/contacts/${contactId}/tasks`, params);
}
