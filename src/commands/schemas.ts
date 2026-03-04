import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import type { OutputFormat } from '../types';
import * as fmt from '../formatters';
import { validateValueAgainstSchema } from './schema-validator';
import { resolveCommandOutputFormat } from './output-format';
import { OUTPUT_SCHEMAS, findSchema } from './schema-registry';
import { generateSampleFromSchema } from './schema-example';

type InputFormat = 'auto' | 'json' | 'yaml' | 'yml';

function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}

function getActionCommand(command?: Command): Command {
  return command || new Command();
}

function resolveInputFormat(inputPath: string | undefined, inputFormat: InputFormat): Exclude<InputFormat, 'auto'> {
  if (inputFormat !== 'auto') return inputFormat;
  if (!inputPath) return 'json';
  const ext = path.extname(inputPath).toLowerCase();
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  return 'json';
}

function parseValidationInput(raw: string, inputFormat: Exclude<InputFormat, 'auto'>): unknown {
  if (inputFormat === 'json') {
    return JSON.parse(raw) as unknown;
  }
  return parseYaml(raw) as unknown;
}

function readValidationInput(inputPath: string | undefined, inputFormat: InputFormat): unknown {
  const raw = inputPath
    ? fs.readFileSync(inputPath, 'utf-8')
    : fs.readFileSync(0, 'utf-8');

  if (!raw.trim()) {
    throw new Error('Input payload is empty. Provide JSON via file path or stdin.');
  }

  const resolvedFormat = resolveInputFormat(inputPath, inputFormat);
  try {
    return parseValidationInput(raw, resolvedFormat);
  } catch {
    if (resolvedFormat === 'json' && inputFormat === 'auto' && !inputPath) {
      try {
        return parseValidationInput(raw, 'yaml');
      } catch {
        // Fall through to error below.
      }
    }
    throw new Error(`Input payload is not valid ${resolvedFormat === 'yaml' ? 'YAML' : 'JSON'}.`);
  }
}

export function createSchemasCommand(): Command {
  const cmd = new Command('schemas')
    .description('Machine-readable output schemas for automation and agents')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  cmd
    .command('list')
    .description('List available output schema descriptors')
    .action(function (this: Command): void {
      const format = getOutputFormat(getActionCommand(this));
      const schemas = OUTPUT_SCHEMAS.map((schema) => ({
        id: schema.id,
        title: schema.title,
        description: schema.description,
      }));
      console.log(fmt.formatOutput({ total: schemas.length, schemas }, format));
    });

  cmd
    .command('get <schema-id>')
    .description('Get a specific output schema descriptor')
    .action(function (this: Command, schemaId: string): void {
      const actionCommand = getActionCommand(this);
      const format = getOutputFormat(actionCommand);
      const schema = findSchema(schemaId);

      if (!schema) {
        console.log(fmt.formatOutput({
          ok: false,
          message: `Unknown schema id: ${schemaId}`,
          availableSchemaIds: OUTPUT_SCHEMAS.map((item) => item.id),
        }, format));
        process.exit(1);
      }

      console.log(fmt.formatOutput({
        ok: true,
        schema,
      }, format));
    });

  cmd
    .command('sample <schema-id>')
    .description('Generate a deterministic example payload for a registered schema')
    .action(function (this: Command, schemaId: string): void {
      const actionCommand = getActionCommand(this);
      const format = getOutputFormat(actionCommand);
      const schema = findSchema(schemaId);

      if (!schema) {
        console.log(fmt.formatOutput({
          ok: false,
          message: `Unknown schema id: ${schemaId}`,
          availableSchemaIds: OUTPUT_SCHEMAS.map((item) => item.id),
        }, format));
        process.exit(1);
      }

      console.log(fmt.formatOutput({
        ok: true,
        schemaId: schema.id,
        sample: generateSampleFromSchema(schema.schema),
      }, format));
    });

  cmd
    .command('validate <schema-id> [input-path]')
    .description('Validate input payload (JSON/YAML from file or stdin) against a registered schema')
    .option('--input-format <format>', 'Input payload format (auto|json|yaml|yml)', 'auto')
    .action(function (this: Command, schemaId: string, inputPath?: string): void {
      const actionCommand = getActionCommand(this);
      const format = getOutputFormat(actionCommand);
      const schema = findSchema(schemaId);
      const optionBag = actionCommand.opts() as { inputFormat?: string };
      const inputFormat = (optionBag.inputFormat || 'auto').toLowerCase() as InputFormat;

      if (!schema) {
        console.log(fmt.formatOutput({
          ok: false,
          message: `Unknown schema id: ${schemaId}`,
          availableSchemaIds: OUTPUT_SCHEMAS.map((item) => item.id),
        }, format));
        process.exit(1);
      }

      try {
        const payload = readValidationInput(inputPath, inputFormat);
        const errors = validateValueAgainstSchema(payload, schema.schema);
        const result = {
          ok: errors.length === 0,
          schemaId: schema.id,
          inputFormat: resolveInputFormat(inputPath, inputFormat),
          errors,
        };
        console.log(fmt.formatOutput(result, format));
        if (errors.length > 0) {
          process.exit(1);
        }
      } catch (error) {
        console.log(fmt.formatOutput({
          ok: false,
          schemaId: schema.id,
          inputFormat: resolveInputFormat(inputPath, inputFormat),
          message: (error as Error).message,
          errors: [{ path: '$', message: (error as Error).message }],
        }, format));
        process.exit(1);
      }
    });

  return cmd;
}
