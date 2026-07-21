/** Describes the activity type category data contract. */
export interface ActivityTypeCategory {
  id: number;
  object: string;
  name: string;
  account?: { id: number };
  created_at: string | null;
  updated_at: string | null;
}

/** Describes the activity type category create input data contract. */
export interface ActivityTypeCategoryCreateInput {
  name: string;
}

/** Describes the activity type category update input data contract. */
export interface ActivityTypeCategoryUpdateInput extends ActivityTypeCategoryCreateInput {}

/** Describes the activity type data contract. */
export interface ActivityType {
  id: number;
  object: string;
  name: string;
  location_type: string | null;
  activity_type_category: ActivityTypeCategory | null;
  account?: { id: number };
  created_at: string | null;
  updated_at: string | null;
}

/** Describes the activity type create input data contract. */
export interface ActivityTypeCreateInput {
  name: string;
  activity_type_category_id: number;
}

/** Describes the activity type update input data contract. */
export interface ActivityTypeUpdateInput extends ActivityTypeCreateInput {}

/** Describes the activity attendee data contract. */
export interface ActivityAttendee {
  total: number;
  contacts: Array<{
    id: number;
    object: string;
    hash_id?: string;
    first_name: string;
    last_name: string | null;
    nickname?: string;
    complete_name?: string;
    initials?: string;
    gender: string;
    gender_type?: string;
    is_partial: boolean;
    is_dead?: boolean;
    is_me?: boolean;
    information?: {
      dates?: Array<{
        name: string;
        is_birthdate_approximate: string;
        birthdate: string | null;
      }>;
    };
    account?: { id: number };
  }>;
}

/** Describes the activity data contract. */
export interface Activity {
  id: number;
  object: string;
  summary: string;
  description: string | null;
  happened_at: string;
  activity_type: ActivityType | null;
  attendees: ActivityAttendee;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

/** Describes the activity create input data contract. */
export interface ActivityCreateInput {
  activity_type_id: number;
  summary: string;
  description?: string;
  happened_at: string;
  contacts: number[];
  emotions?: number[];
}

/** Describes the activity update input data contract. */
export interface ActivityUpdateInput extends ActivityCreateInput {}

/** Describes the emotion type data contract. */
export interface EmotionType {
  id: number;
  object: string;
  name: string;
  account?: { id: number };
  created_at: string | null;
  updated_at: string | null;
}
