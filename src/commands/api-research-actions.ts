import type {
  ApiResearchActionsPayload,
  ApiResearchBacklogItem,
  ApiResearchBacklogPayload,
} from './api-research-types';

type ActionFilter = {
  readOnlyOnly?: boolean;
};

function tokenizeCommand(command: string): string[] {
  const tokens = command.match(/"[^"]*"|'[^']*'|[^\s]+/g) || [];
  return tokens.map((token) => token.replace(/^['"]|['"]$/g, ''));
}

function extractCommandShape(command: string): ApiResearchActionsPayload['actions'][number]['commandShape'] {
  const tokens = tokenizeCommand(command);
  const executable = tokens[0] || 'monica';
  const args = tokens.slice(1);
  const options = args.filter((arg) => arg.startsWith('-'));
  const commandTokens = args.filter((arg) => !arg.startsWith('-'));
  const root = commandTokens[0] || '';
  const subcommand = commandTokens[1] || '';

  return {
    executable,
    root,
    subcommand,
    args,
    options,
  };
}

function toActionItem(item: ApiResearchBacklogItem): ApiResearchActionsPayload['actions'][number][] {
  return item.agentActions.map((action) => ({
    resource: item.resource,
    cliCommand: item.cliCommand,
    type: item.type,
    priority: item.priority,
    command: action.command,
    commandShape: extractCommandShape(action.command),
    reason: action.reason,
    safety: action.safety,
    support: item.support,
  }));
}

function applyFilters(
  actions: ApiResearchActionsPayload['actions'],
  filter: ActionFilter
): ApiResearchActionsPayload['actions'] {
  if (!filter.readOnlyOnly) {
    return actions;
  }

  return actions.filter((action) => action.safety === 'read-only');
}

function summarizeActions(actions: ApiResearchActionsPayload['actions']): ApiResearchActionsPayload['summary'] {
  return {
    actions: actions.length,
    readOnlyActions: actions.filter((action) => action.safety === 'read-only').length,
    planningActions: actions.filter((action) => action.safety === 'planning').length,
    uniqueCommands: new Set(actions.map((action) => action.command)).size,
  };
}

export function buildActionsPayload(
  payload: ApiResearchBacklogPayload,
  filter: ActionFilter = {}
): ApiResearchActionsPayload {
  const actions = applyFilters(payload.items.flatMap((item) => toActionItem(item)), filter);
  return {
    generatedAt: payload.generatedAt,
    sourceFile: payload.sourceFile,
    sourceFormat: payload.sourceFormat,
    instanceCapabilities: payload.instanceCapabilities,
    summary: summarizeActions(actions),
    actions,
    commands: Array.from(new Set(actions.map((action) => action.command))).sort((left, right) =>
      left.localeCompare(right)
    ),
  };
}
