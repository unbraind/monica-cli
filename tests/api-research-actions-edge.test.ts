import { describe, expect, it } from 'vitest';
import { buildActionsPayload } from '../src/commands/api-research-actions';

describe('API research action command parsing edges', () => {
  it('parses an empty command with safe executable and command defaults', () => {
    const payload = buildActionsPayload({
      generatedAt: '', sourceFile: '', sourceFormat: 'api-reference',
      instanceCapabilities: { enabled: false },
      backlog: { total: 1, high: 1, medium: 0 },
      items: [{
        resource: 'empty', cliCommand: '', type: 'missing-cli-mapping', priority: 'high',
        reason: '', recommendedAction: '',
        agentActions: [{ command: '', reason: '', safety: 'planning' }],
      }],
    });
    expect(payload.actions[0].commandShape).toEqual({
      executable: 'monica', root: '', subcommand: '', args: [], options: [],
    });
  });
});
