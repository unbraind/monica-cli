export interface Call {
  id: number;
  object: string;
  called_at: string;
  content: string | null;
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
    gender: string;
    is_partial: boolean;
    account?: { id: number };
  };
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface CallCreateInput {
  content: string;
  contact_id: number;
  called_at: string;
}

export interface CallUpdateInput extends CallCreateInput {}

export interface Document {
  id: number;
  object: string;
  name: string;
  original_filename: string;
  new_filename: string;
  filesize: number;
  type: string;
  number_downloads: number;
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
    gender: string;
    is_partial: boolean;
    account?: { id: number };
  };
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface Gift {
  id: number;
  object: string;
  name: string;
  comment: string | null;
  url: string | null;
  amount: string | null;
  amount_with_currency: string | null;
  status: 'idea' | 'offered' | 'received';
  date: string | null;
  recipient?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
  };
  photos?: {
    id: number;
    object: string;
    new_filename: string;
  }[];
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
    gender: string;
    is_partial: boolean;
    account?: { id: number };
  };
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface GiftCreateInput {
  contact_id: number;
  recipient_id?: number;
  name: string;
  comment?: string;
  url?: string;
  amount?: number;
  status: 'idea' | 'offered' | 'received';
  date?: string;
}

export interface GiftUpdateInput extends GiftCreateInput {}

export interface Group {
  id: number;
  object: string;
  name: string;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface GroupCreateInput {
  name: string;
}

export interface GroupUpdateInput extends GroupCreateInput {}

export interface JournalEntry {
  id: number;
  object: string;
  title: string;
  post: string;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface JournalCreateInput {
  title?: string;
  post: string;
}

export interface JournalUpdateInput extends JournalCreateInput {}

export interface Occupation {
  id: number;
  object: string;
  company: string | null;
  job: string | null;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
    gender: string;
    is_partial: boolean;
    account?: { id: number };
  };
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface OccupationCreateInput {
  contact_id: number;
  company?: string;
  job?: string;
  active?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface OccupationUpdateInput extends OccupationCreateInput {}

export interface Photo {
  id: number;
  object: string;
  original_filename: string;
  new_filename: string;
  filesize: number;
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
    gender: string;
    is_partial: boolean;
    account?: { id: number };
  };
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: number;
  object: string;
  in_debt: string;
  status: string;
  amount: number;
  reason: string | null;
  owed_at: string | null;
  settled_at: string | null;
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
    gender: string;
    is_partial: boolean;
    account?: { id: number };
  };
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface DebtCreateInput {
  contact_id: number;
  in_debt: 'yes' | 'no';
  status: 'inprogress' | 'complete';
  amount: number;
  reason?: string;
}

export interface DebtUpdateInput extends DebtCreateInput {}

export interface Relationship {
  id: number;
  object: string;
  relationship_type: {
    id: number;
    object: string;
    name: string;
    name_reverse_relationship: string;
  };
  contact_is_partial: boolean;
  account?: { id: number };
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
    gender: string;
    is_partial: boolean;
    account?: { id: number };
  };
  created_at: string;
  updated_at: string;
}

export interface RelationshipCreateInput {
  contact_id: number;
  related_contact_id: number;
  relationship_type_id: number;
}

export interface RelationshipUpdateInput {
  relationship_type_id: number;
}

export interface AddressCreateInput {
  contact_id: number;
  name?: string;
  street?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country_id?: string;
  latitude?: number;
  longitude?: number;
}

export interface AddressUpdateInput extends AddressCreateInput {}
