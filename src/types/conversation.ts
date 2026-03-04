export interface Conversation {
  id: number;
  object: string;
  happened_at: string;
  messages?: ConversationMessage[];
  contact_field_type?: {
    id: number;
    object: string;
    name: string;
  };
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

export interface ConversationMessage {
  id: number;
  object: string;
  body: string;
  written_at: string;
  written_by_me: boolean;
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
  };
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface ConversationCreateInput {
  contact_id: number;
  happened_at: string;
  contact_field_type_id: number;
}

export interface ConversationUpdateInput {
  happened_at: string;
}

export interface ConversationMessageCreateInput {
  written_at: string;
  written_by_me: boolean;
  content: string;
  contact_id: number;
}

export interface ConversationMessageUpdateInput {
  written_at?: string;
  written_by_me?: boolean;
  content?: string;
  contact_id?: number;
}
