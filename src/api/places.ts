import type { DeleteResponse, Place, PlaceInput, PlaceListResponse, PlaceResponse } from '../types';
import { del, get, getAllPages, post, put } from './client';

/** Executes the list places operation. */
export function listPlaces(params?: { page?: number; limit?: number; sort?: string }): Promise<PlaceListResponse> {
  return get<PlaceListResponse>('/places', params);
}

/** Executes the list all places operation. */
export function listAllPlaces(params?: { sort?: string }, maxPages?: number): Promise<Place[]> {
  return getAllPages<Place>('/places', params, maxPages);
}

/** Gets place. */
export function getPlace(id: number): Promise<PlaceResponse> {
  return get<PlaceResponse>(`/places/${id}`);
}

/** Creates place. */
export function createPlace(data: PlaceInput): Promise<PlaceResponse> {
  return post<PlaceResponse>('/places', data);
}

/** Executes the update place operation. */
export function updatePlace(id: number, data: PlaceInput): Promise<PlaceResponse> {
  return put<PlaceResponse>(`/places/${id}`, data);
}

/** Executes the delete place operation. */
export function deletePlace(id: number): Promise<DeleteResponse> {
  return del<DeleteResponse>(`/places/${id}`);
}
