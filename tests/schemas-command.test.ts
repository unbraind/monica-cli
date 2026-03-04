import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as fmt from '../src/formatters';
import { createSchemasCommand } from '../src/commands/schemas';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('schemas command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockImplementation((value) => JSON.stringify(value));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists available output schemas', async () => {
    const cmd = createSchemasCommand();
    await cmd.parseAsync(['--format', 'json', 'list'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.total).toBeGreaterThan(0);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'info-capabilities')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'info-unsupported-commands')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'info-instance-profile')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'info-command-catalog')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'agent-tools-safe-commands')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'search-results')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'schemas-sample')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'api-research-summary')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'api-research-probe')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'api-research-backlog')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'api-research-actions')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'api-research-coverage')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'api-research-snapshot')).toBe(true);
    expect(payload.schemas.some((item: { id: string }) => item.id === 'agent-runbook')).toBe(true);
  });

  it('returns a specific schema descriptor', async () => {
    const cmd = createSchemasCommand();
    await cmd.parseAsync(['--format', 'json', 'get', 'config-show'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.schema.id).toBe('config-show');
    expect(payload.schema.schema.type).toBe('object');
  });

  it('validates schema payload from file', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({ ok: true, apiUrl: 'http://example/api' }));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined as never) as (code?: string | number | null | undefined) => never);

    const cmd = createSchemasCommand();
    await cmd.parseAsync(['--format', 'json', 'validate', 'config-test', '/tmp/payload.json'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.inputFormat).toBe('json');
    expect(payload.errors).toEqual([]);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('validates YAML payload from file by extension auto-detection', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue('ok: true\napiUrl: http://example/api\n');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined as never) as (code?: string | number | null | undefined) => never);

    const cmd = createSchemasCommand();
    await cmd.parseAsync(['--format', 'json', 'validate', 'config-test', '/tmp/payload.yaml'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.inputFormat).toBe('yaml');
    expect(payload.errors).toEqual([]);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('validates YAML payload from stdin with explicit --input-format yaml', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue('ok: true\napiUrl: http://example/api\n');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined as never) as (code?: string | number | null | undefined) => never);

    const cmd = createSchemasCommand();
    await cmd.parseAsync(['--format', 'json', 'validate', 'config-test', '--input-format', 'yaml'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.inputFormat).toBe('yaml');
    expect(payload.errors).toEqual([]);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('fails validation for invalid payload', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({ ok: 'yes', apiUrl: 1 }));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code ?? 0}`);
    }) as (code?: string | number | null | undefined) => never);

    const cmd = createSchemasCommand();
    await expect(
      cmd.parseAsync(['--format', 'json', 'validate', 'config-test', '/tmp/payload-invalid.json'], { from: 'user' })
    ).rejects.toThrow('process.exit:1');

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(false);
    expect(payload.errors.length).toBeGreaterThan(0);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('generates a deterministic sample payload for a schema', async () => {
    const cmd = createSchemasCommand();
    await cmd.parseAsync(['--format', 'json', 'sample', 'config-test'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.schemaId).toBe('config-test');
    expect(payload.sample).toEqual({
      ok: false,
      apiUrl: 'string',
    });
  });
});
