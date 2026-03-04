export type { Tag } from './contact';

export interface TagCreateInput {
  name: string;
}

export interface TagUpdateInput extends TagCreateInput {}

export interface SetTagsInput {
  tags: string[];
}

export interface UnsetTagInput {
  tags: number[];
}
