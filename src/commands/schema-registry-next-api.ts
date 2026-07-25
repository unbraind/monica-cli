import type { OutputSchemaDescriptor } from './schema-registry';

const TIMESTAMPED_RESOURCE_PROPERTIES = {
  id: { type: 'string' },
  name: { type: 'string' },
  created_at: { type: 'string' },
  updated_at: { type: 'string' },
  links: {
    type: 'object',
    required: ['self'],
    properties: { self: { type: 'string' } },
  },
};

/** Provides current Monica API user and vault resource schemas. */
export const NEXT_API_OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [
  {
    id: 'next-account-user',
    title: 'users current|get',
    description: 'Current Monica API account-user resource',
    schema: {
      type: 'object',
      required: ['id', 'name', 'email', 'created_at', 'updated_at', 'links'],
      properties: {
        ...TIMESTAMPED_RESOURCE_PROPERTIES,
        email: { type: 'string' },
      },
    },
  },
  {
    id: 'next-vault',
    title: 'vaults get|create|update|patch',
    description: 'Current Monica API vault resource',
    schema: {
      type: 'object',
      required: ['id', 'name', 'description', 'created_at', 'updated_at', 'links'],
      properties: {
        ...TIMESTAMPED_RESOURCE_PROPERTIES,
        description: { type: ['string', 'null'] },
      },
    },
  },
];
