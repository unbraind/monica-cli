import type {
  DeleteResponse,
  LifeEvent,
  LifeEventCreateInput,
  LifeEventListResponse,
  LifeEventResponse,
  LifeEventUpdateInput,
} from '../types';
import { del, get, getAllPages, post, put } from './client';

/** Executes the list life events operation. */
export function listLifeEvents(params?: { page?: number; limit?: number; sort?: string }): Promise<LifeEventListResponse> {
  return get<LifeEventListResponse>('/lifeevents', params);
}

/** Executes the list all life events operation. */
export function listAllLifeEvents(params?: { sort?: string }, maxPages?: number): Promise<LifeEvent[]> {
  return getAllPages<LifeEvent>('/lifeevents', params, maxPages);
}

/** Gets life event. */
export function getLifeEvent(id: number): Promise<LifeEventResponse> {
  return get<LifeEventResponse>(`/lifeevents/${id}`);
}

/** Creates life event. */
export function createLifeEvent(data: LifeEventCreateInput): Promise<LifeEventResponse> {
  return post<LifeEventResponse>('/lifeevents', data);
}

/** Executes the update life event operation. */
export function updateLifeEvent(id: number, data: LifeEventUpdateInput): Promise<LifeEventResponse> {
  return put<LifeEventResponse>(`/lifeevents/${id}`, data);
}

/** Executes the delete life event operation. */
export function deleteLifeEvent(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/lifeevents/${id}`);
}
