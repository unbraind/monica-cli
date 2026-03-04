import { Command } from 'commander';
import type { OutputFormat } from '../types';
import * as fmt from '../formatters';
import * as infoCapabilities from './info-capabilities';
import { resolveCommandOutputFormat } from './output-format';

type StepCategory = 'baseline' | 'discovery' | 'planning' | 'investigation';

interface RunbookStepTemplate {
  id: string;
  category: StepCategory;
  command: string;
  purpose: string;
  schemaHint?: string;
  optional?: boolean;
}

interface RunbookStep extends RunbookStepTemplate {
  commandRoot: string;
}

interface UnsupportedRoot {
  commandRoot: string;
  statusCode: number;
  endpoint: string;
  message: string;
}

interface AgentRunbookOptions {
  includeOptional?: boolean;
  instanceAware?: boolean;
}

const RUNBOOK_STEPS: RunbookStepTemplate[] = [
  {
    id: 'config-doctor',
    category: 'baseline',
    command: 'monica --json config doctor',
    purpose: 'Validate local setup, read-only safety mode, and repository hygiene before any API call.',
    schemaHint: 'config-test',
  },
  {
    id: 'instance-profile',
    category: 'discovery',
    command: 'monica --json info instance-profile',
    purpose: 'Get one consolidated machine-readable snapshot of instance defaults and capability probe summary.',
    schemaHint: 'info-instance-profile',
  },
  {
    id: 'command-catalog',
    category: 'planning',
    command: 'monica --json info command-catalog --instance-aware',
    purpose: 'Fetch the full command tree with safety metadata and per-command-family availability hints.',
    schemaHint: 'info-command-catalog',
  },
  {
    id: 'safe-commands',
    category: 'planning',
    command: 'monica --json agent-tools safe-commands --instance-aware',
    purpose: 'Build a deterministic read-only allow-list for tool selection and planner constraints.',
    schemaHint: 'agent-tools-safe-commands',
  },
  {
    id: 'contacts-sample',
    category: 'discovery',
    command: 'monica --json contacts list --limit 5',
    purpose: 'Sample the primary contact graph with a bounded query before deep resource traversal.',
    schemaHint: 'paginated-list',
  },
  {
    id: 'search-sample',
    category: 'investigation',
    command: 'monica --json search "example" --type all --limit 5 --max-pages 1',
    purpose: 'Cross-resource lookup for a seed query to identify relevant entity IDs quickly.',
    schemaHint: 'search-results',
  },
  {
    id: 'api-summary',
    category: 'planning',
    command: 'monica --json api-research summary --source monica --instance-aware',
    purpose: 'Compare Monica API reference coverage with CLI mappings and live instance support.',
    schemaHint: 'api-research-summary',
  },
  {
    id: 'api-snapshot',
    category: 'planning',
    command: 'monica --json api-research snapshot --source monica --instance-aware',
    purpose: 'Capture a single deterministic payload for capability-aware planning and reporting.',
    schemaHint: 'api-research-snapshot',
    optional: true,
  },
];

function getOutputFormat(command: Command): OutputFormat {
  return resolveCommandOutputFormat(command);
}

function commandRoot(command: string): string {
  const parts = command.trim().split(/\s+/);
  const startIndex = parts[0] === 'monica' ? 1 : 0;
  for (let index = startIndex; index < parts.length; index += 1) {
    if (!parts[index].startsWith('-')) return parts[index];
  }
  return '';
}

function normalizeStep(step: RunbookStepTemplate): RunbookStep {
  return {
    ...step,
    commandRoot: commandRoot(step.command),
  };
}

function buildUnsupportedRootIndex(report: { probes: Array<{ command: string; supported: boolean; statusCode: number; endpoint: string; message: string }> }): Map<string, UnsupportedRoot> {
  const unsupported = new Map<string, UnsupportedRoot>();
  report.probes.forEach((probe) => {
    if (probe.supported) return;
    const root = commandRoot(`monica ${probe.command}`);
    if (!root || unsupported.has(root)) return;
    unsupported.set(root, {
      commandRoot: root,
      statusCode: probe.statusCode,
      endpoint: probe.endpoint,
      message: probe.message,
    });
  });
  return unsupported;
}

export function createAgentRunbookCommand(): Command {
  return new Command('agent-runbook')
    .description('Generate a deterministic read-only execution runbook for agent workflows')
    .option('-f, --format <format>', 'Output format (toon|json|yaml|table|md)', 'json')
    .option('--include-optional', 'Include optional extended planning steps')
    .option('--instance-aware', 'Filter runbook steps by live capability support for command families')
    .option('--refresh', 'Force capability re-probe instead of using cache')
    .option('--cache-ttl <seconds>', 'Capability cache TTL in seconds (default: 300)', infoCapabilities.parsePositiveInt)
    .action(async function (this: Command): Promise<void> {
      const actionCommand = this;
      const format = getOutputFormat(actionCommand);
      const options = actionCommand.opts() as AgentRunbookOptions;

      try {
        let unsupportedByRoot = new Map<string, UnsupportedRoot>();
        let capabilitySource: 'cache' | 'live' | undefined;
        let capabilityGeneratedAt: string | undefined;
        if (options.instanceAware) {
          const capability = await infoCapabilities.resolveCapabilityReportWithSource(actionCommand);
          unsupportedByRoot = buildUnsupportedRootIndex(capability.report);
          capabilitySource = capability.source;
          capabilityGeneratedAt = capability.report.generatedAt;
        }

        const selectedSteps = RUNBOOK_STEPS
          .filter((step) => options.includeOptional || !step.optional)
          .map(normalizeStep);

        const steps: RunbookStep[] = [];
        const excludedSteps: Array<{ id: string; command: string; commandRoot: string; reason: string; support: UnsupportedRoot }> = [];

        selectedSteps.forEach((step) => {
          const unsupported = unsupportedByRoot.get(step.commandRoot);
          if (unsupported) {
            excludedSteps.push({
              id: step.id,
              command: step.command,
              commandRoot: step.commandRoot,
              reason: 'instance-unsupported',
              support: unsupported,
            });
            return;
          }
          steps.push(step);
        });

        console.log(fmt.formatOutput({
          generatedAt: new Date().toISOString(),
          mode: 'read-only',
          instanceCapabilities: options.instanceAware ? {
            enabled: true,
            source: capabilitySource,
            generatedAt: capabilityGeneratedAt,
          } : {
            enabled: false,
          },
          summary: {
            totalSteps: steps.length,
            totalExcludedSteps: excludedSteps.length,
            includeOptional: Boolean(options.includeOptional),
          },
          steps,
          excludedSteps,
        }, format));
      } catch (error) {
        console.error(fmt.formatError(error as Error));
        process.exit(1);
      }
    });
}
