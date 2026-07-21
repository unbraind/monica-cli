import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as infoCapabilities from '../src/commands/info-capabilities';
import { commandRoot, createAgentRunbookCommand } from '../src/commands/agent-runbook';
import * as fmt from '../src/formatters';

describe('agent-runbook command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates command with expected options', () => {
    const cmd = createAgentRunbookCommand();
    expect(cmd.name()).toBe('agent-runbook');
    expect(cmd.description()).toContain('read-only execution runbook');
    expect(cmd.options.some((option) => option.long === '--instance-aware')).toBe(true);
    expect(cmd.options.some((option) => option.long === '--include-optional')).toBe(true);
    expect(commandRoot('contacts list')).toBe('contacts');
    expect(commandRoot('monica --json contacts list')).toBe('contacts');
    expect(commandRoot('monica --json')).toBe('');
  });

  it('returns deterministic baseline runbook in json format', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const root = new Command().name('monica');
    root.addCommand(createAgentRunbookCommand());

    await root.parseAsync(['agent-runbook', '--format', 'json'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.mode).toBe('read-only');
    expect(payload.instanceCapabilities.enabled).toBe(false);
    expect(payload.summary.totalSteps).toBeGreaterThan(0);
    expect(payload.summary.totalExcludedSteps).toBe(0);
    expect(Array.isArray(payload.steps)).toBe(true);
    expect(payload.steps.some((step: { id: string }) => step.id === 'config-doctor')).toBe(true);
    expect(payload.steps.some((step: { id: string }) => step.id === 'api-snapshot')).toBe(false);
  });

  it('filters unsupported roots in instance-aware mode and reports excluded steps', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-04T00:00:00.000Z',
        summary: { total: 2, supported: 1, unsupported: 1 },
        probes: [
          {
            key: 'contacts',
            command: 'contacts list',
            endpoint: '/contacts?limit=1',
            supported: false,
            statusCode: 404,
            message: 'HTTP 404',
          },
          {
            key: 'contacts-duplicate', command: 'contacts get', endpoint: '/contacts/1',
            supported: false, statusCode: 405, message: 'HTTP 405',
          },
          {
            key: 'empty-command', command: '', endpoint: '/unknown', supported: false,
            statusCode: 404, message: 'HTTP 404',
          },
          {
            key: 'groups', command: 'groups list', endpoint: '/groups', supported: false,
            state: 'unavailable', statusCode: 500, message: 'offline',
          },
          {
            key: 'tasks', command: 'tasks list', endpoint: '/tasks', supported: false,
            statusCode: 500, message: 'transient',
          },
          {
            key: 'notes',
            command: 'notes list',
            endpoint: '/notes?limit=1',
            supported: true,
            statusCode: 200,
            message: 'OK',
          },
        ],
      },
    });

    const root = new Command().name('monica');
    root.addCommand(createAgentRunbookCommand());
    await root.parseAsync(['agent-runbook', '--format', 'json', '--instance-aware', '--refresh'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.instanceCapabilities.enabled).toBe(true);
    expect(payload.instanceCapabilities.source).toBe('live');
    expect(payload.summary.totalExcludedSteps).toBeGreaterThanOrEqual(1);
    expect(payload.excludedSteps.some((step: { commandRoot: string; reason: string }) => step.commandRoot === 'contacts' && step.reason === 'instance-unsupported')).toBe(true);
    expect(payload.steps.some((step: { commandRoot: string }) => step.commandRoot === 'contacts')).toBe(false);
  });

  it('includes optional steps and reports formatter failures', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const root = new Command().name('monica');
    root.addCommand(createAgentRunbookCommand());
    await root.parseAsync(['agent-runbook', '--format', 'json', '--include-optional'], { from: 'user' });
    expect(JSON.parse(String(log.mock.calls.at(-1)?.[0])).steps)
      .toContainEqual(expect.objectContaining({ id: 'api-snapshot' }));

    vi.spyOn(fmt, 'formatOutput').mockImplementation(() => { throw new Error('render failed'); });
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as never);
    const failingRoot = new Command().name('monica');
    failingRoot.addCommand(createAgentRunbookCommand());
    await expect(failingRoot.parseAsync([
      'agent-runbook', '--format', 'json',
    ], { from: 'user' })).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
