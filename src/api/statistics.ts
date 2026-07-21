import type { InstanceStatistics } from '../types';
import { get } from './client';

/** Gets instance statistics. */
export function getInstanceStatistics(): Promise<InstanceStatistics[]> {
  return get<InstanceStatistics[]>('/statistics');
}
