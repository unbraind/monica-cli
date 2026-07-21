export type { Tag } from './contact';

/** Describes the tag create input data contract. */
export interface TagCreateInput {
  name: string;
}

/** Describes the tag update input data contract. */
export interface TagUpdateInput extends TagCreateInput {}

/** Describes the set tags input data contract. */
export interface SetTagsInput {
  tags: string[];
}

/** Describes the unset tag input data contract. */
export interface UnsetTagInput {
  tags: number[];
}
