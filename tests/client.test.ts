import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  del,
  get,
  getAllPages,
  MonicaApiError,
  paginate,
  post,
  put,
  request,
  setConfig,
  upload,
} from '../src/api/client';

const ORIGINAL_FETCH = globalThis.fetch;

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('Monica HTTP client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setConfig({
      apiUrl: 'https://monica.test/api',
      apiKey: 'test-token',
      readOnlyMode: false,
    });
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof fetch;
    process.env.MONICA_MAX_GET_RETRIES = '0';
    process.env.MONICA_REQUEST_TIMEOUT_MS = '1000';
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
    delete process.env.MONICA_MAX_GET_RETRIES;
    delete process.env.MONICA_REQUEST_TIMEOUT_MS;
  });

  it('sends authenticated GET requests with defined query parameters', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ id: 1 }] }));
    const result = await get<{ data: Array<{ id: number }> }>('/contacts', {
      page: 2,
      limit: undefined,
      query: 'Ada',
    });
    expect(result.data[0]?.id).toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://monica.test/api/contacts?page=2&query=Ada',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          Accept: 'application/json',
        }),
      }),
    );
  });

  it('omits an empty query string when every parameter is undefined', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await request('/contacts', { params: { limit: undefined } });
    expect(fetch).toHaveBeenCalledWith(
      'https://monica.test/api/contacts', expect.any(Object),
    );
  });

  it('parses JSON, JSON-like text, plain text, and empty response bodies', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
      .mockResolvedValueOnce(new Response('accepted', { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }));
    await expect(request('/one')).resolves.toEqual({ ok: true });
    await expect(request('/two')).resolves.toEqual({ ok: true });
    await expect(request('/three')).resolves.toBe('accepted');
    await expect(request('/four')).resolves.toBeNull();
  });

  it('handles a response without a content-type header', async () => {
    fetchMock.mockResolvedValue({
      ok: true, status: 200, headers: { get: () => null }, text: async () => 'plain',
    });
    await expect(request('/plain')).resolves.toBe('plain');
  });

  it('serializes write bodies and exposes method helpers', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { id: 1 } }))
      .mockResolvedValueOnce(jsonResponse({ data: { id: 1 } }))
      .mockResolvedValueOnce(jsonResponse({ deleted: true, id: 1 }));
    await post('/contacts', { name: 'Ada' });
    await put('/contacts/1', { name: 'Grace' });
    await del('/contacts/1');
    expect(fetch).toHaveBeenNthCalledWith(1, expect.any(String), expect.objectContaining({
      method: 'POST', body: '{"name":"Ada"}',
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({
      method: 'PUT', body: '{"name":"Grace"}',
    }));
    expect(fetch).toHaveBeenNthCalledWith(3, expect.any(String), expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it.each(['POST', 'PUT', 'DELETE'] as const)('blocks %s before fetch in read-only mode', async (method) => {
    setConfig({ apiUrl: 'https://monica.test/api', apiKey: 'token', readOnlyMode: true });
    await expect(request('/contacts', { method })).rejects.toThrow(
      `Read-only mode enabled: blocked ${method} /contacts`,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('normalizes nested, top-level, text, and fallback API errors', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'Nested', error_code: 42 } }, 422))
      .mockResolvedValueOnce(jsonResponse({ message: 'Top line\nprivate trace' }, 500))
      .mockResolvedValueOnce(new Response('Plain failure', { status: 502 }))
      .mockResolvedValueOnce(new Response('', { status: 503 }));
    await expect(get('/one')).rejects.toMatchObject({
      name: 'MonicaApiError', message: 'Nested', errorCode: 42, statusCode: 422,
    });
    await expect(get('/two')).rejects.toMatchObject({ message: 'Top line', errorCode: 0 });
    await expect(get('/three')).rejects.toMatchObject({ message: 'Plain failure' });
    await expect(get('/four')).rejects.toMatchObject({ message: 'HTTP 503' });
  });

  it('retries throttled GET requests only within the configured budget', async () => {
    process.env.MONICA_MAX_GET_RETRIES = '1';
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'slow down' }, 429, { 'Retry-After': '0' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    await expect(get('/contacts')).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);

    fetchMock.mockReset().mockResolvedValue(jsonResponse({ message: 'slow down' }, 429));
    await expect(post('/contacts', {})).rejects.toMatchObject({ statusCode: 429 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('wraps abort failures with timeout context and preserves other failures', async () => {
    fetchMock
      .mockRejectedValueOnce({ name: 'AbortError' })
      .mockRejectedValueOnce(new Error('network down'));
    await expect(get('/contacts')).rejects.toMatchObject({
      message: 'Request timed out after 1000ms: GET /contacts',
      cause: { name: 'AbortError' },
    });
    await expect(get('/contacts')).rejects.toThrow('network down');
  });

  it('uploads multipart data and normalizes upload errors', async () => {
    const form = new FormData();
    form.set('file', new Blob(['hello']), 'hello.txt');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: { id: 4 } }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Invalid file' }, 422));
    await expect(upload('/documents', form)).resolves.toEqual({ data: { id: 4 } });
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://monica.test/api/documents', expect.objectContaining({
      method: 'POST', body: form,
    }));
    await expect(upload('/documents', form)).rejects.toMatchObject({
      message: 'Invalid file', errorCode: 0, statusCode: 422,
    });
  });

  it('uses the HTTP status when an upload error payload has no message', async () => {
    const form = new FormData();
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    await expect(upload('/documents', form)).rejects.toMatchObject({
      message: 'HTTP 500', errorCode: 0, statusCode: 500,
    });
  });

  it('blocks, times out, and preserves network errors during upload', async () => {
    const form = new FormData();
    setConfig({ apiUrl: 'https://monica.test/api', apiKey: 'token', readOnlyMode: true });
    await expect(upload('/documents', form)).rejects.toThrow('Read-only mode enabled');

    setConfig({ apiUrl: 'https://monica.test/api', apiKey: 'token', readOnlyMode: false });
    fetchMock
      .mockRejectedValueOnce({ name: 'AbortError' })
      .mockRejectedValueOnce(new Error('socket closed'));
    await expect(upload('/documents', form)).rejects.toMatchObject({
      message: 'Request timed out after 1000ms: POST /documents',
    });
    await expect(upload('/documents', form)).rejects.toThrow('socket closed');
  });

  it('paginates until the last page or the explicit maximum', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({
        data: [{ id: 1 }], meta: { current_page: 1, last_page: 3 },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: [{ id: 2 }], meta: { current_page: 2, last_page: 3 },
      }));
    await expect(getAllPages<{ id: number }>('/contacts', { limit: 1 }, 2)).resolves.toEqual([
      { id: 1 }, { id: 2 },
    ]);

    fetchMock.mockReset().mockResolvedValue(jsonResponse({
      data: [{ id: 3 }], meta: { current_page: 1, last_page: 1 },
    }));
    const pages: Array<Array<{ id: number }>> = [];
    for await (const page of paginate<{ id: number }>('/contacts')) pages.push(page);
    expect(pages).toEqual([[{ id: 3 }]]);
  });

  it('constructs typed Monica API errors', () => {
    const error = new MonicaApiError('Failure', 7, 409);
    expect(error).toMatchObject({ name: 'MonicaApiError', message: 'Failure', errorCode: 7, statusCode: 409 });
  });
});
