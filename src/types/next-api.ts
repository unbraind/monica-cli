/** Describes a hypermedia link object returned by the current Monica API. */
export interface NextApiLinks {
  self: string;
}

/** Describes an account user returned by the current Monica API. */
export interface AccountUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  links: NextApiLinks;
}

/** Describes a vault returned by the current Monica API. */
export interface Vault {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  links: NextApiLinks;
}

/** Describes the payload accepted when creating a vault. */
export interface VaultCreateInput {
  name: string;
  description?: string;
}

/** Describes the payload accepted when replacing a vault. */
export interface VaultUpdateInput {
  name: string;
  description?: string;
}

/** Describes the payload accepted when partially updating a vault. */
export interface VaultPatchInput {
  name?: string;
  description?: string;
}
