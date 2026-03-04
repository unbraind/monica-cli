export interface SpecialDate {
  is_age_based: boolean | null;
  is_year_unknown: boolean | null;
  date: string | null;
}

export interface ContactDate {
  name: string;
  is_birthdate_approximate: string;
  birthdate: string | null;
}

export interface Avatar {
  url: string | null;
  source: string | null;
  default_avatar_color?: string;
}

export interface RelatedContact {
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
    birthdate?: SpecialDate;
    deceased_date?: SpecialDate;
    avatar?: Avatar;
    dates?: ContactDate[];
  };
  account?: { id: number };
}

export interface RelationshipGroup {
  total: number;
  contacts: Array<{
    relationship?: { id: number; name: string };
    contact: RelatedContact;
  }>;
}

export interface HowYouMet {
  general_information: string | null;
  first_met_date: SpecialDate;
  first_met_through_contact: RelatedContact | null;
}

export interface ContactInformation {
  relationships?: {
    love: RelationshipGroup;
    family: RelationshipGroup;
    friend: RelationshipGroup;
    work: RelationshipGroup;
  };
  dates?: {
    birthdate: SpecialDate;
    deceased_date: SpecialDate;
  };
  career?: {
    job: string | null;
    company: string | null;
  };
  avatar?: Avatar;
  food_preferencies?: string | null;
  food_preferences?: string | null;
  how_you_met?: HowYouMet;
}

export interface ContactStatistics {
  number_of_calls: number;
  number_of_notes: number;
  number_of_activities: number;
  number_of_reminders: number;
  number_of_tasks: number;
  number_of_gifts: number;
  number_of_debts: number;
}

export interface Address {
  id: number;
  object: string;
  name: string | null;
  street: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  country?: {
    id: string;
    object: string;
    name: string;
    iso: string;
  };
  url?: string;
  account?: { id: number };
  contact?: RelatedContact;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  object: string;
  name: string;
  name_slug: string;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  object: string;
  hash_id?: string;
  first_name: string;
  last_name: string | null;
  nickname: string | null;
  complete_name?: string;
  description?: string | null;
  gender: string;
  gender_type?: string;
  is_starred?: boolean;
  is_partial: boolean;
  is_active?: boolean;
  is_dead: boolean;
  is_me?: boolean;
  last_called: string | null;
  last_activity_together: string | null;
  stay_in_touch_frequency: number | null;
  stay_in_touch_trigger_date: string | null;
  information: ContactInformation;
  addresses?: Address[];
  tags?: Tag[];
  statistics?: ContactStatistics;
  contactFields?: import('./reference').ContactField[];
  notes?: import('./note').Note[];
  url?: string;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface ContactCreateInput {
  first_name: string;
  last_name?: string;
  nickname?: string;
  gender_id: number;
  birthdate_day?: number;
  birthdate_month?: number;
  birthdate_year?: number;
  birthdate_is_age_based?: boolean;
  is_birthdate_known: boolean;
  birthdate_age?: number;
  is_partial?: boolean;
  is_deceased: boolean;
  is_deceased_date_known: boolean;
  deceased_date_add_reminder?: boolean;
  deceased_date_day?: number;
  deceased_date_month?: number;
  deceased_date_year?: number;
  deceased_date_is_age_based?: boolean;
  is_starred?: boolean;
}

export interface ContactUpdateInput extends ContactCreateInput {}

export interface ContactSearchInput {
  query: string;
  limit?: number;
  page?: number;
}
