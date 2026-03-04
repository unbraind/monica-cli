import type { OutputValidation } from './e2e-output-validation';

export interface CommandCheck {
  command: string;
  outputValidation: OutputValidation;
}

interface BuildBaseCommandChecksInput {
  baseFlags: string;
  requestTimeoutMs: number;
  searchQuery: string;
}

export function buildWriteGuardCommands(contactId: number | null): string[] {
  const checks = [
    "monica contacts create --first-name 'read-only-guard' --gender-id 1",
    "monica tags create --name 'read-only-guard'",
    "monica companies create --name 'read-only-guard'",
  ];

  if (contactId !== null) {
    checks.push(`monica tasks create --title 'read-only-guard' --contact ${contactId}`);
    checks.push(`monica notes create --body 'read-only-guard' --contact ${contactId}`);
  }

  return checks;
}

export function buildBaseCommandChecks(input: BuildBaseCommandChecksInput): CommandCheck[] {
  const { baseFlags, requestTimeoutMs, searchQuery } = input;
  return [
    { command: `monica ${baseFlags} config test`, outputValidation: 'json' },
    { command: `monica ${baseFlags} config doctor`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info me`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info genders`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info countries`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info currencies`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info activity-types`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info relationship-types`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info contact-field-types`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info capabilities --refresh`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info instance-profile`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info supported-commands`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info unsupported-commands`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info agent-context`, outputValidation: 'json' },
    { command: `monica ${baseFlags} info command-catalog`, outputValidation: 'json' },
    { command: `monica --request-timeout-ms ${requestTimeoutMs} contacts list --limit 2`, outputValidation: 'toon' },
    { command: `monica ${baseFlags} contacts list --limit 2`, outputValidation: 'json' },
    { command: `monica --yaml --request-timeout-ms ${requestTimeoutMs} contacts list --limit 2`, outputValidation: 'yaml' },
    { command: `monica --table --request-timeout-ms ${requestTimeoutMs} contacts list --limit 2`, outputValidation: 'table' },
    { command: `monica --md --request-timeout-ms ${requestTimeoutMs} contacts list --limit 2`, outputValidation: 'markdown' },
    { command: `monica --raw --request-timeout-ms ${requestTimeoutMs} contacts list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} activities list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} notes list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} tasks list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} reminders list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} tags list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} companies list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} calls list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} gifts list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} debts list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} addresses list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} journal list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} groups list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} documents list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} photos list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} occupations list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} conversations list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} relationships types`, outputValidation: 'json' },
    { command: `monica ${baseFlags} user show`, outputValidation: 'json' },
    { command: `monica ${baseFlags} countries list`, outputValidation: 'json' },
    { command: `monica ${baseFlags} currencies list`, outputValidation: 'json' },
    { command: `monica ${baseFlags} activity-types list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} activity-type-categories list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} contact-field-types list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} contact-fields list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} contact-fields list --scan-contacts --contact-max-pages 1 --limit 5`, outputValidation: 'json' },
    { command: `monica ${baseFlags} compliance list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} compliance status`, outputValidation: 'json' },
    { command: `monica ${baseFlags} audit-logs list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} pets list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} pet-categories list --limit 2`, outputValidation: 'json' },
    { command: `monica ${baseFlags} search "${searchQuery}" --type all --limit 2 --max-pages 1`, outputValidation: 'json' },
    { command: `monica ${baseFlags} api-research summary --instance-aware`, outputValidation: 'json' },
    { command: `monica ${baseFlags} api-research coverage --instance-aware`, outputValidation: 'json' },
    { command: `monica ${baseFlags} api-research backlog --mapped-only`, outputValidation: 'json' },
    { command: `monica ${baseFlags} api-research backlog --instance-aware --unsupported-only`, outputValidation: 'json' },
    { command: `monica ${baseFlags} api-research actions --instance-aware`, outputValidation: 'json' },
    { command: `monica ${baseFlags} api-research actions --instance-aware --read-only-only`, outputValidation: 'json' },
    { command: `monica ${baseFlags} api-research snapshot --instance-aware`, outputValidation: 'json' },
    { command: `monica ${baseFlags} api-research snapshot --instance-aware --unsupported-only`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas list`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get info-capabilities`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get info-supported-commands`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get info-unsupported-commands`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get info-command-catalog`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get info-agent-context`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get info-instance-profile`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get agent-tools-safe-commands`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get api-research-actions`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get api-research-coverage`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas get audit-report`, outputValidation: 'json' },
    { command: `monica ${baseFlags} schemas sample info-capabilities`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools catalog`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools openai`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools openai-tools`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools anthropic`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools anthropic-tools`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools safe-commands`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools safe-commands --instance-aware`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools mcp-tools`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-tools mcp-tools --instance-aware`, outputValidation: 'json' },
    { command: `monica ${baseFlags} agent-runbook --instance-aware`, outputValidation: 'json' },
    { command: `monica ${baseFlags} audit`, outputValidation: 'json' },
    { command: `monica ${baseFlags} setup --non-interactive --read-only --skip-capability-probe`, outputValidation: 'json' },
    { command: `monica ${baseFlags} setup --non-interactive --read-only --skip-capability-probe --default-format yaml --dry-run`, outputValidation: 'json' },
    { command: `monica ${baseFlags} config setup --non-interactive --read-only --skip-capability-probe`, outputValidation: 'json' },
  ];
}
