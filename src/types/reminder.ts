export type ReminderFrequencyType = 'one_time' | 'week' | 'month' | 'year';

export interface Reminder {
  id: number;
  object: string;
  title: string;
  description: string | null;
  frequency_type: ReminderFrequencyType;
  frequency_number: number | null;
  last_triggered_date: string | null;
  next_expected_date: string;
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

export interface ReminderCreateInput {
  title: string;
  description?: string;
  next_expected_date: string;
  frequency_type: ReminderFrequencyType;
  frequency_number?: number;
  contact_id: number;
}

export interface ReminderUpdateInput extends ReminderCreateInput {}
