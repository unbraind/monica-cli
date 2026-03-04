import type { ApiResearchBacklogItem, ApiResearchBacklogPayload, ApiResearchSummaryPayload } from './api-research-types';

function normalizeCommandRoot(command: string): string {
  const trimmed = command.trim().toLowerCase();
  const [root] = trimmed.split(/\s+/u);
  return root || trimmed;
}

function getAgentActions(resource: string, type: ApiResearchBacklogItem['type']): ApiResearchBacklogItem['agentActions'] {
  const normalized = resource.trim().toLowerCase();
  if (type === 'missing-cli-mapping') {
    return [
      {
        command: 'monica --json api-research summary --unmapped-only',
        reason: 'List all unmapped resources before implementing new command families.',
        safety: 'planning',
      },
      {
        command: 'monica --json info supported-commands',
        reason: 'Check whether an existing command root already covers the resource indirectly.',
        safety: 'read-only',
      },
    ];
  }

  if (normalized === 'contactfields' || normalized === 'contact fields' || normalized === 'contact-fields') {
    return [
      {
        command: 'monica --json contact-fields list --scan-contacts --contact-max-pages 1 --limit 50',
        reason: 'Fallback scan mode works when global /contactfields listing is unavailable.',
        safety: 'read-only',
      },
      {
        command: 'monica --json contacts list --limit 50',
        reason: 'Get scoped contact ids for per-contact field queries.',
        safety: 'read-only',
      },
    ];
  }

  if (normalized === 'petcategories' || normalized === 'pet categories' || normalized === 'pet-categories') {
    return [
      {
        command: 'monica --json pet-categories list --scan-pets --pet-max-pages 2',
        reason: 'Fallback scan mode derives categories from pets when /petcategories is missing.',
        safety: 'read-only',
      },
      {
        command: 'monica --json pets list --limit 100 --max-pages 2',
        reason: 'Direct pet listing provides category metadata even on older instances.',
        safety: 'read-only',
      },
    ];
  }

  if (normalized === 'groups') {
    return [
      {
        command: 'monica --json tags list --limit 100',
        reason: 'Tags are commonly available and can substitute grouping for read-only segmentation.',
        safety: 'read-only',
      },
      {
        command: 'monica --json contacts list --limit 100',
        reason: 'Direct contact listing is a safe fallback when groups endpoints are unavailable.',
        safety: 'read-only',
      },
    ];
  }

  return [
    {
      command: 'monica --json info unsupported-commands',
      reason: 'Review deterministic deny-list and hints for unsupported command roots.',
      safety: 'read-only',
    },
    {
      command: 'monica --json info supported-commands',
      reason: 'Identify supported alternatives before attempting workflow substitutions.',
      safety: 'read-only',
    },
  ];
}

function buildRecommendedAction(agentActions: ApiResearchBacklogItem['agentActions']): string {
  const first = agentActions[0];
  if (!first) {
    return 'Run monica --json info unsupported-commands to collect safe fallback guidance.';
  }
  return `${first.reason} Suggested command: ${first.command}`;
}

function buildBacklogItems(payload: ApiResearchSummaryPayload): ApiResearchBacklogItem[] {
  const items = payload.resources.flatMap((resource) => {
    const backlogItems: ApiResearchBacklogItem[] = [];
    if (resource.cliMapping === 'unmapped') {
      const agentActions = getAgentActions(resource.resource, 'missing-cli-mapping');
      backlogItems.push({
        resource: resource.resource,
        cliCommand: resource.cliCommand,
        type: 'missing-cli-mapping',
        priority: 'high',
        reason: 'Resource is present in API reference but lacks a direct CLI command mapping.',
        recommendedAction: buildRecommendedAction(agentActions),
        support: resource.instanceSupport,
        agentActions,
      });
    }
    if (payload.instanceCapabilities.enabled && resource.instanceSupport?.supportedOnInstance === false) {
      const agentActions = getAgentActions(resource.resource, 'instance-unsupported');
      backlogItems.push({
        resource: resource.resource,
        cliCommand: resource.cliCommand,
        type: 'instance-unsupported',
        priority: 'medium',
        reason: 'Mapped command is unsupported on this instance and may require compatibility handling.',
        recommendedAction: buildRecommendedAction(agentActions),
        support: resource.instanceSupport,
        agentActions,
      });
    }
    return backlogItems;
  });

  if (payload.instanceCapabilities.enabled && payload.commandSupport) {
    const resourceRoots = new Set(payload.resources.map((resource) => normalizeCommandRoot(resource.cliCommand)));
    payload.commandSupport.unsupportedCommands.forEach((commandRoot) => {
      if (resourceRoots.has(commandRoot)) return;
      const agentActions = getAgentActions(commandRoot, 'instance-unsupported');
      items.push({
        resource: commandRoot,
        cliCommand: commandRoot,
        type: 'instance-unsupported',
        priority: 'medium',
        reason: 'Command family is unsupported on this instance but is not represented in the selected API reference source.',
        recommendedAction: buildRecommendedAction(agentActions),
        agentActions,
      });
    });
  }

  return items.sort((left, right) => {
    if (left.priority !== right.priority) return left.priority === 'high' ? -1 : 1;
    if (left.type !== right.type) return left.type.localeCompare(right.type);
    return left.resource.localeCompare(right.resource);
  });
}

export function buildBacklogPayload(payload: ApiResearchSummaryPayload): ApiResearchBacklogPayload {
  const items = buildBacklogItems(payload);
  return {
    generatedAt: payload.generatedAt,
    sourceFile: payload.sourceFile,
    sourceFormat: payload.sourceFormat,
    instanceCapabilities: payload.instanceCapabilities,
    backlog: {
      total: items.length,
      high: items.filter((item) => item.priority === 'high').length,
      medium: items.filter((item) => item.priority === 'medium').length,
    },
    items,
  };
}
