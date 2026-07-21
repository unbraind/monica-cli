/** Describes the gender data contract. */
export interface Gender {
  id: number;
  object: string;
  name: string;
  type?: string;
  account?: { id: number };
  created_at?: string;
  updated_at?: string;
}

/** Describes the gender create input data contract. */
export interface GenderCreateInput {
  name: string;
}

/** Describes the gender update input data contract. */
export interface GenderUpdateInput extends GenderCreateInput {}

/** Describes the country data contract. */
export interface Country {
  id: string;
  object: string;
  name: string;
  iso: string;
}

/** Describes the currency data contract. */
export interface Currency {
  id: number;
  object: string;
  iso: string;
  name: string;
  symbol: string;
}

/** Describes the contact field type data contract. */
export interface ContactFieldType {
  id: number;
  object: string;
  name: string;
  fontawesome_icon: string | null;
  protocol: string | null;
  delible: boolean;
  type: string | null;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

/** Describes the contact field type create input data contract. */
export interface ContactFieldTypeCreateInput {
  name: string;
  fontawesome_icon?: string;
  protocol?: string;
  delible?: number;
  type?: string | null;
}

/** Describes the contact field type update input data contract. */
export interface ContactFieldTypeUpdateInput extends ContactFieldTypeCreateInput {}

/** Describes the contact field data contract. */
export interface ContactField {
  id: number;
  object: string;
  content: string;
  contact_field_type: ContactFieldType;
  account?: { id: number };
  contact?: {
    id: number;
    object: string;
    hash_id?: string;
    first_name: string;
    last_name: string | null;
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

/** Describes the contact field create input data contract. */
export interface ContactFieldCreateInput {
  contact_id: number;
  contact_field_type_id: number;
  content: string;
}

/** Describes the contact field update input data contract. */
export interface ContactFieldUpdateInput {
  content: string;
  contact_id: number;
  contact_field_type_id: number;
}

/** Describes the audit log data contract. */
export interface AuditLog {
  id: number;
  object: string;
  author: {
    id: number;
    name: string | null;
  };
  action: string;
  objects: Record<string, unknown>;
  audited_at: string;
  created_at: string;
  updated_at: string;
}

/** Describes the relationship type group data contract. */
export interface RelationshipTypeGroup {
  id: number;
  object: string;
  name: string;
  delible: boolean;
  account?: { id: number };
  created_at: string | null;
  updated_at: string | null;
}

/** Describes the relationship type data contract. */
export interface RelationshipType {
  id: number;
  object: string;
  name: string;
  name_reverse_relationship: string;
  relationship_type_group_id: number;
  delible: boolean;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

/** Describes the term data contract. */
export interface Term {
  id: number;
  object: string;
  term_version: string;
  term_content: string;
  privacy_version: string;
  privacy_content: string;
  created_at: string;
  updated_at: string | null;
}

/** Describes the compliance status data contract. */
export interface ComplianceStatus {
  signed: boolean;
  signed_date?: string;
  ip_address?: string;
  user?: User;
  term?: Term;
}

/** Describes the compliance sign input data contract. */
export interface ComplianceSignInput {
  ip_address: string;
}

/** Describes the user data contract. */
export interface User {
  id: number;
  object: string;
  uuid?: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  timezone?: string;
  locale?: string;
  is_policy_compliant?: boolean;
  currency?: Currency;
  me_contact?: {
    id: number;
    uuid?: string;
    object: string;
    hash_id?: string;
    first_name: string;
    last_name: string;
    nickname?: string;
    complete_name?: string;
    initials?: string;
    gender: string;
    gender_type?: string;
    is_starred?: boolean;
    is_partial: boolean;
    is_active?: boolean;
    is_dead?: boolean;
    is_me?: boolean;
  };
  account?: { id: number };
  created_at?: string;
  updated_at?: string;
}
