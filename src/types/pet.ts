export interface PetCategory {
  id: number;
  object: string;
  name: string;
  is_common: boolean;
}

export interface Pet {
  id: number;
  uuid: string;
  object: string;
  name: string;
  pet_category: PetCategory;
  account?: { id: number };
  contact?: {
    id: number;
    uuid: string;
    object: string;
    hash_id: string;
    first_name: string;
    last_name: string | null;
    nickname: string | null;
    complete_name: string;
    initials: string;
    gender: string;
    gender_type: string;
    is_starred: boolean;
    is_partial: boolean;
    is_active: boolean;
    is_dead: boolean;
    is_me: boolean;
    information?: {
      birthdate?: { is_age_based: boolean; is_year_unknown: boolean; date: string | null };
      deceased_date?: { is_age_based: boolean | null; is_year_unknown: boolean | null; date: string | null };
      avatar?: { url: string; source: string; default_avatar_color: string };
    };
    url: string;
    account?: { id: number };
  };
  created_at: string;
  updated_at: string;
}

export interface PetCreateInput {
  contact_id: number;
  name: string;
  pet_category_id: number;
}

export interface PetUpdateInput {
  name?: string;
  pet_category_id?: number;
}
