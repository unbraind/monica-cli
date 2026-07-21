import { describe, expect, it } from 'vitest';
import { buildBacklogPayload } from '../src/commands/api-research-backlog';

describe('API research backlog fallbacks', () => {
  it('provides contact-field and generic instance fallback actions', () => {
    const payload = buildBacklogPayload({
      generatedAt: '', sourceFile: '', sourceFormat: 'api-reference',
      apiReference: { version: '', generated: '', baseUrl: '' },
      instanceCapabilities: { enabled: true },
      summary: { resources: 2, endpoints: 2, methodsByVerb: {} },
      cliCoverage: { mappedResources: 2, unmappedResources: 0, unmappedResourceNames: [] },
      commandSupport: {
        total: 2, supported: 0, unsupported: 2,
        supportedCommands: [], unsupportedCommands: ['contact-fields', 'random'],
      },
      resources: [],
    });
    expect(payload.items.find((item) => item.resource === 'contact-fields')?.agentActions[0].command)
      .toContain('--scan-contacts');
    expect(payload.items.find((item) => item.resource === 'random')?.agentActions[0].command)
      .toContain('unsupported-commands');
  });

  it('sorts high-priority mappings before alphabetized medium fallbacks', () => {
    const payload = buildBacklogPayload({
      generatedAt: '', sourceFile: '', sourceFormat: 'api-reference',
      apiReference: { version: '', generated: '', baseUrl: '' },
      instanceCapabilities: { enabled: true },
      summary: { resources: 1, endpoints: 1, methodsByVerb: {} },
      cliCoverage: { mappedResources: 0, unmappedResources: 1, unmappedResourceNames: ['zulu'] },
      commandSupport: {
        total: 3, supported: 0, unsupported: 3,
        supportedCommands: [], unsupportedCommands: ['', 'beta', 'alpha'],
      },
      resources: [{
        resource: 'zulu', description: '', endpointCount: 1, methods: [],
        cliCommand: 'zulu', cliMapping: 'unmapped',
      }],
    });
    expect(payload.items.map((item) => item.resource)).toEqual(['zulu', '', 'alpha', 'beta']);
  });
});
