import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as fmt from '../formatters';
import { buildCapabilitySupportIndex, buildCommandCatalog, type CommandCatalogNode } from './command-catalog';
import * as infoCapabilities from './info-capabilities';
import { resolveCommandOutputFormat } from './output-format';
import { collectLeafCommands, commandToOpenAIFunction, walkCommandCatalog, type OpenAIFunctionSchema } from './agent-tools-shared';

function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}
interface SafeCommandDescriptor {
  command: string;
  operation: 'read' | 'write' | 'mixed' | 'meta';
  mutatesData: boolean;
  readOnlyCompatible: boolean;
  supportedOnInstance?: boolean;
}

interface ExcludedSafeCommandDescriptor {
  command: string;
  reason: 'instance-unsupported';
  operation: 'read' | 'write' | 'mixed' | 'meta';
  mutatesData: boolean;
  readOnlyCompatible: boolean;
  statusCode?: number;
  endpoint?: string;
  message?: string;
}

export function createAgentToolsCommand(): Command {
  const cmd = new Command('agent-tools')
    .description('Export agent/LLM integration schemas')
    .option('-f, --format <format>', 'Output format (toon|json|yaml)', 'json');

  const exportOpenAi = async (actionCommand: Command): Promise<void> => {
    const format = getOutputFormat(actionCommand);

    try {
      const root = actionCommand.parent?.parent || actionCommand.parent || actionCommand;
      const catalog = buildCommandCatalog(root);

      const functions: OpenAIFunctionSchema[] = [];
      walkCommandCatalog(catalog, (node) => {
        if (node.options && node.options.length > 0) {
          const schema = commandToOpenAIFunction(
            node.fullCommand.replace('monica ', ''),
            node.description,
            node.options
          );
          functions.push(schema);
        }
      });

      console.log(fmt.formatOutput({
        generatedAt: new Date().toISOString(),
        totalFunctions: functions.length,
        functions,
      }, format));
    } catch (error) {
      console.error(fmt.formatError(error as Error));
      process.exit(1);
    }
  };

  const exportAnthropic = async (actionCommand: Command): Promise<void> => {
    const format = getOutputFormat(actionCommand);

    try {
      const root = actionCommand.parent?.parent || actionCommand.parent || actionCommand;
      const catalog = buildCommandCatalog(root);

      const tools: Array<{ name: string; description: string; input_schema: OpenAIFunctionSchema['parameters'] }> = [];
      walkCommandCatalog(catalog, (node) => {
        if (node.options && node.options.length > 0) {
          const func = commandToOpenAIFunction(
            node.fullCommand.replace('monica ', ''),
            node.description,
            node.options
          );
          tools.push({
            name: func.name,
            description: func.description,
            input_schema: func.parameters,
          });
        }
      });

      console.log(fmt.formatOutput({
        generatedAt: new Date().toISOString(),
        totalTools: tools.length,
        tools,
      }, format));
    } catch (error) {
      console.error(fmt.formatError(error as Error));
      process.exit(1);
    }
  };

  const exportSafeCommands = async (actionCommand: Command): Promise<void> => {
    const format = getOutputFormat(actionCommand);

    try {
      const root = actionCommand.parent?.parent || actionCommand.parent || actionCommand;
      const options = actionCommand.opts() as { instanceAware?: boolean };

      let capabilitySource: 'cache' | 'live' | undefined;
      let capabilityGeneratedAt: string | undefined;
      let capabilitySupportByCommandRoot: ReturnType<typeof buildCapabilitySupportIndex> | undefined;
      if (options.instanceAware) {
        const capabilityResult = await infoCapabilities.resolveCapabilityReportWithSource(actionCommand);
        capabilitySource = capabilityResult.source;
        capabilityGeneratedAt = capabilityResult.report.generatedAt;
        capabilitySupportByCommandRoot = buildCapabilitySupportIndex(capabilityResult.report);
      }

      const catalog = buildCommandCatalog(root, '', { capabilitySupportByCommandRoot });
      const safeCommands: SafeCommandDescriptor[] = [];
      const excludedCommands: ExcludedSafeCommandDescriptor[] = [];

      const visit = (node: CommandCatalogNode): void => {
        if (node.subcommands.length === 0) {
          const descriptor: SafeCommandDescriptor = {
            command: node.fullCommand,
            operation: node.safety.operation,
            mutatesData: node.safety.mutatesData,
            readOnlyCompatible: node.safety.readOnlyCompatible,
            supportedOnInstance: node.availability?.supportedOnInstance,
          };
          if (descriptor.readOnlyCompatible && descriptor.supportedOnInstance === false) {
            excludedCommands.push({
              command: descriptor.command,
              reason: 'instance-unsupported',
              operation: descriptor.operation,
              mutatesData: descriptor.mutatesData,
              readOnlyCompatible: descriptor.readOnlyCompatible,
              statusCode: node.availability?.statusCode,
              endpoint: node.availability?.endpoint,
              message: node.availability?.message,
            });
          } else if (descriptor.readOnlyCompatible) {
            safeCommands.push(descriptor);
          }
          return;
        }
        node.subcommands.forEach(visit);
      };

      visit(catalog);

      safeCommands.sort((a, b) => a.command.localeCompare(b.command));
      excludedCommands.sort((a, b) => a.command.localeCompare(b.command));
      console.log(fmt.formatOutput({
        generatedAt: new Date().toISOString(),
        instanceCapabilities: options.instanceAware ? {
          enabled: true,
          source: capabilitySource,
          generatedAt: capabilityGeneratedAt,
        } : {
          enabled: false,
        },
        totalCommands: safeCommands.length,
        commands: safeCommands,
        totalExcludedCommands: excludedCommands.length,
        excludedCommands,
      }, format));
    } catch (error) {
      console.error(fmt.formatError(error as Error));
      process.exit(1);
    }
  };

  cmd
    .command('openai')
    .description('Export OpenAI function calling schemas for all commands')
    .action(async function (this: Command): Promise<void> {
      await exportOpenAi(this.parent || this);
    });

  cmd
    .command('openai-tools')
    .description('Alias for `agent-tools openai`')
    .action(async function (this: Command): Promise<void> {
      await exportOpenAi(this.parent || this);
    });

  cmd
    .command('anthropic')
    .description('Export Anthropic Claude tool definitions for all commands')
    .action(async function (this: Command): Promise<void> {
      await exportAnthropic(this.parent || this);
    });

  cmd
    .command('anthropic-tools')
    .description('Alias for `agent-tools anthropic`')
    .action(async function (this: Command): Promise<void> {
      await exportAnthropic(this.parent || this);
    });

  cmd
    .command('catalog')
    .description('Export command catalog metadata and agent-tool aliases')
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this.parent || this;
      const format = getOutputFormat(actionCommand);

      try {
        const root = actionCommand.parent?.parent || actionCommand.parent || actionCommand;
        const commandCatalog = buildCommandCatalog(root);
        console.log(fmt.formatOutput({
          generatedAt: new Date().toISOString(),
          commandCatalog,
          aliases: {
            openai: 'agent-tools openai',
            openaiTools: 'agent-tools openai-tools',
            anthropic: 'agent-tools anthropic',
            anthropicTools: 'agent-tools anthropic-tools',
          },
        }, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('safe-commands')
    .description('Export read-only-compatible leaf commands for agent planners')
    .option('--instance-aware', 'Filter out capability-probed unsupported command families')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', infoCapabilities.parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      await exportSafeCommands(this);
    });

  cmd
    .command('mcp-tools')
    .description('Export MCP-ready tool metadata for CLI leaf commands')
    .option('--instance-aware', 'Attach capability support metadata per command family')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', infoCapabilities.parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this;
      const format = getOutputFormat(actionCommand);
      try {
        const options = actionCommand.opts() as { instanceAware?: boolean };
        const root = actionCommand.parent?.parent || actionCommand.parent || actionCommand;
        let capabilitySource: 'cache' | 'live' | undefined;
        let capabilityGeneratedAt: string | undefined;
        let capabilitySupportByCommandRoot: ReturnType<typeof buildCapabilitySupportIndex> | undefined;
        if (options.instanceAware) {
          const capabilityResult = await infoCapabilities.resolveCapabilityReportWithSource(actionCommand);
          capabilitySource = capabilityResult.source;
          capabilityGeneratedAt = capabilityResult.report.generatedAt;
          capabilitySupportByCommandRoot = buildCapabilitySupportIndex(capabilityResult.report);
        }

        const catalog = buildCommandCatalog(root, '', { capabilitySupportByCommandRoot });
        const tools = collectLeafCommands(catalog).map((node) => {
          const schema = commandToOpenAIFunction(
            node.fullCommand.replace('monica ', ''),
            node.description,
            node.options
          );
          return {
            name: schema.name,
            description: node.description || schema.description,
            command: node.fullCommand,
            inputSchema: schema.parameters,
            safety: node.safety,
            supportedOnInstance: node.availability?.supportedOnInstance,
          };
        });

        console.log(fmt.formatOutput({
          generatedAt: new Date().toISOString(),
          schemaVersion: '1.0.0',
          instanceCapabilities: options.instanceAware ? {
            enabled: true,
            source: capabilitySource,
            generatedAt: capabilityGeneratedAt,
          } : {
            enabled: false,
          },
          totalTools: tools.length,
          tools,
        }, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
