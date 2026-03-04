import type { CommandCatalogNode, CommandOptionDescriptor } from './command-catalog';

export interface OpenAIFunctionParameter {
  type: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, OpenAIFunctionParameter>;
  required?: string[];
  items?: OpenAIFunctionParameter;
  default?: unknown;
}

export interface OpenAIFunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, OpenAIFunctionParameter>;
    required: string[];
  };
}

function buildSchemaParameter(option: CommandOptionDescriptor): { name: string; parameter: OpenAIFunctionParameter; required: boolean } | null {
  const flagMatch = option.flags.match(/--([a-zA-Z0-9-]+)/);
  if (!flagMatch) return null;

  const name = flagMatch[1].replace(/-/g, '_');
  const description = option.description;
  const isRequiredDescription = /\brequired\b/i.test(description);
  const takesValue = /<[^>]+>/.test(option.flags);
  const required = isRequiredDescription && takesValue && option.defaultValue === undefined;
  let type = 'string';
  let enumValues: string[] | undefined;

  if (option.flags.includes('<number>') || option.flags.includes('<n>')) {
    type = 'number';
  } else if (option.flags.includes('<boolean>')) {
    type = 'boolean';
  } else if (description.toLowerCase().includes('format')) {
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

export function commandToOpenAIFunction(
  name: string,
  description: string,
  options: CommandOptionDescriptor[]
): OpenAIFunctionSchema {
  const properties: Record<string, OpenAIFunctionParameter> = {};
  const required: string[] = [];

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

export function walkCommandCatalog(
  node: CommandCatalogNode,
  visitor: (node: CommandCatalogNode) => void
): void {
  visitor(node);
  node.subcommands.forEach((subcommand) => walkCommandCatalog(subcommand, visitor));
}

export function collectLeafCommands(node: CommandCatalogNode): CommandCatalogNode[] {
  const leaves: CommandCatalogNode[] = [];
  walkCommandCatalog(node, (entry) => {
    if (entry.subcommands.length === 0) {
      leaves.push(entry);
    }
  });
  return leaves;
}
