import type {
  CommandArgumentDescriptor,
  CommandCatalogNode,
  CommandOptionDescriptor,
} from './command-catalog';

/** Describes the open ai function parameter data contract. */
export interface OpenAIFunctionParameter {
  type: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, OpenAIFunctionParameter>;
  required?: string[];
  items?: OpenAIFunctionParameter;
  default?: unknown;
}

/** Describes the open ai function schema data contract. */
export interface OpenAIFunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, OpenAIFunctionParameter>;
    required: string[];
  };
}

/** Describes one executable leaf and its effective inherited options. */
export interface ExecutableCommandContract {
  node: CommandCatalogNode;
  options: CommandOptionDescriptor[];
}

const NUMERIC_OPTION_VALUE_NAMES = new Set([
  'age',
  'amount',
  'contact-id',
  'day',
  'days',
  'frequency',
  'id',
  'latitude',
  'limit',
  'longitude',
  'month',
  'month-offset',
  'ms',
  'n',
  'number',
  'page',
  'pages',
  'photo-id',
  'seconds',
  'year',
  'years',
]);

function normalizeParameterName(name: string): string {
  return name.replace(/-/g, '_');
}

function buildSchemaParameter(option: CommandOptionDescriptor): { name: string; parameter: OpenAIFunctionParameter; required: boolean } | null {
  const flagMatch = option.flags.match(/--([a-zA-Z0-9-]+)/);
  if (!flagMatch) return null;

  const name = normalizeParameterName(flagMatch[1]);
  const description = option.description;
  const takesValue = /<[^>]+>/.test(option.flags);
  const valueName = option.flags.match(/<([^>]+)>/)?.[1];
  const required = option.required === true && takesValue && option.defaultValue === undefined;
  let type = takesValue ? 'string' : 'boolean';
  let enumValues: string[] | undefined;

  if (valueName !== undefined && NUMERIC_OPTION_VALUE_NAMES.has(valueName)) {
    type = 'number';
  } else if (valueName === 'boolean') {
    type = 'boolean';
  } else if (valueName === 'format') {
    type = 'string';
    enumValues = ['toon', 'json', 'yaml', 'table', 'md'];
  }

  const parameter: OpenAIFunctionParameter = {
    type,
    description,
  };
  if (enumValues) {
    parameter.enum = enumValues;
  }
  if (option.defaultValue !== undefined) {
    parameter.default = option.defaultValue;
  }

  return { name, parameter, required };
}

/** Executes the command to open ai function operation. */
export function commandToOpenAIFunction(
  name: string,
  description: string,
  options: CommandOptionDescriptor[],
  arguments_: CommandArgumentDescriptor[] = [],
): OpenAIFunctionSchema {
  const properties: Record<string, OpenAIFunctionParameter> = {};
  const required: string[] = [];

  arguments_.forEach((argument) => {
    const name = normalizeParameterName(argument.name);
    properties[name] = argument.variadic
      ? {
          type: 'array',
          description: `${argument.required ? 'Required' : 'Optional'} variadic positional argument <${argument.name}>`,
          items: { type: 'string' },
        }
      : {
          type: 'string',
          description: `${argument.required ? 'Required' : 'Optional'} positional argument <${argument.name}>`,
        };
    if (argument.required) required.push(name);
  });

  options.forEach((option) => {
    const schemaParameter = buildSchemaParameter(option);
    if (!schemaParameter) return;

    properties[schemaParameter.name] = schemaParameter.parameter;
    if (schemaParameter.required && !option.description.toLowerCase().includes('optional')) {
      required.push(schemaParameter.name);
    }
  });

  return {
    name: `monica_${name.replace(/\s+/g, '_').replace(/-/g, '_')}`,
    description: description.substring(0, 1024),
    parameters: {
      type: 'object',
      properties,
      required,
    },
  };
}

/** Executes the walk command catalog operation. */
export function walkCommandCatalog(
  node: CommandCatalogNode,
  visitor: (node: CommandCatalogNode) => void
): void {
  visitor(node);
  node.subcommands.forEach((subcommand) => walkCommandCatalog(subcommand, visitor));
}

/** Collects leaf commands. */
export function collectLeafCommands(node: CommandCatalogNode): CommandCatalogNode[] {
  const leaves: CommandCatalogNode[] = [];
  walkCommandCatalog(node, (entry) => {
    if (entry.subcommands.length === 0) {
      leaves.push(entry);
    }
  });
  return leaves;
}

/** Collect executable leaves with root and parent options merged by long flag. */
export function collectExecutableCommandContracts(root: CommandCatalogNode): ExecutableCommandContract[] {
  const contracts: ExecutableCommandContract[] = [];
  const visit = (node: CommandCatalogNode, inherited: CommandOptionDescriptor[]): void => {
    const effective = new Map<string, CommandOptionDescriptor>();
    [...inherited, ...node.options].forEach((option) => {
      if (option.flags.includes('--version')) return;
      const key = option.flags.match(/--[a-zA-Z0-9-]+/)?.[0] ?? option.flags;
      effective.set(key, option);
    });
    const options = [...effective.values()];
    if (node.subcommands.length === 0) {
      contracts.push({ node, options });
      return;
    }
    node.subcommands.forEach((child) => visit(child, options));
  };
  visit(root, []);
  return contracts;
}
