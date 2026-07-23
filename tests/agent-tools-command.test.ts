import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAgentToolsCommand } from '../src/commands/agent-tools';
import { buildCommandCatalog } from '../src/commands/command-catalog';
import * as infoCapabilities from '../src/commands/info-capabilities';
import { Command } from 'commander';
import * as fmt from '../src/formatters';

vi.mock('../src/commands/stdout', () => ({
  writeFormattedOutput: async (payload: unknown, format: string) => {
    console.log(fmt.formatOutput(payload, format as never));
  },
}));

vi.mock('../src/api/client', () => ({
  getConfig: vi.fn(() => ({
    apiUrl: 'https://test.api',
    apiKey: 'test-key',
    readOnlyMode: true,
  })),
  setConfig: vi.fn(),
}));

vi.mock('../src/utils/settings', () => ({
  loadSettings: vi.fn(() => ({
    apiUrl: 'https://test.api',
    apiKey: 'test-key',
    readOnlyMode: true,
  })),
  saveSettings: vi.fn(),
  settingsFileExists: vi.fn(() => true),
  maskApiKey: vi.fn((key: string) => key.substring(0, 20) + '...'),
  maskPassword: vi.fn(() => '********'),
}));

describe('agent-tools command', () => {
  let program: Command;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
  });

  it('creates agent-tools command with subcommands', () => {
    const cmd = createAgentToolsCommand();
    expect(cmd.name()).toBe('agent-tools');
    expect(cmd.opts().format).toBe('toon');
    
    const subcommands = cmd.commands;
    expect(subcommands.length).toBeGreaterThanOrEqual(7);
    
    expect(subcommands.find(c => c.name() === 'openai')).toBeDefined();
    expect(subcommands.find(c => c.name() === 'openai-tools')).toBeDefined();
    expect(subcommands.find(c => c.name() === 'anthropic')).toBeDefined();
    expect(subcommands.find(c => c.name() === 'anthropic-tools')).toBeDefined();
    expect(subcommands.find(c => c.name() === 'catalog')).toBeDefined();
    expect(subcommands.find(c => c.name() === 'safe-commands')).toBeDefined();
    expect(subcommands.find(c => c.name() === 'mcp-tools')).toBeDefined();
  });

  it('builds command catalog successfully', () => {
    program.name('monica');
    const catalog = buildCommandCatalog(program);
    
    expect(catalog).toHaveProperty('name', 'monica');
    expect(catalog).toHaveProperty('fullCommand', 'monica');
    expect(catalog).toHaveProperty('description');
    expect(catalog).toHaveProperty('options');
    expect(catalog).toHaveProperty('subcommands');
  });

  it('exports valid JSON structure for OpenAI schemas', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const cmd = createAgentToolsCommand();
    const openaiCmd = cmd.commands.find(c => c.name() === 'openai');
    
    expect(openaiCmd).toBeDefined();
    expect(openaiCmd!.description()).toContain('OpenAI');
    
    consoleSpy.mockRestore();
  });

  it('executes OpenAI and Anthropic exports and their aliases', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    for (const commandName of ['openai', 'openai-tools', 'anthropic', 'anthropic-tools']) {
      const root = new Command().name('monica');
      root.addCommand(createAgentToolsCommand());
      await root.parseAsync(['agent-tools', '--format', 'json', commandName], { from: 'user' });
    }
    const payloads = logSpy.mock.calls.map((call) => JSON.parse(String(call[0])));
    expect(payloads[0]).toHaveProperty('functions');
    expect(payloads[1]).toHaveProperty('functions');
    expect(payloads[2]).toHaveProperty('tools');
    expect(payloads[3]).toHaveProperty('tools');
  });

  it('exports executable leaves with positional and inherited inputs', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const root = new Command().name('monica').option('--json', 'JSON output');
    const contacts = root.command('contacts').option('--limit <number>', 'Page size');
    contacts.command('get <contact-id>').description('Get contact');
    root.addCommand(createAgentToolsCommand());
    await root.parseAsync(['agent-tools', '--format', 'json', 'openai'], { from: 'user' });
    const payload = JSON.parse(String(log.mock.calls.at(-1)?.[0]));
    expect(payload.totalFunctions).toBe(payload.functions.length);
    expect(payload.functions).toContainEqual(expect.objectContaining({
      name: 'monica_contacts_get',
      parameters: expect.objectContaining({
        required: ['contact_id'],
        properties: expect.objectContaining({
          contact_id: expect.objectContaining({ type: 'string' }),
          limit: expect.objectContaining({ type: 'number' }),
          json: expect.objectContaining({ type: 'boolean' }),
        }),
      }),
    }));
    expect(payload.functions).not.toContainEqual(expect.objectContaining({ name: 'monica_contacts' }));
  });

  it('supports every export when agent-tools is used as the standalone root', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    for (const name of ['openai', 'anthropic', 'catalog', 'safe-commands', 'mcp-tools']) {
      await createAgentToolsCommand().parseAsync(['--format', 'json', name], { from: 'user' });
    }
    expect(log).toHaveBeenCalledTimes(5);
  });

  it('executes the catalog export', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const root = new Command().name('monica');
    root.addCommand(createAgentToolsCommand());
    await root.parseAsync(['agent-tools', '--format', 'json', 'catalog'], { from: 'user' });
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload).toHaveProperty('commandCatalog');
    expect(payload.aliases.openaiTools).toBe('agent-tools openai-tools');
  });

  it('exports valid JSON structure for Anthropic schemas', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const cmd = createAgentToolsCommand();
    const anthropicCmd = cmd.commands.find(c => c.name() === 'anthropic');
    
    expect(anthropicCmd).toBeDefined();
    expect(anthropicCmd!.description()).toContain('Anthropic');
    
    consoleSpy.mockRestore();
  });

  it('command catalog includes safety metadata', () => {
    program.name('monica');
    const catalog = buildCommandCatalog(program);
    
    expect(catalog).toHaveProperty('safety');
    expect(catalog.safety).toHaveProperty('operation');
    expect(catalog.safety).toHaveProperty('mutatesData');
    expect(catalog.safety).toHaveProperty('readOnlyCompatible');
  });

  it('exports safe command list in JSON mode', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const root = new Command().name('monica');
    root.addCommand(createAgentToolsCommand());
    await root.parseAsync(['agent-tools', '--format', 'json', 'safe-commands'], { from: 'user' });
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload).toHaveProperty('generatedAt');
    expect(payload).toHaveProperty('totalCommands');
    expect(payload).toHaveProperty('commands');
    expect(payload).toHaveProperty('totalExcludedCommands', 0);
    expect(payload).toHaveProperty('excludedCommands');
    expect(Array.isArray(payload.commands)).toBe(true);
    expect(Array.isArray(payload.excludedCommands)).toBe(true);
    payload.commands.forEach((item: { readOnlyCompatible: boolean }) => {
      expect(item.readOnlyCompatible).toBe(true);
    });
  });

  it('excludes mutating leaves from the safe command list', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const root = new Command().name('monica');
    const contacts = root.command('contacts');
    contacts.command('create').option('--name <name>');
    root.addCommand(createAgentToolsCommand());
    await root.parseAsync(['agent-tools', '--format', 'json', 'safe-commands'], { from: 'user' });
    const payload = JSON.parse(String(log.mock.calls.at(-1)?.[0]));
    expect(payload.commands).not.toContainEqual(expect.objectContaining({ command: 'monica contacts create' }));
  });

  it('supports instance-aware safe command filtering', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-03T00:00:00.000Z',
        summary: { total: 1, supported: 0, unsupported: 1 },
        probes: [{
          key: 'agentTools',
          command: 'agent-tools catalog',
          endpoint: '/agent-tools',
          supported: false,
          statusCode: 404,
          message: 'HTTP 404',
        }],
      },
    });
    const root = new Command().name('monica');
    root.addCommand(createAgentToolsCommand());
    await root.parseAsync(['agent-tools', '--format', 'json', 'safe-commands', '--instance-aware', '--refresh'], { from: 'user' });
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.instanceCapabilities.enabled).toBe(true);
    expect(payload.instanceCapabilities.source).toBe('live');
    expect(payload.totalCommands).toBe(0);
    expect(payload.totalExcludedCommands).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(payload.excludedCommands)).toBe(true);
    expect(payload.excludedCommands).toContainEqual({
      command: 'monica agent-tools safe-commands',
      reason: 'instance-unsupported',
      operation: 'read',
      mutatesData: false,
      readOnlyCompatible: true,
      statusCode: 404,
      endpoint: '/agent-tools',
      message: 'HTTP 404',
    });
  });

  it('exports MCP-ready tool metadata', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const root = new Command().name('monica');
    root.addCommand(createAgentToolsCommand());
    await root.parseAsync(['agent-tools', '--format', 'json', 'mcp-tools'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload).toHaveProperty('generatedAt');
    expect(payload).toHaveProperty('schemaVersion', '1.0.0');
    expect(payload).toHaveProperty('totalTools');
    expect(Array.isArray(payload.tools)).toBe(true);
    expect(payload.totalTools).toBe(payload.tools.length);
    if (payload.tools.length > 0) {
      const tool = payload.tools[0];
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('command');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool).toHaveProperty('safety');
    }

    const safeCommands = payload.tools.find((tool: { name: string }) => tool.name === 'monica_agent_tools_safe_commands');
    expect(safeCommands).toBeDefined();
    expect(safeCommands.inputSchema.required).toEqual([]);
  });

  it('attaches instance capability metadata to MCP tools', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'cache',
      report: {
        generatedAt: '2026-03-03T00:00:00.000Z',
        summary: { total: 1, supported: 1, unsupported: 0 },
        probes: [{
          key: 'agentTools', command: 'agent-tools catalog', endpoint: '/agent-tools',
          supported: true, statusCode: 200, message: 'OK',
        }],
      },
    });
    const root = new Command().name('monica');
    root.addCommand(createAgentToolsCommand());
    await root.parseAsync([
      'agent-tools', '--format', 'json', 'mcp-tools', '--instance-aware',
    ], { from: 'user' });
    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.instanceCapabilities).toEqual({
      enabled: true, source: 'cache', generatedAt: '2026-03-03T00:00:00.000Z',
    });
    expect(payload.tools.some((tool: { supportedOnInstance?: boolean }) => (
      tool.supportedOnInstance === true
    ))).toBe(true);
  });

  it('uses the standard fatal path for every generated export', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockImplementation(() => { throw new Error('render failed'); });
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as never);
    for (const name of ['openai', 'anthropic', 'catalog', 'safe-commands', 'mcp-tools']) {
      const root = new Command().name('monica');
      root.addCommand(createAgentToolsCommand());
      await expect(root.parseAsync([
        'agent-tools', '--format', 'json', name,
      ], { from: 'user' })).rejects.toThrow('exit');
    }
    expect(exit).toHaveBeenCalledTimes(5);
  });
});
