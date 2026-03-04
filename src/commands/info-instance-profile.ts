import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as api from '../api';
import * as fmt from '../formatters';
import { resolveCommandOutputFormat } from './output-format';
import { getUnsupportedCommands, parsePositiveInt, resolveCapabilityReportWithSource } from './info-capabilities';

function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}

function getActionCommand(command?: Command): Command {
  return command || new Command();
}

export function createInfoInstanceProfileSubcommand(): Command {
  return new Command('instance-profile')
    .description('Emit consolidated instance profile for deterministic agent planning')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = getActionCommand(this);
      const format = getOutputFormat(actionCommand);

      try {
        const { report, source } = await resolveCapabilityReportWithSource(actionCommand);
        const supportedCommands = api.getSupportedCommands(report);
        const unsupportedCommands = getUnsupportedCommands(report);
        const config = api.getConfig();
        const payload = {
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
            summary: report.summary,
            probes: report.probes,
          },
          supportedCommands: {
            total: supportedCommands.length,
            commands: supportedCommands,
          },
          unsupportedCommands: {
            total: unsupportedCommands.length,
            commands: unsupportedCommands,
          },
        };
        console.log(fmt.formatOutput(payload, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });
}
