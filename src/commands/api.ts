import { Command } from 'commander';
import { readFileSync } from 'fs';
import { basename } from 'path';
import { getConfig, request, upload } from '../api/client';
import * as fmt from '../formatters';
import { runCommandAction } from './crud-command';
import { parseApiEdition } from './api-research-openapi';
import type { ApiEdition } from './api-research-contract-types';
import {
  buildApiEndpoint,
  collectApiInput,
  inspectApiOperation,
  getApiRequestContentType,
  parseApiBody,
  parseApiInputs,
  resolveApiOperation,
  validateApiMultipartInputs,
} from './api-operation';
import { resolveCommandOutputFormat } from './output-format';

interface ApiCommandOptions {
  edition: ApiEdition;
  param: string[];
  query: string[];
  body?: string;
  form?: string[];
  file?: string[];
  confirm?: boolean;
}

function configureInputs(command: Command): Command {
  return command
    .option('--edition <edition>', 'API edition: stable|next', parseApiEdition, 'stable')
    .option('--param <key=value>', 'Path parameter (repeatable)', collectApiInput, [])
    .option('--query <key=value>', 'Query parameter (repeatable)', collectApiInput, []);
}

async function executeApiOperation(
  command: Command,
  operationId: string,
  options: ApiCommandOptions,
  expected: 'read' | 'mutation',
): Promise<void> {
  await runCommandAction(async () => {
    const resolved = resolveApiOperation(operationId, options.edition);
    if (expected === 'read' && resolved.method !== 'GET') {
      throw new Error(`${operationId} uses ${resolved.method}; run it with monica api mutate`);
    }
    if (expected === 'mutation' && resolved.method === 'GET') {
      throw new Error(`${operationId} uses GET; run it with monica api get`);
    }
    if (expected === 'mutation' && options.confirm !== true) {
      throw new Error('Mutation execution requires --confirm');
    }
    const target = buildApiEndpoint(
      resolved,
      parseApiInputs(options.param, 'path parameter'),
      parseApiInputs(options.query, 'query parameter'),
    );
    const contentType = getApiRequestContentType(resolved);
    let result: unknown;
    if (contentType === 'multipart/form-data') {
      if (options.body !== undefined) throw new Error('Multipart operations use --form and --file, not --body');
      const fields = parseApiInputs(options.form!, 'multipart form field');
      const files = parseApiInputs(options.file!, 'multipart file field');
      validateApiMultipartInputs(resolved, fields, files);
      if (getConfig().readOnlyMode) {
        throw new Error(`Read-only mode enabled: blocked ${resolved.method} ${target.endpoint}`);
      }
      const form = new FormData();
      Object.entries(fields).forEach(([name, value]) => form.append(name, value));
      Object.entries(files).forEach(([name, filePath]) => {
        const bytes = new Uint8Array(readFileSync(filePath));
        form.append(name, new Blob([bytes]), basename(filePath));
      });
      result = await upload<unknown>(target.endpoint, form, target.query);
    } else {
      if ((options.form?.length ?? 0) > 0 || (options.file?.length ?? 0) > 0) {
        throw new Error('JSON and bodyless operations do not accept --form or --file');
      }
      const body = parseApiBody(resolved, options.body);
      result = await request<unknown>(target.endpoint, {
        method: resolved.method,
        params: target.query,
        body,
      });
    }
    console.log(fmt.formatOutput(result, resolveCommandOutputFormat(command)));
  });
}

/** Creates exact OpenAPI operation inspection and execution commands. */
export function createApiCommand(): Command {
  const command = new Command('api')
    .description('Inspect or execute an exact bundled Monica OpenAPI operation')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  command.command('inspect <operationId>')
    .description('Inspect one exact operation without contacting Monica')
    .option('--edition <edition>', 'API edition: stable|next', parseApiEdition, 'stable')
    .action(function (this: Command, operationId: string): void {
      const options = this.opts() as Pick<ApiCommandOptions, 'edition'>;
      try {
        const result = inspectApiOperation(resolveApiOperation(operationId, options.edition));
        console.log(fmt.formatOutput(result, resolveCommandOutputFormat(this)));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  configureInputs(command.command('get <operationId>')
    .description('Execute one exact GET operation with declared input validation'))
    .action(async function (this: Command, operationId: string): Promise<void> {
      await executeApiOperation(this, operationId, this.opts() as ApiCommandOptions, 'read');
    });

  configureInputs(command.command('mutate <operationId>')
    .description('Execute one exact non-GET operation with explicit confirmation'))
    .option('--body <json>', 'JSON request body for operations that declare one')
    .option('--form <key=value>', 'Multipart scalar field (repeatable)', collectApiInput, [])
    .option('--file <key=path>', 'Multipart file field (repeatable)', collectApiInput, [])
    .option('--confirm', 'Confirm the remote Monica mutation')
    .action(async function (this: Command, operationId: string): Promise<void> {
      await executeApiOperation(this, operationId, this.opts() as ApiCommandOptions, 'mutation');
    });

  return command;
}
