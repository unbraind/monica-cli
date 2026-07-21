/** Describes the call data contract. */
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

/** Describes the call create input data contract. */
export interface CallCreateInput {
  content: string;
  contact_id: number;
  called_at: string;
}

/** Describes the call update input data contract. */
export interface CallUpdateInput extends CallCreateInput {}

/** Describes the document data contract. */
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

/** Describes the gift data contract. */
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

/** Describes the gift create input data contract. */
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

/** Describes the gift update input data contract. */
export interface GiftUpdateInput extends GiftCreateInput {}

/** Describes the group data contract. */
export interface Group {
  id: number;
  object: string;
  name: string;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

/** Describes the group create input data contract. */
export interface GroupCreateInput {
  name: string;
}

/** Describes the group update input data contract. */
export interface GroupUpdateInput extends GroupCreateInput {}

/** Describes the journal entry data contract. */
export interface JournalEntry {
  id: number;
  object: string;
  title: string;
  post: string;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

/** Describes the journal create input data contract. */
export interface JournalCreateInput {
  title?: string;
  post: string;
}

/** Describes the journal update input data contract. */
export interface JournalUpdateInput extends JournalCreateInput {}

/** Describes the occupation data contract. */
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

/** Describes the occupation create input data contract. */
export interface OccupationCreateInput {
  contact_id: number;
  company?: string;
  job?: string;
  active?: boolean;
  start_date?: string;
  end_date?: string;
}

/** Describes the occupation update input data contract. */
export interface OccupationUpdateInput extends OccupationCreateInput {}

/** Describes the photo data contract. */
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

/** Describes the debt data contract. */
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

/** Describes the debt create input data contract. */
export interface DebtCreateInput {
  contact_id: number;
  in_debt: 'yes' | 'no';
  status: 'inprogress' | 'complete';
  amount: number;
  reason?: string;
}

/** Describes the debt update input data contract. */
export interface DebtUpdateInput extends DebtCreateInput {}

/** Describes the relationship data contract. */
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

/** Describes the relationship create input data contract. */
export interface RelationshipCreateInput {
  contact_id: number;
  related_contact_id: number;
  relationship_type_id: number;
}

/** Describes the relationship update input data contract. */
export interface RelationshipUpdateInput {
  relationship_type_id: number;
}

/** Describes the address create input data contract. */
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

/** Describes the address update input data contract. */
export interface AddressUpdateInput extends AddressCreateInput {}
