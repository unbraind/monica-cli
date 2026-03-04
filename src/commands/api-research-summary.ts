import { Command } from 'commander';
import { resolveCapabilityReportWithSource } from './info-capabilities';
import {
  loadSelectedReference,
  parseSourceOption,
  summarizeResource,
} from './api-research-shared';
import { buildBacklogPayload } from './api-research-backlog';
import { buildActionsPayload } from './api-research-actions';
import type {
  ApiResearchCoveragePayload,
  ApiResearchSummaryOptions,
  ApiResearchSummaryPayload,
} from './api-research-types';

function normalizeCommandRoot(command: string): string {
  const trimmed = command.trim().toLowerCase();
  const [root] = trimmed.split(/\s+/u);
  return root || trimmed;
}

function normalizeCommand(value: string): string {
  return value.trim().toLowerCase();
}

function roundPercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}

function validateSummaryFilters(options: {
  instanceAware?: boolean;
  supportedOnly?: boolean;
  unsupportedOnly?: boolean;
  mappedOnly?: boolean;
  unmappedOnly?: boolean;
}): void {
  if (options.supportedOnly && options.unsupportedOnly) {
    throw new Error('Cannot use both --supported-only and --unsupported-only');
  }
  if ((options.supportedOnly || options.unsupportedOnly) && !options.instanceAware) {
    throw new Error('--supported-only and --unsupported-only require --instance-aware');
  }
  if (options.mappedOnly && options.unmappedOnly) {
    throw new Error('Cannot use both --mapped-only and --unmapped-only');
  }
}

export async function buildSummaryPayload(
  options: ApiResearchSummaryOptions,
  actionCommand: Command
): Promise<ApiResearchSummaryPayload> {
  validateSummaryFilters(options);

  const sourceSelection = parseSourceOption(options.source || 'auto');
  const doc = loadSelectedReference(sourceSelection);
  const resourceFilter = options.resource?.trim().toLowerCase();
  const filteredResources = Object.entries(doc.endpoints || {})
    .filter(([resource]) => !resourceFilter || resource.toLowerCase().includes(resourceFilter));

  const resources = filteredResources
    .map(([resource, definition]) => summarizeResource(resource, definition, options.withEndpoints === true))
    .sort((left, right) => left.resource.localeCompare(right.resource));

  const methodsByVerb = filteredResources
    .flatMap(([, definition]) => Object.values(definition.methods || {}))
    .map((methodDef) => (methodDef.method || 'UNKNOWN').toUpperCase())
    .reduce<Record<string, number>>((acc, method) => {
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

  let instanceCapabilities: { enabled: boolean; source?: 'cache' | 'live'; generatedAt?: string } = { enabled: false };
  let commandSupport: {
    total: number;
    supported: number;
    unsupported: number;
    supportedCommands: string[];
    unsupportedCommands: string[];
  } | undefined;
  if (options.instanceAware) {
    const capabilityResult = await resolveCapabilityReportWithSource(actionCommand);
    const supportByCommand = new Map(capabilityResult.report.probes.map((probe) => [normalizeCommand(probe.command), probe]));
    const supportByCommandRoot = new Map(capabilityResult.report.probes.map((probe) => [normalizeCommandRoot(probe.command), probe]));
    resources.forEach((resource) => {
      const exactCommand = normalizeCommand(resource.cliCommand);
      const probe = supportByCommand.get(exactCommand) || supportByCommandRoot.get(normalizeCommandRoot(resource.cliCommand));
      if (!probe) return;
      resource.instanceSupport = {
        supportedOnInstance: probe.supported,
        statusCode: probe.statusCode,
        endpoint: probe.endpoint,
        message: probe.message,
      };
    });
    instanceCapabilities = {
      enabled: true,
      source: capabilityResult.source,
      generatedAt: capabilityResult.report.generatedAt,
    };

    const commandSupportByRoot = capabilityResult.report.probes.reduce<Map<string, boolean>>((acc, probe) => {
      const root = normalizeCommandRoot(probe.command);
      acc.set(root, (acc.get(root) ?? false) || probe.supported);
      return acc;
    }, new Map());
    const supportedCommands = Array.from(commandSupportByRoot.entries())
      .filter(([, supported]) => supported)
      .map(([root]) => root)
      .sort((left, right) => left.localeCompare(right));
    const unsupportedCommands = Array.from(commandSupportByRoot.entries())
      .filter(([, supported]) => !supported)
      .map(([root]) => root)
      .sort((left, right) => left.localeCompare(right));
    commandSupport = {
      total: commandSupportByRoot.size,
      supported: supportedCommands.length,
      unsupported: unsupportedCommands.length,
      supportedCommands,
      unsupportedCommands,
    };
  }
  const resourcesForOutput = resources.filter((resource) => {
    if (options.mappedOnly && resource.cliMapping !== 'mapped') return false;
    if (options.unmappedOnly && resource.cliMapping !== 'unmapped') return false;
    if (!options.supportedOnly && !options.unsupportedOnly) return true;
    const supported = resource.instanceSupport?.supportedOnInstance;
    if (options.supportedOnly) return supported === true;
    return supported === false;
  });
  const unmappedResources = resourcesForOutput
    .filter((resource) => resource.cliMapping === 'unmapped')
    .map((resource) => resource.resource)
    .sort((left, right) => left.localeCompare(right));
  const supportedResourcesByInstance = options.instanceAware
    ? resourcesForOutput
      .filter((resource) => resource.instanceSupport?.supportedOnInstance === true)
      .map((resource) => resource.resource)
      .sort((left, right) => left.localeCompare(right))
    : undefined;
  const unsupportedResourcesByInstance = options.instanceAware
    ? resourcesForOutput
      .filter((resource) => resource.instanceSupport?.supportedOnInstance === false && resource.instanceSupport)
      .map((resource) => ({
        resource: resource.resource,
        cliCommand: resource.cliCommand,
        statusCode: resource.instanceSupport!.statusCode,
        endpoint: resource.instanceSupport!.endpoint,
        message: resource.instanceSupport!.message,
      }))
      .sort((left, right) => left.resource.localeCompare(right.resource))
    : undefined;

  return {
    generatedAt: new Date().toISOString(),
    sourceFile: sourceSelection.path,
    sourceFormat: sourceSelection.format,
    apiReference: {
      version: doc.version || 'unknown',
      generated: doc.generated || 'unknown',
      baseUrl: doc.baseUrl || 'unknown',
    },
    instanceCapabilities,
    commandSupport,
    summary: {
      resources: resourcesForOutput.length,
      endpoints: resourcesForOutput.reduce((sum, resource) => sum + resource.endpointCount, 0),
      methodsByVerb,
    },
    cliCoverage: {
      mappedResources: resourcesForOutput.length - unmappedResources.length,
      unmappedResources: unmappedResources.length,
      unmappedResourceNames: unmappedResources,
    },
    supportedResourcesByInstance,
    unsupportedResourcesByInstance,
    resources: resourcesForOutput,
  };
}

export function buildCoveragePayload(summary: ApiResearchSummaryPayload): ApiResearchCoveragePayload {
  const readOnlyActionPlan = buildActionsPayload(buildBacklogPayload(summary), { readOnlyOnly: true }).commands;
  const recommendedNextCommands: string[] = [];
  if (summary.cliCoverage.unmappedResources > 0) {
    recommendedNextCommands.push('monica --json api-research summary --unmapped-only');
  }
  if (summary.instanceCapabilities.enabled && (summary.commandSupport?.unsupported || 0) > 0) {
    recommendedNextCommands.push('monica --json api-research backlog --instance-aware --unsupported-only');
    recommendedNextCommands.push('monica --json api-research actions --instance-aware --read-only-only');
  }
  if (recommendedNextCommands.length === 0) {
    recommendedNextCommands.push('monica --json api-research summary --instance-aware');
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceFile: summary.sourceFile,
    sourceFormat: summary.sourceFormat,
    instanceCapabilities: summary.instanceCapabilities,
    totals: {
      resources: summary.summary.resources,
      endpoints: summary.summary.endpoints,
    },
    cliMapping: {
      mappedResources: summary.cliCoverage.mappedResources,
      unmappedResources: summary.cliCoverage.unmappedResources,
      mappedPercent: roundPercent(summary.cliCoverage.mappedResources, summary.summary.resources),
      unmappedResourceNames: summary.cliCoverage.unmappedResourceNames,
    },
    instanceSupport: summary.instanceCapabilities.enabled
      ? {
        supportedResources: summary.supportedResourcesByInstance?.length || 0,
        unsupportedResources: summary.unsupportedResourcesByInstance?.length || 0,
        supportedPercent: roundPercent(
          summary.supportedResourcesByInstance?.length || 0,
          summary.summary.resources
        ),
        unsupported: summary.unsupportedResourcesByInstance || [],
      }
      : undefined,
    commandSupport: summary.commandSupport
      ? {
        total: summary.commandSupport.total,
        supported: summary.commandSupport.supported,
        unsupported: summary.commandSupport.unsupported,
        supportedPercent: roundPercent(summary.commandSupport.supported, summary.commandSupport.total),
        supportedCommands: summary.commandSupport.supportedCommands,
        unsupportedCommands: summary.commandSupport.unsupportedCommands,
      }
      : undefined,
    readOnlyActionPlan: {
      count: readOnlyActionPlan.length,
      commands: readOnlyActionPlan,
    },
    recommendedNextCommands,
  };
}
