import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as fmt from '../formatters';
import { get } from '../api/client';
import { parsePositiveInt } from './info-capabilities';
import { resolveCommandOutputFormat } from './output-format';
import {
  type ApiReferenceDocument,
  loadSelectedReference,
  parseSourceOption,
  type ReferenceSelection,
} from './api-research-shared';

interface ApiErrorLike {
  message: string;
  statusCode: number;
}

interface EndpointProbe {
  resource: string;
  key: string;
  method: string;
  referencePath: string;
  probePath: string;
  probeParams?: Record<string, string | number>;
  parameterized: boolean;
  status: 'supported' | 'unsupported' | 'unknown-id' | 'error';
  supported: boolean | null;
  statusCode: number;
  message: string;
}

interface ProbeRequest {
  path: string;
  params?: Record<string, string | number>;
}

export interface ApiResearchProbeOptions {
  resource?: string;
  source?: string;
  includeParameterized?: boolean;
  idReplacement?: number;
}

export interface ApiResearchProbePayload {
  generatedAt: string;
  sourceFile: string;
  sourceFormat: 'api-reference' | 'monica-api-reference';
  options: {
    resource: string | null;
    includeParameterized: boolean;
    idReplacement: number;
  };
  summary: {
    total: number;
    supported: number;
    unsupported: number;
    unknownId: number;
    errors: number;
  };
  probes: EndpointProbe[];
}

function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}

function getActionCommand(command?: Command): Command {
  return command || new Command();
}

function hasPathParameter(endpointPath: string): boolean {
  return /:[a-z0-9_]+/i.test(endpointPath);
}

function resolveProbePath(endpointPath: string, idReplacement: number): string {
  return endpointPath.replace(/:[a-z0-9_]+/gi, String(idReplacement));
}

function toApiErrorLike(error: unknown): ApiErrorLike | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as { message?: unknown; statusCode?: unknown };
  if (typeof candidate.message !== 'string') return null;
  if (typeof candidate.statusCode !== 'number') return null;
  return {
    message: candidate.message,
    statusCode: candidate.statusCode,
  };
}

function getGetEndpoints(doc: ApiReferenceDocument, resourceFilter?: string): Array<{ resource: string; key: string; path: string }> {
  const normalizedFilter = resourceFilter?.trim().toLowerCase();
  return Object.entries(doc.endpoints || {})
    .filter(([resource]) => !normalizedFilter || resource.toLowerCase().includes(normalizedFilter))
    .flatMap(([resource, definition]) => Object.entries(definition.methods || {})
      .filter(([, method]) => (method.method || 'UNKNOWN').toUpperCase() === 'GET')
      .map(([key, method]) => ({
        resource,
        key,
        path: method.path || '',
      })));
}

function resolveProbeRequest(
  resource: string,
  key: string,
  endpointPath: string,
  idReplacement: number
): ProbeRequest {
  if (resource === 'contacts' && key === 'search') {
    return {
      path: '/contacts',
      params: {
        query: 'a',
        limit: 1,
      },
    };
  }
  return {
    path: resolveProbePath(endpointPath, idReplacement),
  };
}

async function probeEndpoint(
  resource: string,
  key: string,
  endpointPath: string,
  idReplacement: number
): Promise<EndpointProbe> {
  const parameterized = hasPathParameter(endpointPath);
  const probeRequest = resolveProbeRequest(resource, key, endpointPath, idReplacement);
  const probePath = probeRequest.path;
  const probeParams = probeRequest.params;
  try {
    if (probeParams) {
      await get<unknown>(probePath, probeParams);
    } else {
      await get<unknown>(probePath);
    }
    return {
      resource,
      key,
      method: 'GET',
      referencePath: endpointPath,
      probePath,
      probeParams,
      parameterized,
      status: 'supported',
      supported: true,
      statusCode: 200,
      message: 'OK',
    };
  } catch (error) {
    const apiError = toApiErrorLike(error);
    if (!apiError) {
      return {
        resource,
        key,
        method: 'GET',
        referencePath: endpointPath,
        probePath,
        probeParams,
        parameterized,
        status: 'error',
        supported: false,
        statusCode: 0,
        message: (error as Error).message || 'Unknown error',
      };
    }

    if (parameterized && apiError.statusCode === 404) {
      return {
        resource,
        key,
        method: 'GET',
        referencePath: endpointPath,
        probePath,
        probeParams,
        parameterized,
        status: 'unknown-id',
        supported: null,
        statusCode: apiError.statusCode,
        message: apiError.message,
      };
    }

    return {
      resource,
      key,
      method: 'GET',
      referencePath: endpointPath,
      probePath,
      probeParams,
      parameterized,
      status: 'unsupported',
      supported: false,
      statusCode: apiError.statusCode,
      message: apiError.message,
    };
  }
}

export async function buildProbePayload(options: ApiResearchProbeOptions): Promise<ApiResearchProbePayload> {
  const sourceSelection: ReferenceSelection = parseSourceOption(options.source || 'auto');
  const doc = loadSelectedReference(sourceSelection);
  const candidates = getGetEndpoints(doc, options.resource)
    .filter((endpoint) => options.includeParameterized || !hasPathParameter(endpoint.path));

  const results: EndpointProbe[] = [];
  for (const endpoint of candidates) {
    results.push(await probeEndpoint(
      endpoint.resource,
      endpoint.key,
      endpoint.path,
      options.idReplacement || 1
    ));
  }

  const summary = {
    total: results.length,
    supported: results.filter((result) => result.status === 'supported').length,
    unsupported: results.filter((result) => result.status === 'unsupported').length,
    unknownId: results.filter((result) => result.status === 'unknown-id').length,
    errors: results.filter((result) => result.status === 'error').length,
  };

  return {
    generatedAt: new Date().toISOString(),
    sourceFile: sourceSelection.path,
    sourceFormat: sourceSelection.format,
    options: {
      resource: options.resource || null,
      includeParameterized: options.includeParameterized === true,
      idReplacement: options.idReplacement || 1,
    },
    summary,
    probes: results,
  };
}

export function attachApiResearchProbeSubcommand(cmd: Command): void {
  cmd
    .command('probe')
    .description('Read-only probe of documented GET endpoints against the current Monica instance')
    .option('--resource <name>', 'Filter by resource name (case-insensitive substring)')
    .option('--source <source>', 'Reference source: auto|api|monica|<custom-json-path>', 'auto')
    .option('--include-parameterized', 'Probe GET endpoints with :id-style path params by replacing params with --id-replacement')
    .option('--id-replacement <id>', 'Replacement id used for parameterized endpoint probing (default: 1)', parsePositiveInt, 1)
    .option('--fail-on-unsupported', 'Exit with code 1 when unsupported endpoints are detected')
    .action(async function (this: Command): Promise<void> {
      const actionCommand = getActionCommand(this);
      const format = getOutputFormat(actionCommand);

      try {
        const options = actionCommand.opts() as ApiResearchProbeOptions & { failOnUnsupported?: boolean };
        const payload = await buildProbePayload(options);

        console.log(fmt.formatOutput(payload, format));

        if (options.failOnUnsupported && payload.summary.unsupported > 0) {
          process.exit(1);
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });
}
