import type { JsonSchema } from './schema-validator';
import { ADDITIONAL_OUTPUT_SCHEMAS } from './schema-registry-extra';
export interface OutputSchemaDescriptor { id: string; title: string; description: string; schema: JsonSchema; }
const CORE_OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [
  {
    id: 'info-capabilities',
    title: 'info capabilities',
    description: 'Capability probe summary and per-resource support details',
    schema: {
      type: 'object',
      required: ['generatedAt', 'source', 'summary', 'probes'],
      properties: {
        generatedAt: { type: 'string' },
        source: { type: 'string', enum: ['cache', 'live'] },
        summary: {
          type: 'object',
          required: ['total', 'supported', 'unsupported'],
          properties: {
            total: { type: 'number' },
            supported: { type: 'number' },
            unsupported: { type: 'number' },
          },
        },
        probes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['key', 'command', 'endpoint', 'supported'],
          },
        },
      },
    },
  },
  {
    id: 'info-supported-commands',
    title: 'info supported-commands',
    description: 'Supported high-level commands with capability source metadata',
    schema: {
      type: 'object',
      required: ['generatedAt', 'source', 'total', 'commands'],
      properties: {
        generatedAt: { type: 'string' },
        source: { type: 'string', enum: ['cache', 'live'] },
        total: { type: 'number' },
        commands: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
  {
    id: 'info-unsupported-commands',
    title: 'info unsupported-commands',
    description: 'Unsupported high-level commands with source metadata and probe failure details',
    schema: {
      type: 'object',
      required: ['generatedAt', 'source', 'total', 'commands'],
      properties: {
        generatedAt: { type: 'string' },
        source: { type: 'string', enum: ['cache', 'live'] },
        total: { type: 'number' },
        commands: {
          type: 'array',
          items: {
            type: 'object',
            required: ['key', 'command', 'endpoint', 'statusCode', 'message', 'severity', 'recommendedAction', 'fallbackCommands'],
            properties: {
              key: { type: 'string' },
              command: { type: 'string' },
              endpoint: { type: 'string' },
              statusCode: { type: 'number' },
              message: { type: 'string' },
              severity: { type: 'string', enum: ['unsupported', 'auth', 'rate-limited', 'error'] },
              recommendedAction: { type: 'string' },
              fallbackCommands: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  {
    id: 'info-agent-context',
    title: 'info agent-context',
    description: 'Sanitized machine context for LLM/agent planning',
    schema: {
      type: 'object',
      required: ['generatedAt', 'instance', 'defaults', 'capabilities', 'supportedCommands'],
      properties: {
        generatedAt: { type: 'string' },
        instance: { type: 'object' },
        defaults: { type: 'object' },
        capabilities: {
          type: 'object',
          required: ['source', 'total', 'supported', 'unsupported', 'unsupportedResources'],
          properties: {
            source: { type: 'string', enum: ['cache', 'live'] },
            total: { type: 'number' },
            supported: { type: 'number' },
            unsupported: { type: 'number' },
            unsupportedResources: { type: 'array' },
          },
        },
        supportedCommands: { type: 'object' },
      },
    },
  },
  {
    id: 'info-instance-profile',
    title: 'info instance-profile',
    description: 'Consolidated instance capability profile and command availability for agents',
    schema: {
      type: 'object',
      required: ['generatedAt', 'instance', 'defaults', 'capabilities', 'supportedCommands', 'unsupportedCommands'],
      properties: {
        generatedAt: { type: 'string' },
        instance: { type: 'object' },
        defaults: { type: 'object' },
        capabilities: {
          type: 'object',
          required: ['source', 'summary', 'probes'],
          properties: {
            source: { type: 'string', enum: ['cache', 'live'] },
            summary: { type: 'object' },
            probes: { type: 'array' },
          },
        },
        supportedCommands: { type: 'object' },
        unsupportedCommands: { type: 'object' },
      },
    },
  },
  {
    id: 'info-command-catalog',
    title: 'info command-catalog',
    description: 'Machine-readable command tree with safety metadata and optional instance availability for agents',
    schema: {
      type: 'object',
      required: ['generatedAt', 'rootCommand', 'defaultOutputFormat', 'instanceCapabilities', 'commandTree'],
      properties: {
        generatedAt: { type: 'string' },
        rootCommand: { type: 'string' },
        defaultOutputFormat: { type: 'string' },
        instanceCapabilities: {
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: { type: 'boolean' },
            source: { type: 'string', enum: ['cache', 'live'] },
            generatedAt: { type: 'string' },
          },
        },
        commandTree: {
          type: 'object',
          required: ['name', 'fullCommand', 'usage', 'helpCommand', 'safety', 'subcommands'],
          properties: {
            name: { type: 'string' },
            fullCommand: { type: 'string' },
            usage: { type: 'string' },
            helpCommand: { type: 'string' },
            safety: {
              type: 'object',
              required: ['operation', 'mutatesData', 'readOnlyCompatible'],
              properties: {
                operation: { type: 'string' },
                mutatesData: { type: 'boolean' },
                readOnlyCompatible: { type: 'boolean' },
              },
            },
            availability: {
              type: 'object',
              required: ['supportedOnInstance', 'statusCode', 'endpoint', 'message'],
              properties: {
                supportedOnInstance: { type: 'boolean' },
                statusCode: { type: 'number' },
                endpoint: { type: 'string' },
                message: { type: 'string' },
              },
            },
            subcommands: { type: 'array' },
          },
        },
      },
    },
  },
  {
    id: 'search-results',
    title: 'search',
    description: 'Structured multi-resource search response with partial-failure metadata',
    schema: {
      type: 'object',
      required: ['query', 'type', 'totalResults', 'partial', 'failedTypes', 'errors', 'results'],
      properties: {
        query: { type: 'string' },
        type: { type: 'string' },
        totalResults: { type: 'number' },
        partial: { type: 'boolean' },
        failedTypes: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'object', required: ['type', 'message'] } },
        results: { type: 'array' },
      },
    },
  },
  {
    id: 'agent-tools-safe-commands',
    title: 'agent-tools safe-commands',
    description: 'Read-only-compatible executable commands for agent planners, optionally filtered by live instance capability support',
    schema: {
      type: 'object',
      required: ['generatedAt', 'instanceCapabilities', 'totalCommands', 'commands', 'totalExcludedCommands', 'excludedCommands'],
      properties: {
        generatedAt: { type: 'string' },
        instanceCapabilities: {
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: { type: 'boolean' },
            source: { type: 'string', enum: ['cache', 'live'] },
            generatedAt: { type: 'string' },
          },
        },
        totalCommands: { type: 'number' },
        totalExcludedCommands: { type: 'number' },
        commands: {
          type: 'array',
          items: {
            type: 'object',
            required: ['command', 'operation', 'mutatesData', 'readOnlyCompatible'],
            properties: {
              command: { type: 'string' },
              operation: { type: 'string', enum: ['read', 'write', 'mixed', 'meta'] },
              mutatesData: { type: 'boolean' },
              readOnlyCompatible: { type: 'boolean' },
              supportedOnInstance: { type: 'boolean' },
            },
          },
        },
        excludedCommands: {
          type: 'array',
          items: {
            type: 'object',
            required: ['command', 'reason', 'operation', 'mutatesData', 'readOnlyCompatible'],
            properties: {
              command: { type: 'string' },
              reason: { type: 'string', enum: ['instance-unsupported'] },
              operation: { type: 'string', enum: ['read', 'write', 'mixed', 'meta'] },
              mutatesData: { type: 'boolean' },
              readOnlyCompatible: { type: 'boolean' },
              statusCode: { type: 'number' },
              endpoint: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
];
export const OUTPUT_SCHEMAS: OutputSchemaDescriptor[] = [...CORE_OUTPUT_SCHEMAS, ...ADDITIONAL_OUTPUT_SCHEMAS];
export function findSchema(schemaId: string): OutputSchemaDescriptor | undefined { return OUTPUT_SCHEMAS.find((schema) => schema.id === schemaId); }
