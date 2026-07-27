import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiResearchCommand } from '../src/commands/api-research';
import { writeOpenApiDocument } from '../src/commands/api-research-openapi';
import { loadBundledContractReference } from '../src/commands/api-research-shared';

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

  async function validationOutput(...args: string[]): Promise<Record<string, unknown>> {
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'validate-contract', '--edition', 'next', ...args,
    ], { from: 'user' });
    return JSON.parse(log.mock.calls[0]![0] as string) as Record<string, unknown>;
  }

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

  it('uses the standard error sink when a diff command fails', async () => {
    log.mockImplementationOnce(() => {
      throw new Error('diff output failed');
    });
    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'diff', '--from', 'stable', '--to', 'next',
    ], { from: 'user' });
    expect(console.error).toHaveBeenCalledWith('Error: diff output failed');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('uses the standard error sink when validation output fails', async () => {
    log.mockImplementationOnce(() => {
      throw new Error('validation output failed');
    });
    await validationOutput();
    expect(console.error).toHaveBeenCalledWith('Error: validation output failed');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('validates a contract offline without source status', async () => {
    expect(await validationOutput()).toMatchObject({
      validation: { valid: true },
      sourceStatus: null,
    });
  });

  it('validates a current bundled source independently', async () => {
    const bundledCommit = loadBundledContractReference('next').source!.commit;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      commit: { sha: bundledCommit },
    }), { status: 200 })));
    expect(await validationOutput('--verify-source', '--fail-on-warnings')).toMatchObject({
      validation: { valid: true },
      sourceStatus: { state: 'current' },
      gate: { failed: false },
    });
  });

  it('fails validation for a stale bundled source', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      commit: { sha: 'different' },
    }), { status: 200 })));
    expect(await validationOutput('--verify-source')).toMatchObject({
      validation: { valid: false, errors: ['Bundled source is stale'] },
      gate: { failed: true },
    });
    expect(exit).toHaveBeenCalledWith(2);
  });

  it('fails unavailable source verification when required', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await validationOutput('--verify-source', '--fail-on-unavailable')).toMatchObject({
      validation: {
        valid: false,
        errors: ['Upstream source freshness is unavailable'],
      },
      gate: { failed: true, failOnUnavailable: true },
    });
    expect(exit).toHaveBeenCalledWith(2);
  });

  it('warns without failing when source verification is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await validationOutput('--verify-source')).toMatchObject({
      validation: {
        valid: true,
        warnings: ['Upstream source freshness is unavailable'],
      },
      gate: { failed: false },
    });
    expect(exit).not.toHaveBeenCalled();
  });

  it('fails warnings when the warning gate is enabled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await validationOutput('--verify-source', '--fail-on-warnings')).toMatchObject({
      validation: {
        valid: true,
        warnings: ['Upstream source freshness is unavailable'],
      },
      gate: { failed: true, failOnWarnings: true },
    });
    expect(exit).toHaveBeenCalledWith(2);
  });
});
