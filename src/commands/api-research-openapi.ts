import { Command, InvalidArgumentError } from 'commander';
import type { OutputFormat } from '../types';
import * as fmt from '../formatters';
import { resolveCommandOutputFormat } from './output-format';
import { loadBundledContractReference, resolveCliCommand } from './api-research-shared';
import type {
  ApiEdition,
  ContractEndpoint,
  ContractReference,
  ContractResource,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiVersion,
} from './api-research-contract-types';
import {
  buildComponentSchemas,
  buildOpenApiParameters,
  buildRequestSchema,
  buildResponseSchema,
  normalizeOpenApiPath,
} from './api-research-openapi-schema';

const SUPPORTED_OAS_VERSIONS: readonly OpenApiVersion[] = ['3.2.0', '3.1.2'];
const MUTATION_METHODS = new Set(['post', 'put', 'patch']);

/** Parses and validates an OpenAPI version option. */
export function parseOpenApiVersion(value: string): OpenApiVersion {
  if (!SUPPORTED_OAS_VERSIONS.includes(value as OpenApiVersion)) {
    throw new InvalidArgumentError(
      `Invalid OAS version "${value}". Use: ${SUPPORTED_OAS_VERSIONS.join(', ')}`,
    );
  }
  return value as OpenApiVersion;
}

/** Parses and validates a Monica API edition option. */
export function parseApiEdition(value: string): ApiEdition {
  if (value !== 'stable' && value !== 'next') {
    throw new InvalidArgumentError(`Invalid API edition "${value}". Use: stable, next`);
  }
  return value;
}

function operationId(edition: ApiEdition, method: string, path: string): string {
  const suffix = path
    .replace(/[{}]/gu, '')
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[^A-Za-z0-9]+/gu, '_'))
    .join('_');
  return `${edition}_${method}_${suffix || 'root'}`;
}

function sourceFrom(reference: ContractReference): OpenApiDocument['x-monica-source'] {
  const source = reference.source;
  if (!source?.repository || !source.branch || !source.commit || !source.routeFile) {
    throw new Error('Bundled Monica API reference has incomplete source provenance');
  }
  return {
    repository: source.repository,
    branch: source.branch,
    commit: source.commit,
    routeFile: source.routeFile,
  };
}

function securityScheme(edition: ApiEdition): Record<string, unknown> {
  return {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: edition === 'stable' ? 'OAuth2 access token' : 'Sanctum API token',
    description: edition === 'stable'
      ? 'Monica stable API bearer token created through OAuth personal access.'
      : 'Monica current API Sanctum token with the required read or write ability.',
  };
}

function responseStatus(endpoint: ContractEndpoint, method: string): string {
  if (endpoint.statusCode !== undefined) return String(endpoint.statusCode);
  return method === 'post' ? '201' : '200';
}

function buildOperation(
  edition: ApiEdition,
  sourceCommit: string,
  resourceName: string,
  resource: ContractResource,
  endpoint: ContractEndpoint,
): { method: string; path: string; operation: OpenApiOperation } {
  const method = (endpoint.method ?? '').toLowerCase();
  const path = normalizeOpenApiPath(endpoint.path ?? '');
  const cli = resolveCliCommand(resourceName);
  if (!cli.mapped) throw new Error(`No CLI command mapping exists for resource "${resourceName}"`);
  const commandRoot = `monica ${cli.command}`;
  const parameters = buildOpenApiParameters(endpoint, path, edition === 'next');
  const request = MUTATION_METHODS.has(method) && endpoint.requestBody !== false
    ? buildRequestSchema(endpoint, resource)
    : null;
  const ability = endpoint.ability ?? (method === 'get' ? 'read' : 'write');
  const operation: OpenApiOperation = {
    operationId: operationId(edition, method, path),
    summary: endpoint.description ?? `${method.toUpperCase()} ${path}`,
    tags: [resourceName],
    ...(parameters.length > 0 ? { parameters } : {}),
    ...(request
      ? {
        requestBody: {
          required: true,
          content: {
            [endpoint.contentType ?? 'application/json']: { schema: request.schema },
          },
          'x-monica-contract-complete': request.complete,
        },
      }
      : {}),
    responses: {
      [responseStatus(endpoint, method)]: {
        description: 'Successful Monica API response.',
        content: {
          'application/json': { schema: buildResponseSchema(endpoint.response) },
        },
      },
      '401': {
        description: 'Authentication failed or the token lacks the required ability.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/Error' } },
        },
      },
      default: {
        description: 'Monica API error response.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/Error' } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    'x-monica-edition': edition,
    'x-monica-resource': resourceName,
    'x-monica-source-commit': sourceCommit,
    'x-monica-cli': {
      command: endpoint.cli ?? null,
      commandRoot,
      helpCommand: `${commandRoot} --help`,
      mapping: endpoint.cli ? 'endpoint' : 'resource',
    },
    ...(endpoint.response !== undefined
      ? { 'x-monica-response-type': endpoint.response }
      : {}),
    'x-monica-required-ability': ability,
  };
  return { method, path, operation };
}

/** Builds a deterministic OpenAPI document for one Monica API edition. */
export function buildOpenApiDocument(
  edition: ApiEdition,
  version: OpenApiVersion = '3.2.0',
  reference = loadBundledContractReference(edition),
): OpenApiDocument {
  const source = sourceFrom(reference);
  const resources = Object.entries(reference.resources ?? {})
    .sort(([left], [right]) => left.localeCompare(right));
  const paths: OpenApiDocument['paths'] = {};
  let operations = 0;

  resources.forEach(([resourceName, resource]) => {
    (resource.endpoints ?? [])
      .map((endpoint) => buildOperation(edition, source.commit, resourceName, resource, endpoint))
      .sort((left, right) => `${left.path}:${left.method}`.localeCompare(`${right.path}:${right.method}`))
      .forEach(({ method, path, operation }) => {
        paths[path] ??= {};
        if (paths[path]![method]) {
          throw new Error(`Duplicate Monica operation ${method.toUpperCase()} ${path}`);
        }
        paths[path]![method] = operation;
        operations += 1;
      });
  });

  return {
    openapi: version,
    jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
    info: {
      title: `Monica CRM API (${edition})`,
      version: reference.version ?? 'unknown',
      description: `Authoritative ${edition} Monica API contract generated by monica-cli.`,
      license: {
        name: 'GNU Affero General Public License v3.0 only',
        identifier: 'AGPL-3.0-only',
      },
    },
    servers: [{
      url: reference.baseUrl ?? '/api',
      description: edition === 'stable' ? 'Monica stable API' : 'Current Monica instance API',
    }],
    security: [{ bearerAuth: [] }],
    tags: resources.map(([name, resource]) => ({
      name,
      description: resource.description ?? `Monica ${name} operations.`,
    })),
    paths,
    components: {
      securitySchemes: { bearerAuth: securityScheme(edition) },
      schemas: buildComponentSchemas(),
    },
    'x-monica-edition': edition,
    'x-monica-source': source,
    'x-monica-contract': {
      resources: resources.length,
      operations,
      generatedBy: 'monica-cli api-research openapi',
    },
  };
}

/** Writes one OpenAPI document through the standard output/error contract. */
export function writeOpenApiDocument(
  edition: ApiEdition,
  version: OpenApiVersion,
  format: OutputFormat,
  builder: typeof buildOpenApiDocument = buildOpenApiDocument,
): void {
  try {
    console.log(fmt.formatOutput(builder(edition, version), format));
  } catch (caught) {
    console.error(fmt.formatError(caught as Error));
    process.exit(1);
  }
}

/** Attaches the OpenAPI export subcommand to API research. */
export function attachApiResearchOpenApiSubcommand(command: Command): void {
  command
    .command('openapi')
    .description('Export a provenance-rich OpenAPI document for a Monica API edition')
    .option('--edition <edition>', 'API edition: stable|next', parseApiEdition, 'stable')
    .option(
      '--oas-version <version>',
      'OpenAPI version: 3.2.0|3.1.2 (latest by default)',
      parseOpenApiVersion,
      '3.2.0',
    )
    .action(function (this: Command): void {
      const format: OutputFormat = resolveCommandOutputFormat(this);
      const options = this.opts() as { edition: ApiEdition; oasVersion: OpenApiVersion };
      writeOpenApiDocument(options.edition, options.oasVersion, format);
    });
}
