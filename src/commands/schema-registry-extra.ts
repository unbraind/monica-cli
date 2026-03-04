import type { OutputSchemaDescriptor } from './schema-registry';
import { AGENT_OUTPUT_SCHEMAS } from './schema-registry-agent';
import { API_RESEARCH_OUTPUT_SCHEMAS } from './schema-registry-api-research';
import { API_RESEARCH_COVERAGE_OUTPUT_SCHEMAS } from './schema-registry-api-research-coverage';

export const ADDITIONAL_OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [
  ...AGENT_OUTPUT_SCHEMAS,
  ...API_RESEARCH_OUTPUT_SCHEMAS,
  ...API_RESEARCH_COVERAGE_OUTPUT_SCHEMAS,
  {
    id: 'schemas-sample',
    title: 'schemas sample',
    description: 'Deterministic example payload generated from a registered schema',
    schema: {
      type: 'object',
      required: ['ok', 'schemaId', 'sample'],
      properties: {
        ok: { type: 'boolean' },
        schemaId: { type: 'string' },
        sample: {},
      },
    },
  },
  {
    id: 'audit-report',
    title: 'audit',
    description: 'Local security and secret-hygiene audit report',
    schema: {
      type: 'object',
      required: ['generatedAt', 'ok', 'repoPath', 'settingsPath', 'summary', 'checks'],
      properties: {
        generatedAt: { type: 'string' },
        ok: { type: 'boolean' },
        repoPath: { type: 'string' },
        settingsPath: { type: 'string' },
        summary: {
          type: 'object',
          required: ['total', 'pass', 'warn', 'fail'],
          properties: {
            total: { type: 'number' },
            pass: { type: 'number' },
            warn: { type: 'number' },
            fail: { type: 'number' },
          },
        },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'status', 'severity', 'message'],
            properties: {
              id: { type: 'string' },
              status: { type: 'string', enum: ['pass', 'warn', 'fail'] },
              severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  {
    id: 'config-get',
    title: 'config get',
    description: 'Full masked configuration payload',
    schema: {
      type: 'object',
      required: ['ok', 'config'],
      properties: {
        ok: { type: 'boolean' },
        config: { type: 'object' },
      },
    },
  },
  {
    id: 'config-show',
    title: 'config show',
    description: 'Configuration plus connection test details',
    schema: {
      type: 'object',
      required: ['ok', 'config', 'location', 'connection'],
      properties: {
        ok: { type: 'boolean' },
        config: { type: 'object' },
        location: { type: 'object' },
        connection: { type: 'object' },
      },
    },
  },
  {
    id: 'config-test',
    title: 'config test',
    description: 'Connection health response for automation',
    schema: {
      type: 'object',
      required: ['ok', 'apiUrl'],
      properties: {
        ok: { type: 'boolean' },
        apiUrl: { type: 'string' },
        user: { type: 'object' },
        error: { type: 'string' },
      },
    },
  },
  {
    id: 'paginated-list',
    title: 'generic paginated list',
    description: 'Standard Monica API paginated response envelope',
    schema: {
      type: 'object',
      required: ['data', 'meta', 'links'],
      properties: {
        data: { type: 'array' },
        meta: { type: 'object' },
        links: { type: 'object' },
      },
    },
  },
];
