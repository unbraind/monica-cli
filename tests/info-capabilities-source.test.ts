import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import * as capabilityCache from '../src/utils/capability-cache';
import { createInfoCommand } from '../src/commands/info';

vi.mock('../src/utils/capability-cache', () => ({
  loadCachedCapabilityReport: vi.fn(() => null),
  saveCapabilityReport: vi.fn(),
}));

describe('info capability source metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED');
    (capabilityCache.loadCachedCapabilityReport as unknown as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (capabilityCache.saveCapabilityReport as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes source=live for info capabilities json when probing', async () => {
    vi.spyOn(api, 'probeApiCapabilities').mockResolvedValue({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 1, supported: 1, unsupported: 0 },
      probes: [{ key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true, statusCode: 200, message: 'OK' }],
    });

    const cmd = createInfoCommand();
    await cmd.parseAsync(['capabilities', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as { source: string; generatedAt: string };
    expect(payload.source).toBe('live');
    expect(payload.generatedAt).toBe('2026-03-03T00:00:00.000Z');
  });

  it('includes source=cache for info capabilities json when cache is used', async () => {
    (capabilityCache.loadCachedCapabilityReport as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 1, supported: 1, unsupported: 0 },
      probes: [{ key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true, statusCode: 200, message: 'OK' }],
    });
    const probeSpy = vi.spyOn(api, 'probeApiCapabilities');

    const cmd = createInfoCommand();
    await cmd.parseAsync(['capabilities', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as { source: string; generatedAt: string };
    expect(payload.source).toBe('cache');
    expect(payload.generatedAt).toBe('2026-03-03T00:00:00.000Z');
    expect(probeSpy).not.toHaveBeenCalled();
  });

  it('includes source metadata for info supported-commands json', async () => {
    vi.spyOn(api, 'probeApiCapabilities').mockResolvedValue({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 2, supported: 1, unsupported: 1 },
      probes: [
        { key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true, statusCode: 200, message: 'OK' },
        { key: 'groups', command: 'groups list', endpoint: '/groups', supported: false, statusCode: 404, message: 'Not Found' },
      ],
    });
    vi.spyOn(api, 'getSupportedCommands').mockReturnValue(['contacts list']);

    const cmd = createInfoCommand();
    await cmd.parseAsync(['supported-commands', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as { source: string; generatedAt: string; total: number; commands: string[] };
    expect(payload.source).toBe('live');
    expect(payload.generatedAt).toBe('2026-03-03T00:00:00.000Z');
    expect(payload.total).toBe(1);
    expect(payload.commands).toEqual(['contacts list']);
  });

  it('includes source metadata for info unsupported-commands json', async () => {
    vi.spyOn(api, 'probeApiCapabilities').mockResolvedValue({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 2, supported: 1, unsupported: 1 },
      probes: [
        { key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: true, statusCode: 200, message: 'OK' },
        { key: 'groups', command: 'groups list', endpoint: '/groups', supported: false, statusCode: 404, message: 'Not Found' },
      ],
    });

    const cmd = createInfoCommand();
    await cmd.parseAsync(['unsupported-commands', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      source: string;
      generatedAt: string;
      total: number;
      commands: Array<{
        key: string;
        command: string;
        endpoint: string;
        statusCode: number;
        message: string;
        severity: string;
        recommendedAction: string;
        fallbackCommands: string[];
      }>;
    };
    expect(payload.source).toBe('live');
    expect(payload.generatedAt).toBe('2026-03-03T00:00:00.000Z');
    expect(payload.total).toBe(1);
    expect(payload.commands).toHaveLength(1);
    expect(payload.commands[0]).toMatchObject({
      key: 'groups',
      command: 'groups list',
      endpoint: '/groups',
      statusCode: 404,
      message: 'Not Found',
      severity: 'unsupported',
    });
    expect(payload.commands[0].recommendedAction.length).toBeGreaterThan(0);
    expect(payload.commands[0].fallbackCommands.length).toBeGreaterThan(0);
    expect(payload.commands[0].recommendedAction).toContain('tag-scan fallback');
    expect(payload.commands[0].fallbackCommands).toEqual(expect.arrayContaining([
      'monica --json groups list --scan-tags --tag-max-pages 2',
      'monica --json contacts list --limit 50',
      'monica --json tags list --limit 50',
    ]));
  });

  it('adds contact-fields specific fallback guidance for unsupported endpoint variants', async () => {
    vi.spyOn(api, 'probeApiCapabilities').mockResolvedValue({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 1, supported: 0, unsupported: 1 },
      probes: [
        { key: 'contactFields', command: 'contact-fields list', endpoint: '/contactfields', supported: false, statusCode: 405, message: 'Method Not Allowed' },
      ],
    });

    const cmd = createInfoCommand();
    await cmd.parseAsync(['unsupported-commands', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      commands: Array<{ key: string; severity: string; recommendedAction: string; fallbackCommands: string[] }>;
    };
    expect(payload.commands[0]).toMatchObject({
      key: 'contactFields',
      severity: 'unsupported',
    });
    expect(payload.commands[0].recommendedAction).toContain('contact-scoped');
    expect(payload.commands[0].fallbackCommands).toEqual(expect.arrayContaining([
      'monica --json contact-fields list <contact-id> --limit 10',
      'monica --json contact-fields list --scan-contacts --contact-max-pages 2 --limit 50',
    ]));
  });

  it('adds pet-categories guidance with safe fallback commands', async () => {
    vi.spyOn(api, 'probeApiCapabilities').mockResolvedValue({
      generatedAt: '2026-03-03T00:00:00.000Z',
      summary: { total: 1, supported: 0, unsupported: 1 },
      probes: [
        { key: 'petCategories', command: 'pet-categories list', endpoint: '/petcategories', supported: false, statusCode: 404, message: 'Not Found' },
      ],
    });

    const cmd = createInfoCommand();
    await cmd.parseAsync(['unsupported-commands', '--format', 'json'], { from: 'user' });

    const payload = (fmt.formatOutput as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      commands: Array<{ key: string; recommendedAction: string; fallbackCommands: string[] }>;
    };
    expect(payload.commands[0].key).toBe('petCategories');
    expect(payload.commands[0].recommendedAction).toContain('--scan-pets fallback');
    expect(payload.commands[0].fallbackCommands).toEqual(expect.arrayContaining([
      'monica --json pet-categories list --scan-pets --pet-max-pages 2',
      'monica --json pets list --limit 50',
      'monica --json info supported-commands',
    ]));
  });
});
