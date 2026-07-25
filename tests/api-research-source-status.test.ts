import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as fmt from '../src/formatters';
import {
  buildSourceStatusPayload,
  attachApiResearchSourceStatusSubcommand,
} from '../src/commands/api-research-source-status';
import { Command } from 'commander';

vi.mock('fs', () => ({ readFileSync: vi.fn() }));

const BUNDLED_COMMIT = '32028ce3ce79cef38df5d27a297e5b20680f0065';
const ORIGINAL_FETCH = globalThis.fetch;

function setReference(source: object | undefined = {
  repository: 'monicahq/monica',
  branch: '4.x',
  commit: BUNDLED_COMMIT,
  routeFile: 'routes/api.php',
}): void {
  vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ source }));
}

describe('api-research source-status', () => {
  beforeEach(() => {
    setReference();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it('reports the bundled source as current from the public branch response', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      commit: { sha: BUNDLED_COMMIT },
    })));
    const payload = await buildSourceStatusPayload({}, fetcher);

    expect(payload).toMatchObject({
      state: 'current',
      current: true,
      source: {
        repository: 'monicahq/monica',
        branch: '4.x',
        routeFile: 'routes/api.php',
        bundledCommit: BUNDLED_COMMIT,
      },
      upstream: { commit: BUNDLED_COMMIT },
      error: null,
      gate: { enabled: false, failed: false },
      recommendedActions: ['monica --json api-research coverage --fail-on-unmapped'],
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.github.com/repos/monicahq/monica/branches/4.x',
      expect.objectContaining({ headers: expect.objectContaining({ 'User-Agent': 'monica-cli' }) }),
    );
  });

  it('reports stale provenance and supports a structured CI gate', async () => {
    const payload = await buildSourceStatusPayload(
      { failOnStale: true },
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ commit: { sha: 'new-head' } }))),
    );

    expect(payload.state).toBe('stale');
    expect(payload.current).toBe(false);
    expect(payload.gate).toEqual({
      enabled: true,
      failed: true,
      failOnStale: true,
      failOnUnavailable: false,
      reasons: ['bundled API source is stale'],
    });
    expect(payload.recommendedActions).toContain(
      'Refresh docs/monica-api-reference.json from the authoritative 4.x routes',
    );
  });

  it('keeps HTTP and malformed upstream failures distinct from staleness', async () => {
    const httpPayload = await buildSourceStatusPayload(
      { failOnUnavailable: true },
      vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    );
    const malformedPayload = await buildSourceStatusPayload(
      {},
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ commit: {} }))),
    );

    expect(httpPayload).toMatchObject({
      state: 'unavailable',
      current: null,
      error: 'GitHub branch lookup failed with HTTP 503',
      gate: { failed: true, reasons: ['upstream source could not be verified'] },
    });
    expect(malformedPayload.error).toBe('GitHub branch response did not include a commit SHA');
  });

  it('normalizes thrown and incomplete-provenance failures', async () => {
    const thrownPayload = await buildSourceStatusPayload(
      {},
      vi.fn().mockRejectedValue('network down'),
    );
    setReference({});
    const missingPayload = await buildSourceStatusPayload(
      {},
      vi.fn(),
    );

    expect(thrownPayload.error).toBe('GitHub branch lookup failed');
    expect(missingPayload).toMatchObject({
      state: 'unavailable',
      source: null,
      upstream: { apiUrl: null, commit: null },
      error: 'Bundled Monica API reference has incomplete source provenance',
    });
  });

  it('reports public branch request timeouts as unavailable', async () => {
    const payload = await buildSourceStatusPayload(
      {},
      vi.fn().mockRejectedValue({ name: 'AbortError' }),
    );

    expect(payload.error).toBe('GitHub branch lookup timed out after 15000ms');
  });

  it('renders command output and exits two only when the requested gate fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ commit: { sha: 'new-head' } })),
    );
    const output = vi.spyOn(fmt, 'formatOutput').mockImplementation((value) => JSON.stringify(value));
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const command = new Command().option('--format <format>', '', 'json');
    attachApiResearchSourceStatusSubcommand(command);

    await command.parseAsync(['source-status', '--fail-on-stale'], { from: 'user' });

    expect(output).toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(2);
  });

  it('uses fatal output handling for unexpected rendering failures', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'));
    vi.spyOn(fmt, 'formatOutput').mockImplementation(() => {
      throw new Error('render failed');
    });
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const command = new Command().option('--format <format>', '', 'json');
    attachApiResearchSourceStatusSubcommand(command);

    await command.parseAsync(['source-status'], { from: 'user' });

    expect(exit).toHaveBeenCalledWith(1);
  });
});
