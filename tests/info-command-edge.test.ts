import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createInfoCommand } from '../src/commands/info';
import * as cache from '../src/utils/capability-cache';
import * as fmt from '../src/formatters';

vi.mock('../src/utils/capability-cache', () => ({
  loadCachedCapabilityReport: vi.fn(() => null),
  saveCapabilityReport: vi.fn(),
}));

const report = {
  generatedAt: '2026-07-21T00:00:00.000Z',
  summary: { total: 3, supported: 1, unsupported: 1, unavailable: 1, healthy: false },
  probes: [
    { key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true, state: 'supported' as const, statusCode: 200, message: 'OK' },
    { key: 'groups', command: 'groups list', endpoint: '/groups', supported: false, state: 'unsupported' as const, statusCode: 404, message: 'missing' },
    { key: 'notes', command: 'notes list', endpoint: '/notes', supported: null, state: 'unavailable' as const, statusCode: 500, message: 'offline' },
  ],
};

describe('info command edge output', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    (cache.loadCachedCapabilityReport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    vi.spyOn(api, 'probeApiCapabilities').mockResolvedValue(report);
    vi.spyOn(api, 'getSupportedCommands').mockReturnValue(['contacts list']);
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders human capability details and notes', async () => {
    const log = console.log as unknown as ReturnType<typeof vi.fn>;
    await createInfoCommand().parseAsync(['capabilities', '--format', 'table'], { from: 'user' });
    expect(log.mock.calls.some((call) => String(call[0]).includes('Capability notes'))).toBe(true);
  });

  it('renders human supported commands and structured unsupported commands', async () => {
    const log = console.log as unknown as ReturnType<typeof vi.fn>;
    await createInfoCommand().parseAsync([
      'supported-commands', '--format', 'table',
    ], { from: 'user' });
    expect(log.mock.calls.some((call) => String(call[0]).includes('Supported Commands: 1'))).toBe(true);
    await createInfoCommand().parseAsync([
      'unsupported-commands', '--format', 'json',
    ], { from: 'user' });
    const payload = JSON.parse(String(log.mock.calls.at(-1)?.[0]));
    expect(payload.total).toBe(1);
    expect(payload.commands[0].key).toBe('groups');
  });

  it('generates timestamps when capability reports omit them', async () => {
    vi.mocked(api.probeApiCapabilities).mockResolvedValue({ ...report, generatedAt: '' });
    const log = console.log as unknown as ReturnType<typeof vi.fn>;
    for (const name of ['capabilities', 'supported-commands', 'unsupported-commands']) {
      await createInfoCommand().parseAsync([name, '--format', 'json'], { from: 'user' });
      const payload = JSON.parse(String(log.mock.calls.at(-1)?.[0]));
      expect(payload.generatedAt).not.toBe('');
    }
  });

  it('reports missing subcommand help through Commander', async () => {
    const command = createInfoCommand();
    command.exitOverride();
    await expect(command.parseAsync([], { from: 'user' })).rejects.toMatchObject({ exitCode: 1 });
  });

  it('uses the standard error path for every capability-backed command', async () => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(api, 'probeApiCapabilities').mockRejectedValue(new Error('offline'));
    (cache.loadCachedCapabilityReport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);
    for (const name of [
      'capabilities', 'agent-context', 'supported-commands', 'unsupported-commands', 'instance-profile',
    ]) {
      await expect(createInfoCommand().parseAsync([name], { from: 'user' })).rejects.toThrow('exit');
    }
    expect(exit).toHaveBeenCalledTimes(5);
  });

  it('reports command-catalog formatter failures', async () => {
    vi.spyOn(fmt, 'formatOutput').mockImplementation(() => { throw new Error('render failed'); });
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as never);
    await expect(createInfoCommand().parseAsync([
      'command-catalog',
    ], { from: 'user' })).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
