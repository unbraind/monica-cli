import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  request: vi.fn(),
  upload: vi.fn(),
  getConfig: vi.fn(),
}));

vi.mock('../src/api/client', () => client);

import { getConfig, request, upload } from '../src/api/client';
import { createApiCommand } from '../src/commands/api';
import { findSchema } from '../src/commands/schema-registry';
import { validateValueAgainstSchema } from '../src/commands/schema-validator';

describe('exact Monica API command', () => {
  let log: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;
  let exit: ReturnType<typeof vi.spyOn>;
  const requestMock = request as ReturnType<typeof vi.fn>;
  const uploadMock = upload as ReturnType<typeof vi.fn>;
  const getConfigMock = getConfig as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as typeof process.exit);
    requestMock.mockResolvedValue({ data: { id: 42 } });
    uploadMock.mockResolvedValue({ data: { id: 43 } });
    getConfigMock.mockReturnValue({ readOnlyMode: false });
  });

  afterEach(() => vi.restoreAllMocks());

  it('inspects an operation without dispatching a request', async () => {
    await createApiCommand().parseAsync([
      'inspect', 'next_post_vaults', '--edition', 'next', '--format', 'json',
    ], { from: 'user' });
    const payload = JSON.parse(String(log.mock.calls[0]![0])) as Record<string, unknown>;
    expect(payload).toMatchObject({
      operationId: 'next_post_vaults',
      method: 'POST',
    });
    expect(validateValueAgainstSchema(payload, findSchema('api-operation-inspect')!.schema))
      .toEqual([]);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('executes a declared GET operation', async () => {
    await createApiCommand().parseAsync([
      'get', 'stable_get_contacts_id', '--param', 'id=42', '--query', 'with=contactfields',
      '--format', 'json',
    ], { from: 'user' });
    expect(requestMock).toHaveBeenCalledWith('/contacts/42', {
      method: 'GET',
      params: { with: 'contactfields' },
      body: undefined,
    });
    expect(JSON.parse(String(log.mock.calls[0]![0]))).toEqual({ data: { id: 42 } });
  });

  it('executes an explicitly confirmed mutation', async () => {
    await createApiCommand().parseAsync([
      'mutate', 'next_post_vaults', '--edition', 'next', '--body', '{"name":"Test"}',
      '--confirm', '--format', 'json',
    ], { from: 'user' });
    expect(requestMock).toHaveBeenCalledWith('/vaults', {
      method: 'POST',
      params: {},
      body: { name: 'Test' },
    });
  });

  it('executes declared multipart uploads with validated files', async () => {
    await createApiCommand().parseAsync([
      'mutate', 'stable_post_documents', '--form', 'contact_id=42',
      '--file', 'document=package.json', '--confirm', '--format', 'json',
    ], { from: 'user' });
    expect(uploadMock).toHaveBeenCalledWith('/documents', expect.any(FormData), {});
    const form = uploadMock.mock.calls[0]![1] as FormData;
    expect(form.get('contact_id')).toBe('42');
    expect(form.get('document')).toBeInstanceOf(File);
  });

  it('blocks multipart file access in read-only mode before upload', async () => {
    getConfigMock.mockReturnValueOnce({ readOnlyMode: true });
    await createApiCommand().parseAsync([
      'mutate', 'stable_post_documents', '--form', 'contact_id=42',
      '--file', 'document=does-not-exist', '--confirm',
    ], { from: 'user' });
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Read-only mode enabled'));
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it.each([
    ['multipart body', ['mutate', 'stable_post_documents', '--body', '{}', '--confirm']],
    ['form on JSON', ['mutate', 'next_post_vaults', '--edition', 'next', '--form', 'name=x', '--confirm']],
  ])('rejects %s input mode mismatches', async (_name, args) => {
    await createApiCommand().parseAsync(args, { from: 'user' });
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    expect(requestMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it.each([
    ['inspect', ['inspect', 'missing']],
    ['read mutation', ['get', 'next_post_vaults', '--edition', 'next']],
    ['mutate read', ['mutate', 'stable_get_me', '--confirm']],
    ['confirmation', ['mutate', 'next_post_vaults', '--edition', 'next', '--body', '{"name":"x"}']],
  ])('reports %s failures through the standard error contract', async (_name, args) => {
    await createApiCommand().parseAsync(args, { from: 'user' });
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    expect(exit).toHaveBeenCalledWith(1);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('reports request failures through the standard error contract', async () => {
    requestMock.mockRejectedValueOnce(new Error('offline'));
    await createApiCommand().parseAsync(['get', 'stable_get_me'], { from: 'user' });
    expect(error).toHaveBeenCalledWith('Error: offline');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
