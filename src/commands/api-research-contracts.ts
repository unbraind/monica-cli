import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as fmt from '../formatters';
import { resolveCommandOutputFormat } from './output-format';
import type {
  ApiEdition,
  ComparableOperation,
  ContractDiffResult,
  ContractValidationResult,
  OpenApiDocument,
  OpenApiOperation,
} from './api-research-contract-types';
import { extractPathParameters } from './api-research-openapi-schema';
import {
  buildOpenApiDocument,
  parseApiEdition,
  parseOpenApiVersion,
} from './api-research-openapi';
import { buildSourceStatusPayload } from './api-research-source-status';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);
type OperationEntry = { method: string; path: string; operation: OpenApiOperation };

interface OperationIndex {
  entries: Map<string, OperationEntry>;
  comparable: Map<string, ComparableOperation>;
}

function documentOperations(
  document: OpenApiDocument,
): OperationEntry[] {
  return Object.entries(document.paths).flatMap(([path, pathItem]) =>
    Object.entries(pathItem).map(([method, operation]) => ({ method, path, operation })));
}

function indexOperations(document: OpenApiDocument): OperationIndex {
  const entries = new Map<string, OperationEntry>();
  const comparable = new Map<string, ComparableOperation>();
  documentOperations(document).forEach((entry) => {
    const key = `${entry.method.toUpperCase()} ${entry.path}`;
    entries.set(key, entry);
    comparable.set(key, {
      key,
      method: entry.method.toUpperCase(),
      path: entry.path,
      operationId: entry.operation.operationId,
      summary: entry.operation.summary,
    });
  });
  return { entries, comparable };
}

/** Validates the structural and Monica-specific invariants of a generated contract. */
export function validateOpenApiDocument(document: OpenApiDocument): ContractValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const operationIds = new Set<string>();
  const operations = documentOperations(document);

  if (document.openapi !== '3.2.0' && document.openapi !== '3.1.2') {
    errors.push(`Unsupported OpenAPI version: ${document.openapi}`);
  }
  if (!document['x-monica-source'].commit) errors.push('Source provenance has no commit');
  if (!document.components.securitySchemes.bearerAuth) {
    errors.push('Bearer security scheme is missing');
  }
  if (!document.info.license.identifier) errors.push('API source license is missing');
  if (operations.length !== document['x-monica-contract'].operations) {
    errors.push('Operation count does not match x-monica-contract metadata');
  }

  operations.forEach(({ method, path, operation }) => {
    const key = `${method.toUpperCase()} ${path}`;
    if (!HTTP_METHODS.has(method)) errors.push(`${key}: unsupported HTTP method`);
    if (operationIds.has(operation.operationId)) {
      errors.push(`${key}: duplicate operationId ${operation.operationId}`);
    }
    operationIds.add(operation.operationId);
    const declaredPathParameters = new Set(
      (operation.parameters ?? [])
        .filter((parameter) => parameter.in === 'path')
        .map((parameter) => String(parameter.name)),
    );
    extractPathParameters(path).forEach((name) => {
      if (!declaredPathParameters.has(name)) {
        errors.push(`${key}: path parameter {${name}} is not declared`);
      }
    });
    declaredPathParameters.forEach((name) => {
      if (!extractPathParameters(path).includes(name)) {
        errors.push(`${key}: declares unused path parameter ${name}`);
      }
    });
    if (!operation['x-monica-cli'].helpCommand.startsWith('monica ')) {
      errors.push(`${key}: executable CLI help mapping is missing`);
    }
    if (!operation.responses['401']) errors.push(`${key}: authenticated operation has no 401 response`);
    if (operation.requestBody?.['x-monica-contract-complete'] === false) {
      warnings.push(`${key}: request fields are not documented by the authoritative reference`);
    }
  });

  return {
    edition: document['x-monica-edition'],
    valid: errors.length === 0,
    operations: operations.length,
    paths: Object.keys(document.paths).length,
    errors,
    warnings,
  };
}

/** Flattens an OpenAPI document into stable operation identities. */
export function comparableOperations(document: OpenApiDocument): ComparableOperation[] {
  return Array.from(indexOperations(document).comparable.values())
    .sort((left, right) => left.key.localeCompare(right.key, 'en'));
}

function operationSignature(operation: OpenApiOperation): string {
  return JSON.stringify({
    summary: operation.summary,
    parameters: operation.parameters ?? [],
    requestBody: operation.requestBody ?? null,
    responses: operation.responses,
    security: operation.security,
  });
}

/** Finds operations whose method/path identity is stable but contract changed. */
function changedIndexedOperations(
  fromIndex: OperationIndex,
  toIndex: OperationIndex,
): Array<{ key: string; from: ComparableOperation; to: ComparableOperation }> {
  return Array.from(fromIndex.entries.entries())
    .filter(([key, entry]) => {
      const counterpart = toIndex.entries.get(key);
      return counterpart && operationSignature(entry.operation) !== operationSignature(counterpart.operation);
    })
    .map(([key]) => ({
      key,
      from: fromIndex.comparable.get(key)!,
      to: toIndex.comparable.get(key)!,
    }))
    .sort((left, right) => left.key.localeCompare(right.key, 'en'));
}

/** Finds operations whose method/path identity is stable but contract changed. */
export function changedContractOperations(
  fromDocument: OpenApiDocument,
  toDocument: OpenApiDocument,
): Array<{ key: string; from: ComparableOperation; to: ComparableOperation }> {
  return changedIndexedOperations(indexOperations(fromDocument), indexOperations(toDocument));
}

/** Builds a deterministic compatibility diff between two Monica editions. */
export function buildContractDiff(from: ApiEdition, to: ApiEdition): ContractDiffResult {
  const fromDocument = buildOpenApiDocument(from);
  const toDocument = buildOpenApiDocument(to);
  const fromIndex = indexOperations(fromDocument);
  const toIndex = indexOperations(toDocument);
  const added = Array.from(toIndex.comparable.values())
    .filter((entry) => !fromIndex.comparable.has(entry.key));
  const removed = Array.from(fromIndex.comparable.values())
    .filter((entry) => !toIndex.comparable.has(entry.key));
  const changed = changedIndexedOperations(fromIndex, toIndex);
  const unchanged = fromIndex.entries.size - removed.length - changed.length;
  const breakingChanges = removed.length + changed.length;
  return {
    generatedAt: new Date().toISOString(),
    from: {
      edition: from,
      commit: fromDocument['x-monica-source'].commit,
      operations: fromIndex.entries.size,
    },
    to: {
      edition: to,
      commit: toDocument['x-monica-source'].commit,
      operations: toIndex.entries.size,
    },
    summary: {
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      unchanged,
      breakingChanges,
    },
    added,
    removed,
    changed,
    breaking: breakingChanges > 0,
  };
}

/** Attaches contract validation and edition diff commands to API research. */
export function attachApiResearchContractSubcommands(command: Command): void {
  command
    .command('diff')
    .description('Compare two Monica API editions and classify compatibility changes')
    .option('--from <edition>', 'Source API edition: stable|next', parseApiEdition, 'stable')
    .option('--to <edition>', 'Target API edition: stable|next', parseApiEdition, 'next')
    .option('--fail-on-breaking', 'Exit with code 2 when removed or changed operations exist')
    .action(function (this: Command): void {
      try {
        const options = this.opts() as {
          from: ApiEdition;
          to: ApiEdition;
          failOnBreaking?: boolean;
        };
        const payload = buildContractDiff(options.from, options.to);
        console.log(fmt.formatOutput(payload, resolveCommandOutputFormat(this)));
        if (options.failOnBreaking && payload.breaking) process.exit(2);
      } catch (caught) {
        console.error(fmt.formatError(caught as Error));
        process.exit(1);
      }
    });

  command
    .command('validate-contract')
    .description('Validate generated edition contracts and optionally verify public source freshness')
    .option('--edition <edition>', 'API edition: stable|next', parseApiEdition, 'stable')
    .option('--oas-version <version>', 'OpenAPI version: 3.2.0|3.1.2', parseOpenApiVersion, '3.2.0')
    .option('--verify-source', 'Verify the bundled commit against the public Monica branch')
    .option('--fail-on-warnings', 'Exit with code 2 when validation warnings exist')
    .option('--fail-on-unavailable', 'With --verify-source, fail when upstream cannot be checked')
    .action(async function (this: Command): Promise<void> {
      try {
        const format: OutputFormat = resolveCommandOutputFormat(this);
        const options = this.opts() as {
          edition: ApiEdition;
          oasVersion: '3.2.0' | '3.1.2';
          verifySource?: boolean;
          failOnWarnings?: boolean;
          failOnUnavailable?: boolean;
        };
        const validation = validateOpenApiDocument(
          buildOpenApiDocument(options.edition, options.oasVersion),
        );
        const sourceStatus = options.verifySource
          ? await buildSourceStatusPayload({
            edition: options.edition,
            failOnStale: true,
            failOnUnavailable: options.failOnUnavailable,
          })
          : null;
        if (sourceStatus?.state === 'stale') validation.errors.push('Bundled source is stale');
        if (sourceStatus?.state === 'unavailable') {
          const message = 'Upstream source freshness is unavailable';
          if (options.failOnUnavailable) validation.errors.push(message);
          else validation.warnings.push(message);
        }
        validation.valid = validation.errors.length === 0;
        const failed = !validation.valid
          || (options.failOnWarnings === true && validation.warnings.length > 0);
        console.log(fmt.formatOutput({
          generatedAt: new Date().toISOString(),
          validation,
          sourceStatus,
          gate: {
            failed,
            failOnWarnings: options.failOnWarnings === true,
            failOnUnavailable: options.failOnUnavailable === true,
          },
        }, format));
        if (failed) process.exit(2);
      } catch (caught) {
        console.error(fmt.formatError(caught as Error));
        process.exit(1);
      }
    });
}
