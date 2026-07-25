import type { OutputSchemaDescriptor } from './schema-registry';

/** Provides the upstream API source freshness output schema. */
export const API_SOURCE_STATUS_OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [{
  id: 'api-research-source-status',
  title: 'api-research source-status',
  description: 'Public upstream freshness verdict for the bundled Monica stable API reference',
  schema: {
    type: 'object',
    required: ['generatedAt', 'state', 'current', 'source', 'upstream', 'error', 'gate', 'recommendedActions'],
    properties: {
      generatedAt: { type: 'string' },
      state: { type: 'string', enum: ['current', 'stale', 'unavailable'] },
      current: { type: ['boolean', 'null'] },
      source: {
        type: ['object', 'null'],
        properties: {
          repository: { type: 'string' },
          branch: { type: 'string' },
          routeFile: { type: 'string' },
          bundledCommit: { type: 'string' },
        },
      },
      upstream: {
        type: 'object',
        required: ['apiUrl', 'commit'],
        properties: {
          apiUrl: { type: ['string', 'null'] },
          commit: { type: ['string', 'null'] },
        },
      },
      error: { type: ['string', 'null'] },
      gate: {
        type: 'object',
        required: ['enabled', 'failed', 'failOnStale', 'failOnUnavailable', 'reasons'],
        properties: {
          enabled: { type: 'boolean' },
          failed: { type: 'boolean' },
          failOnStale: { type: 'boolean' },
          failOnUnavailable: { type: 'boolean' },
          reasons: { type: 'array', items: { type: 'string' } },
        },
      },
      recommendedActions: { type: 'array', items: { type: 'string' } },
    },
  },
}];
