import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as client from '../src/api/client';
import * as fmt from '../src/formatters';
import { createApiResearchCommand } from '../src/commands/api-research';
import { buildProbePayload } from '../src/commands/api-research-probe';

vi.mock('fs', () => ({ readFileSync: vi.fn() }));
vi.mock('../src/api/client', () => ({ get: vi.fn() }));

const REFERENCE = JSON.stringify({
  endpoints: {
    contacts: { methods: { list: { method: 'GET', path: '/contacts' } } },
  },
});

describe('API research probe health semantics', () => {
  const getMock = client.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(REFERENCE);
  });

  afterEach(() => vi.restoreAllMocks());

  it.each([404, 405])('classifies HTTP %s as endpoint unsupported', async (statusCode) => {
    getMock.mockRejectedValue({ message: `HTTP ${statusCode}`, statusCode });
    const payload = await buildProbePayload({ source: 'api' });
    expect(payload.summary).toMatchObject({
      total: 1,
      supported: 0,
      unsupported: 1,
      unavailable: 0,
      errors: 0,
      healthy: true,
    });
    expect(payload.probes[0]).toMatchObject({ status: 'unsupported', supported: false });
  });

  it.each([401, 403, 429, 500, 503])('classifies HTTP %s as instance unavailable', async (statusCode) => {
    getMock.mockRejectedValue({ message: `HTTP ${statusCode}`, statusCode });
    const payload = await buildProbePayload({ source: 'api' });
    expect(payload.summary).toMatchObject({
      total: 1,
      supported: 0,
      unsupported: 0,
      unavailable: 1,
      errors: 0,
      healthy: false,
    });
    expect(payload.probes[0]).toMatchObject({ status: 'unavailable', supported: null });
  });

  it('keeps non-HTTP runtime failures distinct from API support', async () => {
    getMock.mockRejectedValue(new Error('socket closed'));
    const payload = await buildProbePayload({ source: 'api' });
    expect(payload.summary).toMatchObject({ unavailable: 0, errors: 1, healthy: false });
    expect(payload.probes[0]).toMatchObject({
      status: 'error',
      supported: null,
      statusCode: 0,
      message: 'socket closed',
    });
  });

  it.each([null, {}, { message: 1, statusCode: 500 }])(
    'normalizes malformed thrown API values', async (error) => {
      getMock.mockRejectedValue(error);
      const payload = await buildProbePayload({ source: 'api' });
      expect(payload.probes[0]).toMatchObject({ status: 'error', statusCode: 0 });
    },
  );

  it('offers a separate unavailable failure gate without tripping unsupported', async () => {
    getMock.mockRejectedValue({ message: 'HTTP 500', statusCode: 500 });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockImplementation((value) => JSON.stringify(value));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'probe', '--fail-on-unsupported',
    ], { from: 'user' });
    expect(exitSpy).not.toHaveBeenCalled();

    await createApiResearchCommand().parseAsync([
      '--format', 'json', 'probe', '--fail-on-unavailable',
    ], { from: 'user' });
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('enforces unsupported failures and reports formatter errors', async () => {
    getMock.mockRejectedValue({ message: 'HTTP 404', statusCode: 404 });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockImplementation((value) => JSON.stringify(value));
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await createApiResearchCommand().parseAsync([
      'probe', '--fail-on-unsupported',
    ], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(1);

    (fmt.formatOutput as unknown as ReturnType<typeof vi.fn>)
      .mockImplementation(() => { throw new Error('render failed'); });
    await createApiResearchCommand().parseAsync(['probe'], { from: 'user' });
    expect(exit).toHaveBeenCalledTimes(2);
  });

  it('normalizes sparse endpoint documents and error-only failure gates', async () => {
    (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify({
      endpoints: {
        sparse: { methods: { unknown: {}, get: { method: 'get' }, post: { method: 'POST' } } },
      },
    }));
    getMock.mockResolvedValue({});
    const sparse = await buildProbePayload({});
    expect(sparse.probes).toHaveLength(1);
    expect(sparse.probes[0].probePath).toBe('');
    (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify({
      endpoints: { sparse: {} },
    }));
    expect((await buildProbePayload({ source: 'api', resource: 'sparse' })).probes).toEqual([]);
    expect((await buildProbePayload({ source: 'api', resource: 'missing' })).probes).toEqual([]);
    (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue('{}');
    expect((await buildProbePayload({ source: 'api' })).probes).toEqual([]);

    (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(REFERENCE);
    getMock.mockRejectedValue(null);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockImplementation((value) => JSON.stringify(value));
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await createApiResearchCommand().parseAsync([
      'probe', '--fail-on-unavailable',
    ], { from: 'user' });
    expect(exit).toHaveBeenCalledWith(1);
  });
});
