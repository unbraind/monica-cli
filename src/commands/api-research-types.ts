import type { ResourceSummary } from './api-research-shared';

export interface ApiResearchSummaryOptions {
  resource?: string;
  withEndpoints?: boolean;
  instanceAware?: boolean;
  supportedOnly?: boolean;
  unsupportedOnly?: boolean;
  mappedOnly?: boolean;
  unmappedOnly?: boolean;
  source?: string;
}

export interface ApiResearchSummaryPayload {
  generatedAt: string;
  sourceFile: string;
  sourceFormat: 'api-reference' | 'monica-api-reference';
  apiReference: {
    version: string;
    generated: string;
    baseUrl: string;
  };
  instanceCapabilities: {
    enabled: boolean;
    source?: 'cache' | 'live';
    generatedAt?: string;
  };
  commandSupport?: {
    total: number;
    supported: number;
    unsupported: number;
    supportedCommands: string[];
    unsupportedCommands: string[];
  };
  summary: {
    resources: number;
    endpoints: number;
    methodsByVerb: Record<string, number>;
  };
  cliCoverage: {
    mappedResources: number;
    unmappedResources: number;
    unmappedResourceNames: string[];
  };
  supportedResourcesByInstance?: string[];
  unsupportedResourcesByInstance?: Array<{
    resource: string;
    cliCommand: string;
    statusCode: number;
    endpoint: string;
    message: string;
  }>;
  resources: ResourceSummary[];
}

export interface ApiResearchCoveragePayload {
  generatedAt: string;
  sourceFile: string;
  sourceFormat: 'api-reference' | 'monica-api-reference';
  instanceCapabilities: {
    enabled: boolean;
    source?: 'cache' | 'live';
    generatedAt?: string;
  };
  totals: {
    resources: number;
    endpoints: number;
  };
  cliMapping: {
    mappedResources: number;
    unmappedResources: number;
    mappedPercent: number;
    unmappedResourceNames: string[];
  };
  instanceSupport?: {
    supportedResources: number;
    unsupportedResources: number;
    supportedPercent: number;
    unsupported: Array<{
      resource: string;
      cliCommand: string;
      statusCode: number;
      endpoint: string;
      message: string;
    }>;
  };
  commandSupport?: {
    total: number;
    supported: number;
    unsupported: number;
    supportedPercent: number;
    supportedCommands: string[];
    unsupportedCommands: string[];
  };
  readOnlyActionPlan: {
    count: number;
    commands: string[];
  };
  gate?: {
    enabled: boolean;
    failed: boolean;
    failOnUnmapped: boolean;
    failOnUnsupported: boolean;
    reasons: string[];
  };
  recommendedNextCommands: string[];
}

export interface ApiResearchBacklogItem {
  resource: string;
  cliCommand: string;
  type: 'missing-cli-mapping' | 'instance-unsupported';
  priority: 'high' | 'medium';
  reason: string;
  recommendedAction: string;
  support?: { supportedOnInstance: boolean; statusCode: number; endpoint: string; message: string };
  agentActions: Array<{
    command: string;
    reason: string;
    safety: 'read-only' | 'planning';
  }>;
}

export interface ApiResearchBacklogPayload {
  generatedAt: string;
  sourceFile: string;
  sourceFormat: 'api-reference' | 'monica-api-reference';
  instanceCapabilities: {
    enabled: boolean;
    source?: 'cache' | 'live';
    generatedAt?: string;
  };
  backlog: {
    total: number;
    high: number;
    medium: number;
  };
  items: ApiResearchBacklogItem[];
}

export interface ApiResearchActionsPayload {
  generatedAt: string;
  sourceFile: string;
  sourceFormat: 'api-reference' | 'monica-api-reference';
  instanceCapabilities: {
    enabled: boolean;
    source?: 'cache' | 'live';
    generatedAt?: string;
  };
  summary: {
    actions: number;
    readOnlyActions: number;
    planningActions: number;
    uniqueCommands: number;
  };
  actions: Array<{
    resource: string;
    cliCommand: string;
    type: 'missing-cli-mapping' | 'instance-unsupported';
    priority: 'high' | 'medium';
    command: string;
    commandShape: {
      executable: string;
      root: string;
      subcommand: string;
      args: string[];
      options: string[];
    };
    reason: string;
    safety: 'read-only' | 'planning';
    support?: { supportedOnInstance: boolean; statusCode: number; endpoint: string; message: string };
  }>;
  commands: string[];
}
