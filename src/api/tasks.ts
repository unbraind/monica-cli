import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  PaginatedResponse,
  ApiResponse,
  DeleteResponse,
} from '../types';
import { get, post, put, del, getAllPages } from './client';

/** Executes the list tasks operation. */
export async function listTasks(params?: {
  limit?: number;
  page?: number;
  sort?: string;
}): Promise<PaginatedResponse<Task>> {
  return get<PaginatedResponse<Task>>('/tasks', params);
}

/** Executes the list all tasks operation. */
export async function listAllTasks(
  params?: { sort?: string },
  maxPages?: number
): Promise<Task[]> {
  return getAllPages<Task>('/tasks', params, maxPages);
}

/** Gets task. */
export async function getTask(id: number): Promise<ApiResponse<Task>> {
  return get<ApiResponse<Task>>(`/tasks/${id}`);
}

/** Creates task. */
export async function createTask(data: TaskCreateInput): Promise<ApiResponse<Task>> {
  return post<ApiResponse<Task>>('/tasks', data);
}

/** Executes the update task operation. */
export async function updateTask(id: number, data: TaskUpdateInput): Promise<ApiResponse<Task>> {
  return put<ApiResponse<Task>>(`/tasks/${id}`, data);
}

/** Executes the delete task operation. */
export async function deleteTask(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/tasks/${id}`);
}

/** Executes the list contact tasks operation. */
export async function listContactTasks(
  contactId: number,
  params?: { limit?: number; page?: number }
): Promise<PaginatedResponse<Task>> {
  return get<PaginatedResponse<Task>>(`/contacts/${contactId}/tasks`, params);
}
