import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { buildCapabilitySupportIndex, buildCommandCatalog } from './command-catalog';
import { resolveCommandOutputFormat } from './output-format';
import {
  getUnavailableCommands,
  getUnsupportedCommands,
  parsePositiveInt,
  resolveCapabilityReportWithSource,
} from './info-capabilities';
import { createInfoInstanceProfileSubcommand } from './info-instance-profile';
import { attachInfoReferenceSubcommands } from './info-reference';
function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}

function buildMissingSubcommandMessage(command: Command): string {
  const subcommands = command.commands
    .filter((subcommand) => subcommand.name() !== 'help')
    .map((subcommand) => ({
      name: subcommand.name(),
      description: subcommand.description(),
    }));
  const longestName = Math.max(...subcommands.map((subcommand) => subcommand.name.length), 0);
  const formattedSubcommands = subcommands.map((subcommand) => {
    const paddedName = subcommand.name.padEnd(longestName, ' ');
    return `  ${paddedName}  ${subcommand.description}`;
  });

  return [
    '"info" requires a subcommand.',
    '',
    'Available subcommands:',
    ...formattedSubcommands,
    '',
    'Example:',
    '  monica info me',
  ].join('\n');
}

/** Creates info command. */
export function createInfoCommand(): Command {
  const cmd = new Command('info')
    .description('Get information about the Monica instance')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  cmd.action(function (this: Command): never {
    this.error(buildMissingSubcommandMessage(this), { exitCode: 1 });
  });

  cmd.addCommand(createInfoInstanceProfileSubcommand());
  attachInfoReferenceSubcommands(cmd);

  cmd
    .command('capabilities')
    .description('Probe API endpoint support on this Monica instance (GET-only)')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const format = getOutputFormat(this);

      try {
        const { report, source } = await resolveCapabilityReportWithSource(this);
        const generatedAt = report.generatedAt || new Date().toISOString();

        if (format === 'json') {
          console.log(fmt.formatOutput({ ...report, generatedAt, source }, format));
          return;
        }

        const fields = ['key', 'command', 'state', 'supported', 'statusCode', 'message', 'endpoint'];
        console.log(fmt.formatOutput(report.summary, format));
        console.log('');
        console.log(fmt.formatOutput(report.probes, format, { fields }));

        const hints = api.formatCapabilityHints(report);
        console.log('\nCapability notes:');
        hints.forEach((hint) => console.log(`- ${hint}`));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('agent-context')
    .description('Emit sanitized Monica instance context for agent planning (GET-only)')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const format = getOutputFormat(this);

      try {
        const { report, source } = await resolveCapabilityReportWithSource(this);
        const supportedCommands = api.getSupportedCommands(report);
        const unsupported = getUnsupportedCommands(report);
        const unavailable = getUnavailableCommands(report);
        const config = api.getConfig();
        const context = {
          generatedAt: new Date().toISOString(),
          instance: {
            apiUrl: config.apiUrl,
            readOnlyMode: config.readOnlyMode,
          },
          defaults: {
            outputFormat: 'toon',
            safeGlobalFlags: ['--json', '--yaml', '--yml', '--table', '--md', '--markdown', '--raw', '--request-timeout-ms'],
          },
          capabilities: {
            source,
            total: report.summary.total,
            supported: report.summary.supported,
            unsupported: report.summary.unsupported,
            unavailable: report.summary.unavailable || 0,
            healthy: report.summary.healthy ?? unavailable.length === 0,
            unsupportedResources: unsupported,
            unavailableResources: unavailable,
          },
          supportedCommands: {
            total: supportedCommands.length,
            commands: supportedCommands,
          },
          safeCommandExamples: [
            'monica --json info agent-context',
            'monica --json info capabilities',
            'monica --json contacts list --limit 10',
            'monica --json search "<query>" --type all --limit 5 --max-pages 2',
          ],
        };

        console.log(fmt.formatOutput(context, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('command-catalog')
    .description('Emit machine-readable CLI command catalog for agent planning')
    .option('--instance-aware', 'Attach capability-derived availability metadata for this Monica instance')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this;
      const format = getOutputFormat(actionCommand);
      try {
        const root = actionCommand.parent?.parent ?? actionCommand.parent!;
        const options = actionCommand.opts() as { instanceAware?: boolean };
        let capabilitySource: 'cache' | 'live' | undefined;
        let capabilityGeneratedAt: string | undefined;
        let capabilitySupportByCommandRoot: ReturnType<typeof buildCapabilitySupportIndex> | undefined;
        if (options.instanceAware) {
          const capabilityResult = await resolveCapabilityReportWithSource(actionCommand);
          capabilitySource = capabilityResult.source;
          capabilityGeneratedAt = capabilityResult.report.generatedAt;
          capabilitySupportByCommandRoot = buildCapabilitySupportIndex(capabilityResult.report);
        }
        const catalog = {
          generatedAt: new Date().toISOString(),
          rootCommand: root.name(),
          defaultOutputFormat: 'toon',
          instanceCapabilities: options.instanceAware ? {
            enabled: true,
            source: capabilitySource,
            generatedAt: capabilityGeneratedAt,
          } : {
            enabled: false,
          },
          commandTree: buildCommandCatalog(root, '', { capabilitySupportByCommandRoot }),
        };
        await new Promise<void>((resolveDrain) => {
          process.stdout.write(`${fmt.formatOutput(catalog, format)}\n`, () => resolveDrain());
        });
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('supported-commands')
    .description('List supported high-level CLI commands for this Monica instance (GET-only probe)')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const format = getOutputFormat(this);
      try {
        const { report, source } = await resolveCapabilityReportWithSource(this);
        const commands = api.getSupportedCommands(report);
        const generatedAt = report.generatedAt || new Date().toISOString();
        if (format === 'json') {
          console.log(fmt.formatOutput({ generatedAt, source, total: commands.length, commands }, format));
          return;
        }
        console.log(`Supported Commands: ${commands.length}\n`);
        console.log(fmt.formatOutput(commands.map((command) => ({ command })), format, { fields: ['command'] }));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('unsupported-commands')
    .description('List unsupported high-level CLI commands with endpoint/status details (GET-only probe)')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const format = getOutputFormat(this);
      try {
        const { report, source } = await resolveCapabilityReportWithSource(this);
        const commands = getUnsupportedCommands(report);
        const generatedAt = report.generatedAt || new Date().toISOString();
        console.log(fmt.formatOutput({ generatedAt, source, total: commands.length, commands }, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  return cmd;
}
