/** Describes the company data contract. */
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

/** Describes the company create input data contract. */
export interface CompanyCreateInput {
  name: string;
  website?: string;
  number_of_employees?: number;
}

/** Describes the company update input data contract. */
export interface CompanyUpdateInput extends CompanyCreateInput {}
