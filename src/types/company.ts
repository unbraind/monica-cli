export interface Company {
  id: number;
  object: string;
  name: string;
  website: string | null;
  number_of_employees: number | null;
  account?: { id: number };
  created_at: string;
  updated_at: string;
}

export interface CompanyCreateInput {
  name: string;
  website?: string;
  number_of_employees?: number;
}

export interface CompanyUpdateInput extends CompanyCreateInput {}
