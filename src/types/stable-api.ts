import type { ApiResponse, PaginatedResponse } from './common';
import type { Country } from './reference';

/** Account identifier embedded by Monica resources. */
export interface AccountReference {
  id: number;
}

/** Compact contact representation embedded by Monica resources. */
export interface ContactReference {
  id: number;
  object?: 'contact';
  first_name?: string;
  last_name?: string | null;
}

/** Describes the place data contract. */
export interface Place {
  id: number;
  object: 'place';
  street: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  country: Country | null;
  account: AccountReference;
  created_at: string;
  updated_at: string;
}

/** Describes the place input data contract. */
export interface PlaceInput {
  street?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/** Describes the life event data contract. */
export interface LifeEvent {
  id: number;
  uuid: string;
  object: 'lifeevent';
  name: string | null;
  note: string | null;
  happened_at: string;
  life_event_type: { id: number; name: string };
  contact: ContactReference;
  account: AccountReference;
  created_at: string;
  updated_at: string;
}

/** Describes the life event create input data contract. */
export interface LifeEventCreateInput {
  contact_id: number;
  life_event_type_id: number;
  happened_at: string;
  name?: string;
  note?: string;
  has_reminder: boolean;
  happened_at_month_unknown: boolean;
  happened_at_day_unknown: boolean;
}

/** Describes the life event update input data contract. */
export interface LifeEventUpdateInput {
  life_event_type_id: number;
  happened_at: string;
  name?: string;
  note?: string;
}

/** Describes the instance statistics data contract. */
export interface InstanceStatistics {
  instance_creation_date: string;
  number_of_contacts: number;
  number_of_users: number;
  number_of_activities: number;
  number_of_reminders: number;
  number_of_new_users_last_week: number;
}

/** Describes the reminder outbox data contract. */
export interface ReminderOutbox {
  id: number;
  reminder_id: number;
  object: string;
  planned_date: string;
  title: string;
  description: string | null;
  frequency_type: string;
  frequency_number: number | null;
  initial_date: string;
  delible: boolean;
  account: AccountReference;
  contact: ContactReference;
  created_at: string;
  updated_at: string;
}

/** Describes the place list response data contract. */
export type PlaceListResponse = PaginatedResponse<Place>;
/** Describes the place response data contract. */
export type PlaceResponse = ApiResponse<Place>;
/** Describes the life event list response data contract. */
export type LifeEventListResponse = PaginatedResponse<LifeEvent>;
/** Describes the life event response data contract. */
export type LifeEventResponse = ApiResponse<LifeEvent>;
