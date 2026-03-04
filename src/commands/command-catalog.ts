import { Command } from 'commander';
import type { CapabilityReport } from '../api';

export interface CommandOptionDescriptor {
  flags: string;
  description: string;
  defaultValue?: unknown;
}

export interface CommandArgumentDescriptor {
  name: string;
  required: boolean;
  variadic: boolean;
}

export interface CommandCatalogNode {
  name: string;
  fullCommand: string;
  usage: string;
  helpCommand: string;
  description: string;
  aliases: string[];
  arguments: CommandArgumentDescriptor[];
  options: CommandOptionDescriptor[];
  safety: CommandSafetyDescriptor;
  availability?: CommandAvailabilityDescriptor;
  subcommands: CommandCatalogNode[];
}

export interface CommandSafetyDescriptor {
  operation: 'read' | 'write' | 'mixed' | 'meta';
  mutatesData: boolean;
  readOnlyCompatible: boolean;
}

export interface CommandAvailabilityDescriptor {
  supportedOnInstance: boolean;
  statusCode: number;
  endpoint: string;
  message: string;
}

export interface CommandCapabilitySupport {
  supported: boolean;
  statusCode: number;
  endpoint: string;
  message: string;
}

export interface BuildCommandCatalogOptions {
  capabilitySupportByCommandRoot?: Record<string, CommandCapabilitySupport>;
}

const WRITE_COMMAND_HINTS = [
  'create',
  'update',
  'delete',
  'set',
  'unset',
  'clear',
  'attach',
  'detach',
  'complete',
  'add-message',
  'associate-photo',
  'sign-compliance',
  'birthdate',
  'deceased',
  'stay-in-touch',
  'first-met',
  'food-preferences',
  'career',
  'set-avatar',
  'delete-avatar',
  'sign',
  'tag',
  'star',
];

const META_COMMANDS = ['help', 'version', 'config', 'info', 'schemas'];

function toOptionDescriptor(option: { flags: string; description?: string; defaultValue?: unknown }): CommandOptionDescriptor {
  return {
    flags: option.flags,
    description: option.description || '',
    defaultValue: option.defaultValue,
  };
}

function toArgumentDescriptor(argument: { name: () => string; required?: boolean; variadic?: boolean }): CommandArgumentDescriptor {
  return {
    name: argument.name(),
    required: argument.required === true,
    variadic: argument.variadic === true,
  };
}

function isWriteLikeCommand(commandName: string): boolean {
  return WRITE_COMMAND_HINTS.some((hint) => commandName === hint || commandName.startsWith(`${hint}-`));
}

function isMetaCommand(commandName: string): boolean {
  return META_COMMANDS.includes(commandName);
}

function resolveAvailability(
  fullCommand: string,
  options?: BuildCommandCatalogOptions
): CommandAvailabilityDescriptor | undefined {
  const supportMap = options?.capabilitySupportByCommandRoot;
  if (!supportMap) return undefined;

  const segments = fullCommand.trim().split(/\s+/);
  if (segments.length < 2) return undefined;
  const commandRoot = segments[1];
  const support = supportMap[commandRoot];
  if (!support) return undefined;

  return {
    supportedOnInstance: support.supported,
    statusCode: support.statusCode,
    endpoint: support.endpoint,
    message: support.message,
  };
}

function mergeSafety(commandName: string, childSafety: CommandSafetyDescriptor[]): CommandSafetyDescriptor {
  const hasChildren = childSafety.length > 0;
  const selfMutates = isWriteLikeCommand(commandName);
  const childMutates = childSafety.some((child) => child.mutatesData);
  const mutatesData = selfMutates || childMutates;

  if (!hasChildren) {
    if (isMetaCommand(commandName)) {
      return {
        operation: 'meta',
        mutatesData: false,
        readOnlyCompatible: true,
      };
    }
    return {
      operation: selfMutates ? 'write' : 'read',
      mutatesData,
      readOnlyCompatible: !mutatesData,
    };
  }

  const childOperations = new Set(childSafety.map((child) => child.operation));
  const onlyMetaChildren = childOperations.size === 1 && childOperations.has('meta');
  if (onlyMetaChildren && isMetaCommand(commandName)) {
    return {
      operation: 'meta',
      mutatesData,
      readOnlyCompatible: !mutatesData,
    };
  }

  const operation: CommandSafetyDescriptor['operation'] =
    mutatesData && childSafety.some((child) => child.operation === 'read') ? 'mixed'
      : mutatesData ? 'write'
        : 'read';

  return {
    operation,
    mutatesData,
    readOnlyCompatible: !mutatesData,
  };
}

export function buildCapabilitySupportIndex(report: CapabilityReport): Record<string, CommandCapabilitySupport> {
  const index: Record<string, CommandCapabilitySupport> = {};
  report.probes.forEach((probe) => {
    const root = probe.command.split(' ')[0];
    const existing = index[root];
    if (!existing) {
      index[root] = {
        supported: probe.supported,
        statusCode: probe.statusCode,
        endpoint: probe.endpoint,
        message: probe.message,
      };
      return;
    }

    if (!existing.supported && probe.supported) {
      index[root] = {
        supported: true,
        statusCode: probe.statusCode,
        endpoint: probe.endpoint,
        message: probe.message,
      };
    }
  });
  return index;
}

export function buildCommandCatalog(command: Command, parentPath = '', buildOptions?: BuildCommandCatalogOptions): CommandCatalogNode {
  const commandName = command.name();
  const fullCommand = parentPath ? `${parentPath} ${commandName}` : commandName;
  const usage = `${fullCommand} ${command.usage()}`.trim();
  const helpCommand = `${fullCommand} --help`;
  const subcommands = command.commands.map((subcommand) => buildCommandCatalog(subcommand, fullCommand, buildOptions));
  const safety = mergeSafety(commandName, subcommands.map((subcommand) => subcommand.safety));
  const availability = resolveAvailability(fullCommand, buildOptions);
  const optionDescriptors = command.options.map((option) => toOptionDescriptor({
    flags: option.flags,
    description: option.description,
    defaultValue: option.defaultValue,
  }));
  const args = command.registeredArguments.map((argument) => toArgumentDescriptor({
    name: () => argument.name(),
    required: argument.required,
    variadic: argument.variadic,
  }));

  return {
    name: commandName,
    fullCommand,
    usage,
    helpCommand,
    description: command.description(),
    aliases: command.aliases(),
    arguments: args,
    options: optionDescriptors,
    safety,
    availability,
    subcommands,
  };
}
