import type { OutputSchemaDescriptor } from './schema-registry';

export const API_RESEARCH_COVERAGE_OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [
  {
    id: 'api-research-coverage',
    title: 'api-research coverage',
    description: 'Compact API mapping and live-instance support scorecard for agent planning',
    schema: {
      type: 'object',
      required: ['generatedAt', 'sourceFile', 'sourceFormat', 'instanceCapabilities', 'totals', 'cliMapping', 'readOnlyActionPlan', 'recommendedNextCommands'],
      properties: {
        generatedAt: { type: 'string' },
        sourceFile: { type: 'string' },
        sourceFormat: { type: 'string', enum: ['api-reference', 'monica-api-reference'] },
        instanceCapabilities: {
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: { type: 'boolean' },
            source: { type: 'string', enum: ['cache', 'live'] },
            generatedAt: { type: 'string' },
          },
        },
        totals: {
          type: 'object',
          required: ['resources', 'endpoints'],
          properties: {
            resources: { type: 'number' },
            endpoints: { type: 'number' },
          },
        },
        cliMapping: {
          type: 'object',
          required: ['mappedResources', 'unmappedResources', 'mappedPercent', 'unmappedResourceNames'],
          properties: {
            mappedResources: { type: 'number' },
            unmappedResources: { type: 'number' },
            mappedPercent: { type: 'number' },
            unmappedResourceNames: { type: 'array', items: { type: 'string' } },
          },
        },
        instanceSupport: {
          type: 'object',
          required: ['supportedResources', 'unsupportedResources', 'supportedPercent', 'unsupported'],
          properties: {
            supportedResources: { type: 'number' },
            unsupportedResources: { type: 'number' },
            supportedPercent: { type: 'number' },
            unsupported: {
              type: 'array',
              items: {
                type: 'object',
                required: ['resource', 'cliCommand', 'statusCode', 'endpoint', 'message'],
                properties: {
                  resource: { type: 'string' },
                  cliCommand: { type: 'string' },
                  statusCode: { type: 'number' },
                  endpoint: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        commandSupport: {
          type: 'object',
          required: ['total', 'supported', 'unsupported', 'supportedPercent', 'supportedCommands', 'unsupportedCommands'],
          properties: {
            total: { type: 'number' },
            supported: { type: 'number' },
            unsupported: { type: 'number' },
            supportedPercent: { type: 'number' },
            supportedCommands: { type: 'array', items: { type: 'string' } },
            unsupportedCommands: { type: 'array', items: { type: 'string' } },
          },
        },
        readOnlyActionPlan: {
          type: 'object',
          required: ['count', 'commands'],
          properties: {
            count: { type: 'number' },
            commands: { type: 'array', items: { type: 'string' } },
          },
        },
        gate: {
          type: 'object',
          required: ['enabled', 'failed', 'failOnUnmapped', 'failOnUnsupported', 'reasons'],
          properties: {
            enabled: { type: 'boolean' },
            failed: { type: 'boolean' },
            failOnUnmapped: { type: 'boolean' },
            failOnUnsupported: { type: 'boolean' },
            reasons: { type: 'array', items: { type: 'string' } },
          },
        },
        recommendedNextCommands: { type: 'array', items: { type: 'string' } },
      },
    },
  },
];
