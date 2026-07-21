/** Describes the reminder frequency type data contract. */
export type ReminderFrequencyType = 'one_time' | 'week' | 'month' | 'year';

/** Describes the reminder data contract. */
export interface Reminder {
  id: number;
  object: string;
  title: string;
  description: string | null;
  frequency_type: ReminderFrequencyType;
  frequency_number: number | null;
  last_triggered_date: string | null;
  initial_date?: string;
  next_expected_date?: string;
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

/** Describes the reminder create input data contract. */
export interface ReminderCreateInput {
  title: string;
  description?: string;
  initial_date: string;
  frequency_type: ReminderFrequencyType;
  frequency_number?: number;
  contact_id: number;
}

/** Describes the reminder update input data contract. */
export interface ReminderUpdateInput extends ReminderCreateInput {}
