export interface Note {
  id: number;
  object: string;
  body: string;
  is_favorited: boolean;
  favorited_at: string | null;
  url?: string;
  account?: { id: number };
  contact?: {
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
      birthdate?: {
        is_age_based: boolean | null;
        is_year_unknown: boolean | null;
        date: string | null;
      };
      deceased_date?: {
        is_age_based: boolean | null;
        is_year_unknown: boolean | null;
        date: string | null;
      };
      avatar?: {
        url: string | null;
        source: string | null;
        default_avatar_color?: string;
      };
    };
    url?: string;
    account?: { id: number };
  };
  created_at: string;
  updated_at: string;
}

export interface NoteCreateInput {
  body: string;
  contact_id: number;
  is_favorited: number;
}

export interface NoteUpdateInput extends NoteCreateInput {}
