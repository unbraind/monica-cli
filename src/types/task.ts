/** Describes the task data contract. */
export interface Task {
  id: number;
  object: string;
  title: string;
  description: string | null;
  completed: boolean;
  completed_at: string | null;
  account?: { id: number };
  contact?: {
    id: number;
    object: string;
    first_name: string;
    last_name: string | null;
    gender: string;
    is_partial: boolean;
    information?: {
      dates?: Array<{
        name: string;
        is_birthdate_approximate: string;
        birthdate: string | null;
      }>;
    };
    account?: { id: number };
  };
  created_at: string;
  updated_at: string;
}

/** Describes the task create input data contract. */
export interface TaskCreateInput {
  title: string;
  description?: string;
  completed: number;
  completed_at?: string;
  contact_id: number;
}

/** Describes the task update input data contract. */
export interface TaskUpdateInput extends TaskCreateInput {}
