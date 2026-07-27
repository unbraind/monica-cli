import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiResearchCommand } from '../src/commands/api-research';
import { writeOpenApiDocument } from '../src/commands/api-research-openapi';

describe('OpenAPI command integration', () => {
  let log: ReturnType<typeof vi.spyOn>;
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    exit = vi.spyOn(process, 'exit')
      .mockImplementation((() => undefined) as typeof process.exit);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('exports OpenAPI and edition diffs through command output', async () => {
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'openapi', '--edition', 'next', '--oas-version', '3.1.2',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
      openapi: '3.1.2',
      'x-monica-edition': 'next',
    });
    log.mockClear();
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'diff', '--from', 'stable', '--to', 'next',
      '--fail-on-breaking',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({ breaking: true });
    expect(exit).toHaveBeenCalledWith(2);
    log.mockClear();
    exit.mockClear();
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'diff', '--from', 'next', '--to', 'next',
      '--fail-on-breaking',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({ breaking: false });
    expect(exit).not.toHaveBeenCalled();
  });

  it('uses the standard error sink when OpenAPI generation fails', () => {
    writeOpenApiDocument('stable', '3.2.0', 'json', () => {
      throw new Error('contract failed');
    });
    expect(console.error).toHaveBeenCalledWith('Error: contract failed');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('validates contracts with current, stale, and unavailable source gates', async () => {
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'validate-contract', '--edition', 'next',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
      validation: { valid: true },
      sourceStatus: null,
    });
    log.mockClear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      commit: { sha: 'e08e91734170b6bbd582cb578532c3948196124e' },
    }), { status: 200 })));
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'validate-contract', '--edition', 'next',
      '--verify-source', '--fail-on-warnings',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
      validation: { valid: true },
      sourceStatus: { state: 'current' },
      gate: { failed: false },
    });

    log.mockClear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      commit: { sha: 'different' },
    }), { status: 200 })));
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'validate-contract', '--edition', 'next', '--verify-source',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
      validation: { valid: false, errors: ['Bundled source is stale'] },
      gate: { failed: true },
    });

    log.mockClear();
    exit.mockClear();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'validate-contract', '--edition', 'next',
      '--verify-source', '--fail-on-unavailable',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
      validation: {
        valid: false,
        errors: ['Upstream source freshness is unavailable'],
      },
      gate: { failed: true, failOnUnavailable: true },
    });
    expect(exit).toHaveBeenCalledWith(2);

    log.mockClear();
    exit.mockClear();
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'validate-contract', '--edition', 'next',
      '--verify-source',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
      validation: {
        valid: true,
        warnings: ['Upstream source freshness is unavailable'],
      },
      gate: { failed: false },
    });

    log.mockClear();
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'validate-contract', '--edition', 'next',
      '--verify-source', '--fail-on-warnings',
    ], { from: 'user' });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
      validation: {
        valid: true,
        warnings: ['Upstream source freshness is unavailable'],
      },
      gate: { failed: true, failOnWarnings: true },
    });
    expect(exit).toHaveBeenCalledWith(2);
  });
});
