import type { OutputSchemaDescriptor } from './schema-registry';

export const API_RESEARCH_OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [
  {
    id: 'api-research-summary',
    title: 'api-research summary',
    description: 'Monica API resource/endpoint inventory summary from local reference docs',
    schema: {
      type: 'object',
      required: ['generatedAt', 'sourceFile', 'sourceFormat', 'apiReference', 'instanceCapabilities', 'summary', 'cliCoverage', 'resources'],
      properties: {
        generatedAt: { type: 'string' },
        sourceFile: { type: 'string' },
        sourceFormat: { type: 'string', enum: ['api-reference', 'monica-api-reference'] },
        apiReference: { type: 'object' },
        instanceCapabilities: {
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: { type: 'boolean' },
            source: { type: 'string', enum: ['cache', 'live'] },
            generatedAt: { type: 'string' },
          },
        },
        commandSupport: {
          type: 'object',
          required: ['total', 'supported', 'unsupported', 'supportedCommands', 'unsupportedCommands'],
          properties: {
            total: { type: 'number' },
            supported: { type: 'number' },
            unsupported: { type: 'number' },
            supportedCommands: { type: 'array', items: { type: 'string' } },
            unsupportedCommands: { type: 'array', items: { type: 'string' } },
          },
        },
        summary: {
          type: 'object',
          required: ['resources', 'endpoints', 'methodsByVerb'],
          properties: {
            resources: { type: 'number' },
            endpoints: { type: 'number' },
            methodsByVerb: { type: 'object' },
          },
        },
        cliCoverage: {
          type: 'object',
          required: ['mappedResources', 'unmappedResources', 'unmappedResourceNames'],
          properties: {
            mappedResources: { type: 'number' },
            unmappedResources: { type: 'number' },
            unmappedResourceNames: { type: 'array', items: { type: 'string' } },
          },
        },
        supportedResourcesByInstance: { type: 'array', items: { type: 'string' } },
        unsupportedResourcesByInstance: {
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
        resources: {
          type: 'array',
          items: {
            type: 'object',
            required: ['resource', 'endpointCount', 'methods', 'cliCommand', 'cliMapping'],
            properties: {
              resource: { type: 'string' },
              description: { type: 'string' },
              endpointCount: { type: 'number' },
              methods: { type: 'array', items: { type: 'string' } },
              cliCommand: { type: 'string' },
              cliMapping: { type: 'string', enum: ['mapped', 'unmapped'] },
              instanceSupport: { type: 'object' },
              endpoints: { type: 'array' },
            },
          },
        },
      },
    },
  },
  {
    id: 'api-research-probe',
    title: 'api-research probe',
    description: 'Read-only GET endpoint probe matrix against the live Monica instance',
    schema: {
      type: 'object',
      required: ['generatedAt', 'sourceFile', 'sourceFormat', 'options', 'summary', 'probes'],
      properties: {
        generatedAt: { type: 'string' },
        sourceFile: { type: 'string' },
        sourceFormat: { type: 'string', enum: ['api-reference', 'monica-api-reference'] },
        options: {
          type: 'object',
          required: ['resource', 'includeParameterized', 'idReplacement'],
          properties: {
            resource: { type: 'string' },
            includeParameterized: { type: 'boolean' },
            idReplacement: { type: 'number' },
          },
        },
        summary: {
          type: 'object',
          required: ['total', 'supported', 'unsupported', 'unknownId', 'errors'],
          properties: {
            total: { type: 'number' },
            supported: { type: 'number' },
            unsupported: { type: 'number' },
            unknownId: { type: 'number' },
            errors: { type: 'number' },
          },
        },
        probes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['resource', 'key', 'method', 'referencePath', 'probePath', 'parameterized', 'status', 'supported', 'statusCode', 'message'],
            properties: {
              resource: { type: 'string' },
              key: { type: 'string' },
              method: { type: 'string' },
              referencePath: { type: 'string' },
              probePath: { type: 'string' },
              probeParams: { type: 'object' },
              parameterized: { type: 'boolean' },
              status: { type: 'string', enum: ['supported', 'unsupported', 'unknown-id', 'error'] },
              supported: {},
              statusCode: { type: 'number' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
  {
    id: 'api-research-backlog',
    title: 'api-research backlog',
    description: 'Deterministic CLI parity backlog items derived from API research data',
    schema: {
      type: 'object',
      required: ['generatedAt', 'sourceFile', 'sourceFormat', 'instanceCapabilities', 'backlog', 'items'],
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
        backlog: {
          type: 'object',
          required: ['total', 'high', 'medium'],
          properties: {
            total: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
          },
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['resource', 'cliCommand', 'type', 'priority', 'reason', 'recommendedAction', 'agentActions'],
            properties: {
              resource: { type: 'string' },
              cliCommand: { type: 'string' },
              type: { type: 'string', enum: ['missing-cli-mapping', 'instance-unsupported'] },
              priority: { type: 'string', enum: ['high', 'medium'] },
              reason: { type: 'string' },
              recommendedAction: { type: 'string' },
              support: { type: 'object' },
              agentActions: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['command', 'reason', 'safety'],
                  properties: {
                    command: { type: 'string' },
                    reason: { type: 'string' },
                    safety: { type: 'string', enum: ['read-only', 'planning'] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    id: 'api-research-actions',
    title: 'api-research actions',
    description: 'Deterministic flattened agent action list derived from API research backlog guidance',
    schema: {
      type: 'object',
      required: ['generatedAt', 'sourceFile', 'sourceFormat', 'instanceCapabilities', 'summary', 'actions', 'commands'],
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
        summary: {
          type: 'object',
          required: ['actions', 'readOnlyActions', 'planningActions', 'uniqueCommands'],
          properties: {
            actions: { type: 'number' },
            readOnlyActions: { type: 'number' },
            planningActions: { type: 'number' },
            uniqueCommands: { type: 'number' },
          },
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['resource', 'cliCommand', 'type', 'priority', 'command', 'commandShape', 'reason', 'safety'],
            properties: {
              resource: { type: 'string' },
              cliCommand: { type: 'string' },
              type: { type: 'string', enum: ['missing-cli-mapping', 'instance-unsupported'] },
              priority: { type: 'string', enum: ['high', 'medium'] },
              command: { type: 'string' },
              commandShape: {
                type: 'object',
                required: ['executable', 'root', 'subcommand', 'args', 'options'],
                properties: {
                  executable: { type: 'string' },
                  root: { type: 'string' },
                  subcommand: { type: 'string' },
                  args: { type: 'array', items: { type: 'string' } },
                  options: { type: 'array', items: { type: 'string' } },
                },
              },
              reason: { type: 'string' },
              safety: { type: 'string', enum: ['read-only', 'planning'] },
              support: { type: 'object' },
            },
          },
        },
        commands: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    id: 'api-research-snapshot',
    title: 'api-research snapshot',
    description: 'Combined summary, backlog, and GET probe payload for agent planning',
    schema: {
      type: 'object',
      required: ['generatedAt', 'summary', 'backlog', 'probe'],
      properties: {
        generatedAt: { type: 'string' },
        summary: { type: 'object' },
        backlog: { type: 'object' },
        probe: { type: 'object' },
      },
    },
  },
];
