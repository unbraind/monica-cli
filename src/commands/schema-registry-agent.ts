import type { OutputSchemaDescriptor } from './schema-registry';

export const AGENT_OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [
  {
    id: 'agent-runbook',
    title: 'agent-runbook',
    description: 'Deterministic read-only execution runbook for agents, with optional instance-aware step filtering',
    schema: {
      type: 'object',
      required: ['generatedAt', 'mode', 'instanceCapabilities', 'summary', 'steps', 'excludedSteps'],
      properties: {
        generatedAt: { type: 'string' },
        mode: { type: 'string', enum: ['read-only'] },
        instanceCapabilities: {
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: { type: 'boolean' },
            source: { type: 'string', enum: ['cache', 'live'] },
            generatedAt: { type: 'string' },
          },
        },
        summary: {
          type: 'object',
          required: ['totalSteps', 'totalExcludedSteps', 'includeOptional'],
          properties: {
            totalSteps: { type: 'number' },
            totalExcludedSteps: { type: 'number' },
            includeOptional: { type: 'boolean' },
          },
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'category', 'command', 'purpose', 'commandRoot'],
            properties: {
              id: { type: 'string' },
              category: { type: 'string', enum: ['baseline', 'discovery', 'planning', 'investigation'] },
              command: { type: 'string' },
              purpose: { type: 'string' },
              commandRoot: { type: 'string' },
              schemaHint: { type: 'string' },
            },
          },
        },
        excludedSteps: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'command', 'commandRoot', 'reason', 'support'],
            properties: {
              id: { type: 'string' },
              command: { type: 'string' },
              commandRoot: { type: 'string' },
              reason: { type: 'string', enum: ['instance-unsupported'] },
              support: {
                type: 'object',
                required: ['commandRoot', 'statusCode', 'endpoint', 'message'],
                properties: {
                  commandRoot: { type: 'string' },
                  statusCode: { type: 'number' },
                  endpoint: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
];
