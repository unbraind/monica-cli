/** Identifies a supported Monica API edition. */
export type ApiEdition = 'stable' | 'next';

/** Identifies a supported OpenAPI Specification version. */
export type OpenApiVersion = '3.1.2' | '3.2.0';

/** Describes one documented API parameter. */
export interface ContractParameter {
  name?: string;
  type?: string;
  required?: boolean;
  description?: string;
  enum?: unknown[];
}

/** Describes one documented request-body field. */
export interface ContractInputField {
  type?: string;
  required?: boolean;
  description?: string;
  enum?: unknown[];
  format?: string;
  maxLength?: number;
}

/** Describes one authoritative Monica API endpoint. */
export interface ContractEndpoint {
  method?: string;
  path?: string;
  description?: string;
  parameters?: ContractParameter[];
  input?: Record<string, ContractInputField> | string;
  response?: unknown;
  contentType?: string;
  cli?: string;
  statusCode?: number;
  ability?: 'read' | 'write';
  requestBody?: boolean;
}

/** Describes one authoritative Monica API resource group. */
export interface ContractResource {
  description?: string;
  endpoints?: ContractEndpoint[];
}

/** Describes a bundled authoritative Monica API reference. */
export interface ContractReference {
  version?: string;
  baseUrl?: string;
  authentication?: Record<string, unknown>;
  source?: {
    repository?: string;
    branch?: string;
    commit?: string;
    routeFile?: string;
  };
  resources?: Record<string, ContractResource>;
}

/** Represents a JSON Schema-compatible OpenAPI schema object. */
export type OpenApiSchema = Record<string, unknown>;

/** Describes an OpenAPI operation emitted by the CLI. */
export interface OpenApiOperation {
  operationId: string;
  summary: string;
  description?: string;
  tags: string[];
  parameters?: Array<Record<string, unknown>>;
  requestBody?: Record<string, unknown>;
  responses: Record<string, unknown>;
  security: Array<Record<string, string[]>>;
  'x-monica-edition': ApiEdition;
  'x-monica-resource': string;
  'x-monica-source-commit': string;
  'x-monica-cli': {
    command: string | null;
    commandRoot: string;
    helpCommand: string;
    mapping: 'endpoint' | 'resource';
  };
  'x-monica-response-type'?: unknown;
  'x-monica-required-ability'?: 'read' | 'write';
}

/** Describes a generated OpenAPI document. */
export interface OpenApiDocument {
  openapi: OpenApiVersion;
  jsonSchemaDialect: string;
  info: {
    title: string;
    version: string;
    description: string;
    license: {
      name: string;
      identifier: string;
    };
  };
  servers: Array<{ url: string; description: string }>;
  security: Array<Record<string, string[]>>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: {
    securitySchemes: Record<string, Record<string, unknown>>;
    schemas: Record<string, OpenApiSchema>;
  };
  'x-monica-edition': ApiEdition;
  'x-monica-source': {
    repository: string;
    branch: string;
    commit: string;
    routeFile: string;
  };
  'x-monica-contract': {
    resources: number;
    operations: number;
    generatedBy: string;
  };
}

/** Describes one normalized operation used by edition comparison. */
export interface ComparableOperation {
  key: string;
  method: string;
  path: string;
  operationId: string;
  summary: string;
}

/** Describes a deterministic compatibility diff between two API editions. */
export interface ContractDiffResult {
  generatedAt: string;
  from: { edition: ApiEdition; commit: string; operations: number };
  to: { edition: ApiEdition; commit: string; operations: number };
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
    breakingChanges: number;
  };
  added: ComparableOperation[];
  removed: ComparableOperation[];
  changed: Array<{ key: string; from: ComparableOperation; to: ComparableOperation }>;
  breaking: boolean;
}

/** Describes one contract validation result. */
export interface ContractValidationResult {
  edition: ApiEdition;
  valid: boolean;
  operations: number;
  paths: number;
  errors: string[];
  warnings: string[];
}
