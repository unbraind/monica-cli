import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as fmt from '../src/formatters';
import * as infoCapabilities from '../src/commands/info-capabilities';
import * as client from '../src/api/client';
import { createApiResearchCommand } from '../src/commands/api-research';
import { buildCoveragePayload, buildSummaryPayload } from '../src/commands/api-research-summary';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));
vi.mock('../src/api/client', () => ({
  get: vi.fn(),
}));

describe('api-research command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockImplementation((value) => JSON.stringify(value));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds backlog with instance unsupported items when instance-aware', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        groups: {
          methods: {
            list: { method: 'GET', path: '/groups' },
          },
        },
      },
    }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-04T00:00:00.000Z',
        summary: { total: 1, supported: 0, unsupported: 1 },
        probes: [
          {
            key: 'groups',
            command: 'groups list',
            endpoint: '/groups?limit=1',
            supported: false,
            statusCode: 404,
            message: 'HTTP 404',
          },
        ],
      },
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'backlog', '--instance-aware'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.backlog).toEqual({
      total: 1,
      high: 0,
      medium: 1,
    });
    expect(payload.items[0]).toMatchObject({
      resource: 'groups',
      cliCommand: 'groups',
      type: 'instance-unsupported',
      priority: 'medium',
      recommendedAction: 'Tags are commonly available and can substitute grouping for read-only segmentation. Suggested command: monica --json tags list --limit 100',
      agentActions: [
        {
          command: 'monica --json tags list --limit 100',
          reason: 'Tags are commonly available and can substitute grouping for read-only segmentation.',
          safety: 'read-only',
        },
        {
          command: 'monica --json contacts list --limit 100',
          reason: 'Direct contact listing is a safe fallback when groups endpoints are unavailable.',
          safety: 'read-only',
        },
      ],
    });
  });

  it('adds capability-only unsupported command families to backlog when absent from reference source', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      resources: {
        groups: {
          endpoints: [{ method: 'GET', path: '/groups' }],
        },
      },
    }));
    vi.spyOn(infoCapabilities, 'resolveCapabilityReportWithSource').mockResolvedValue({
      source: 'live',
      report: {
        generatedAt: '2026-03-04T00:00:00.000Z',
        summary: { total: 2, supported: 0, unsupported: 2 },
        probes: [
          {
            key: 'groups',
            command: 'groups list',
            endpoint: '/groups?limit=1',
            supported: false,
            statusCode: 404,
            message: 'HTTP 404',
          },
          {
            key: 'petCategories',
            command: 'pet-categories list',
            endpoint: '/petcategories?limit=1',
            supported: false,
            statusCode: 404,
            message: 'HTTP 404',
          },
        ],
      },
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'backlog', '--source', 'monica', '--instance-aware'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.backlog).toEqual({
      total: 2,
      high: 0,
      medium: 2,
    });
    expect(payload.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        resource: 'groups',
        cliCommand: 'groups',
        type: 'instance-unsupported',
        recommendedAction: 'Tags are commonly available and can substitute grouping for read-only segmentation. Suggested command: monica --json tags list --limit 100',
        agentActions: [
          {
            command: 'monica --json tags list --limit 100',
            reason: 'Tags are commonly available and can substitute grouping for read-only segmentation.',
            safety: 'read-only',
          },
          {
            command: 'monica --json contacts list --limit 100',
            reason: 'Direct contact listing is a safe fallback when groups endpoints are unavailable.',
            safety: 'read-only',
          },
        ],
      }),
      expect.objectContaining({
        resource: 'pet-categories',
        cliCommand: 'pet-categories',
        type: 'instance-unsupported',
        reason: 'Command family is unsupported on this instance but is not represented in the selected API reference source.',
        recommendedAction: 'Fallback scan mode derives categories from pets when /petcategories is missing. Suggested command: monica --json pet-categories list --scan-pets --pet-max-pages 2',
        agentActions: [
          {
            command: 'monica --json pet-categories list --scan-pets --pet-max-pages 2',
            reason: 'Fallback scan mode derives categories from pets when /petcategories is missing.',
            safety: 'read-only',
          },
          {
            command: 'monica --json pets list --limit 100 --max-pages 2',
            reason: 'Direct pet listing provides category metadata even on older instances.',
            safety: 'read-only',
          },
        ],
      }),
    ]));
  });

  it('probes only non-parameterized GET endpoints by default', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const getMock = client.get as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        activities: {
          methods: {
            list: { method: 'GET', path: '/activities' },
            get: { method: 'GET', path: '/activities/:id' },
          },
        },
      },
    }));
    getMock.mockResolvedValue({ data: [] });
    getMock.mockClear();

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'probe'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.total).toBe(1);
    expect(payload.summary.supported).toBe(1);
    expect(payload.summary.unsupported).toBe(0);
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('/activities');
  });

  it('uses safe default query params for known GET endpoints that require query input', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const getMock = client.get as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        contacts: {
          methods: {
            search: { method: 'GET', path: '/contacts/search' },
          },
        },
      },
    }));
    getMock.mockResolvedValue({ data: [] });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'probe'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.total).toBe(1);
    expect(payload.summary.supported).toBe(1);
    expect(payload.summary.unsupported).toBe(0);
    expect(payload.probes[0].probeParams).toEqual({ query: 'a', limit: 1 });
    expect(getMock).toHaveBeenCalledWith('/contacts', { query: 'a', limit: 1 });
  });

  it('classifies parameterized GET 404 responses as unknown-id when enabled', async () => {
    const readFileSyncMock = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;
    const getMock = client.get as unknown as ReturnType<typeof vi.fn>;
    readFileSyncMock.mockReturnValue(JSON.stringify({
      endpoints: {
        activities: {
          methods: {
            get: { method: 'GET', path: '/activities/:id' },
          },
        },
      },
    }));
    getMock.mockRejectedValue({
      message: 'HTTP 404',
      statusCode: 404,
    });

    const cmd = createApiResearchCommand();
    await cmd.parseAsync(['--format', 'json', 'probe', '--include-parameterized', '--id-replacement', '999999'], { from: 'user' });

    const payload = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0]));
    expect(payload.summary.total).toBe(1);
    expect(payload.summary.unknownId).toBe(1);
    expect(payload.summary.unsupported).toBe(0);
    expect(payload.probes[0].status).toBe('unknown-id');
    expect(payload.probes[0].supported).toBeNull();
    expect(getMock).toHaveBeenCalledWith('/activities/999999');
  });
});
