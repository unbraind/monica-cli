import * as fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSchemasCommand } from '../src/commands/schemas';

vi.mock('fs', () => ({ readFileSync: vi.fn() }));

describe('schemas command input failures', () => {
  let log: ReturnType<typeof vi.spyOn>;
  const read = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.clearAllMocks();
    log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  async function expectExit(args: string[]): Promise<Record<string, unknown>> {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);
    await expect(createSchemasCommand().parseAsync(args, { from: 'user' })).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
    return JSON.parse(String(log.mock.calls.at(-1)?.[0])) as Record<string, unknown>;
  }

  it('reports unknown schemas for get, sample, and validate', async () => {
    for (const action of ['get', 'sample', 'validate']) {
      const payload = await expectExit(['--format', 'json', action, 'unknown']);
      expect(payload.ok).toBe(false);
    }
  });

  it('reports empty and invalid JSON or YAML payloads', async () => {
    read.mockReturnValueOnce('');
    expect((await expectExit([
      '--format', 'json', 'validate', 'config-test', '/tmp/input.json',
    ])).message).toContain('empty');
    read.mockReturnValueOnce('{invalid');
    expect((await expectExit([
      '--format', 'json', 'validate', 'config-test', '/tmp/input.json',
    ])).message).toContain('valid JSON');
    read.mockReturnValueOnce(': invalid: yaml:');
    expect((await expectExit([
      '--format', 'json', 'validate', 'config-test', '/tmp/input.yml',
    ])).message).toContain('valid YAML');
  });

  it('auto-detects YAML from stdin when JSON parsing fails', async () => {
    read.mockReturnValue('ok: true\napiUrl: https://example.test/api\n');
    await createSchemasCommand().parseAsync([
      '--format', 'json', 'validate', 'config-test',
    ], { from: 'user' });
    const payload = JSON.parse(String(log.mock.calls.at(-1)?.[0]));
    expect(payload.ok).toBe(true);
    expect(read).toHaveBeenCalledWith(0, 'utf-8');
  });

  it('reports invalid stdin after both JSON and YAML parsing fail', async () => {
    read.mockReturnValue(': invalid: yaml:');
    const payload = await expectExit(['--format', 'json', 'validate', 'config-test']);
    expect(payload.ok).toBe(false);
  });
});
