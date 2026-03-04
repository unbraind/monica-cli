import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as fmt from '../formatters';
import { parsePositiveInt } from './info-capabilities';
import { resolveCommandOutputFormat } from './output-format';
import { buildProbePayload } from './api-research-probe';
import type { ApiResearchSummaryOptions } from './api-research-types';
import { attachApiResearchProbeSubcommand } from './api-research-probe';
import { buildBacklogPayload } from './api-research-backlog';
import { buildActionsPayload } from './api-research-actions';
import { buildCoveragePayload, buildSummaryPayload } from './api-research-summary';

function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}

function evaluateCoverageGate(
  payload: ReturnType<typeof buildCoveragePayload>,
  options: { failOnUnmapped?: boolean; failOnUnsupported?: boolean }
): {
  enabled: boolean;
  failed: boolean;
  failOnUnmapped: boolean;
  failOnUnsupported: boolean;
  reasons: string[];
} {
  const failOnUnmapped = options.failOnUnmapped === true;
  const failOnUnsupported = options.failOnUnsupported === true;
  const reasons: string[] = [];
  if (failOnUnmapped && payload.cliMapping.unmappedResources > 0) {
    reasons.push(`unmapped resources detected: ${payload.cliMapping.unmappedResources}`);
  }
  if (failOnUnsupported && (payload.commandSupport?.unsupported || 0) > 0) {
    reasons.push(`unsupported commands detected: ${payload.commandSupport?.unsupported || 0}`);
  }
  return {
    enabled: failOnUnmapped || failOnUnsupported,
    failed: reasons.length > 0,
    failOnUnmapped,
    failOnUnsupported,
    reasons,
  };
}

export function createApiResearchCommand(): Command {
  const cmd = new Command('api-research')
    .description('Summarize Monica API resource/endpoint coverage for agent planning')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'toon');

  cmd
    .command('summary')
    .description('Emit API resource and endpoint inventory from docs/api-reference.json')
    .option('--resource <name>', 'Filter by resource name (case-insensitive substring)')
    .option('--with-endpoints', 'Include per-endpoint method/path details in output')
    .option('--source <source>', 'Reference source: auto|api|monica|<custom-json-path>', 'auto')
    .option('--instance-aware', 'Attach live instance support metadata by command root (GET-only probe)')
    .option('--supported-only', 'With --instance-aware, include only resources supported on this instance')
    .option('--unsupported-only', 'With --instance-aware, include only resources unsupported on this instance')
    .option('--mapped-only', 'Include only resources that have a direct CLI command mapping')
    .option('--unmapped-only', 'Include only resources that currently lack a direct CLI command mapping')
    .option('--refresh', 'Force capability re-probe instead of using cache (with --instance-aware)')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this;
      const format: OutputFormat = getOutputFormat(actionCommand);
      try {
        const options = actionCommand.opts() as ApiResearchSummaryOptions;
        const payload = await buildSummaryPayload(options, actionCommand);
        console.log(fmt.formatOutput(payload, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('coverage')
    .description('Emit compact API/CLI/live-instance coverage scorecard for automation')
    .option('--resource <name>', 'Filter by resource name (case-insensitive substring)')
    .option('--source <source>', 'Reference source: auto|api|monica|<custom-json-path>', 'auto')
    .option('--instance-aware', 'Attach live instance support metadata by command root (GET-only probe)')
    .option('--supported-only', 'With --instance-aware, include only resources supported on this instance')
    .option('--unsupported-only', 'With --instance-aware, include only resources unsupported on this instance')
    .option('--mapped-only', 'Include only resources that have a direct CLI command mapping')
    .option('--unmapped-only', 'Include only resources that currently lack a direct CLI command mapping')
    .option('--fail-on-unmapped', 'Exit with code 2 when unmapped resources are present (CI gate)')
    .option('--fail-on-unsupported', 'With --instance-aware, exit with code 2 when unsupported commands are present')
    .option('--refresh', 'Force capability re-probe instead of using cache (with --instance-aware)')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this;
      const format: OutputFormat = getOutputFormat(actionCommand);
      try {
        const options = actionCommand.opts() as ApiResearchSummaryOptions & {
          failOnUnmapped?: boolean;
          failOnUnsupported?: boolean;
        };
        const summary = await buildSummaryPayload(options, actionCommand);
        const payload = buildCoveragePayload(summary);
        const gate = evaluateCoverageGate(payload, options);
        if (gate.enabled) {
          payload.gate = gate;
        }
        console.log(fmt.formatOutput(payload, format));
        if (gate.failed) {
          process.exit(2);
        }
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('backlog')
    .description('Emit deterministic agent backlog items from API summary coverage data')
    .option('--resource <name>', 'Filter by resource name (case-insensitive substring)')
    .option('--source <source>', 'Reference source: auto|api|monica|<custom-json-path>', 'auto')
    .option('--instance-aware', 'Attach live instance support metadata by command root (GET-only probe)')
    .option('--supported-only', 'With --instance-aware, include only resources supported on this instance')
    .option('--unsupported-only', 'With --instance-aware, include only resources unsupported on this instance')
    .option('--mapped-only', 'Include only resources that have a direct CLI command mapping')
    .option('--unmapped-only', 'Include only resources that currently lack a direct CLI command mapping')
    .option('--refresh', 'Force capability re-probe instead of using cache (with --instance-aware)')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this;
      const format: OutputFormat = getOutputFormat(actionCommand);
      try {
        const options = actionCommand.opts() as ApiResearchSummaryOptions;
        const payload = await buildSummaryPayload(options, actionCommand);
        console.log(fmt.formatOutput(buildBacklogPayload(payload), format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('actions')
    .description('Emit deterministic agent action commands derived from backlog guidance')
    .option('--resource <name>', 'Filter by resource name (case-insensitive substring)')
    .option('--source <source>', 'Reference source: auto|api|monica|<custom-json-path>', 'auto')
    .option('--instance-aware', 'Attach live instance support metadata by command root (GET-only probe)')
    .option('--supported-only', 'With --instance-aware, include only resources supported on this instance')
    .option('--unsupported-only', 'With --instance-aware, include only resources unsupported on this instance')
    .option('--mapped-only', 'Include only resources that have a direct CLI command mapping')
    .option('--unmapped-only', 'Include only resources that currently lack a direct CLI command mapping')
    .option('--read-only-only', 'Include only read-only safe actions (exclude planning actions)')
    .option('--refresh', 'Force capability re-probe instead of using cache (with --instance-aware)')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this;
      const format: OutputFormat = getOutputFormat(actionCommand);
      try {
        const options = actionCommand.opts() as ApiResearchSummaryOptions & { readOnlyOnly?: boolean };
        const summary = await buildSummaryPayload(options, actionCommand);
        const backlog = buildBacklogPayload(summary);
        const payload = buildActionsPayload(backlog, { readOnlyOnly: options.readOnlyOnly === true });
        console.log(fmt.formatOutput(payload, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  cmd
    .command('snapshot')
    .description('Emit combined summary + backlog + endpoint probe payload for agent planning')
    .option('--resource <name>', 'Filter by resource name (case-insensitive substring)')
    .option('--source <source>', 'Reference source: auto|api|monica|<custom-json-path>', 'auto')
    .option('--instance-aware', 'Attach live instance support metadata by command root')
    .option('--supported-only', 'With --instance-aware, include only resources supported on this instance')
    .option('--unsupported-only', 'With --instance-aware, include only resources unsupported on this instance')
    .option('--mapped-only', 'Include only resources that have a direct CLI command mapping')
    .option('--unmapped-only', 'Include only resources that currently lack a direct CLI command mapping')
    .option('--refresh', 'Force capability re-probe instead of using cache (with --instance-aware)')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', parsePositiveInt)
    .option('--include-parameterized', 'Probe GET endpoints with :id-style params by replacing params with --id-replacement')
    .option('--id-replacement <id>', 'Replacement id used for parameterized endpoint probing (default: 1)', parsePositiveInt, 1)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this;
      const format: OutputFormat = getOutputFormat(actionCommand);
      try {
        const options = actionCommand.opts() as ApiResearchSummaryOptions & {
          includeParameterized?: boolean;
          idReplacement?: number;
        };
        const summary = await buildSummaryPayload(options, actionCommand);
        const backlog = buildBacklogPayload(summary);
        const probe = await buildProbePayload(options);
        console.log(fmt.formatOutput({ generatedAt: new Date().toISOString(), summary, backlog, probe }, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });

  attachApiResearchProbeSubcommand(cmd);
  return cmd;
}
