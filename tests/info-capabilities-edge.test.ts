import { describe, expect, it } from 'vitest';
import {
  getUnavailableCommands,
  getUnsupportedCommands,
  parsePositiveInt,
} from '../src/commands/info-capabilities';
import { formatCapabilityHints } from '../src/api/capabilities';

describe('capability guidance edges', () => {
  it('strictly parses non-negative safe integers', () => {
    expect(parsePositiveInt('0')).toBe(0);
    expect(parsePositiveInt(' 12 ')).toBe(12);
    expect(() => parsePositiveInt('1x')).toThrow('non-negative integer');
    expect(() => parsePositiveInt('-1')).toThrow('non-negative integer');
    expect(() => parsePositiveInt('9'.repeat(100))).toThrow('non-negative integer');
  });

  it('classifies every unsupported status and compatibility recommendation', () => {
    const entries = getUnsupportedCommands({
      generatedAt: '', summary: { total: 8, supported: 0, unsupported: 8 }, probes: [
        { key: 'auth401', command: 'a', endpoint: '/a', supported: false, state: 'unsupported', statusCode: 401, message: 'auth' },
        { key: 'auth403', command: 'b', endpoint: '/b', supported: false, state: 'unsupported', statusCode: 403, message: 'auth' },
        { key: 'rate', command: 'c', endpoint: '/c', supported: false, state: 'unsupported', statusCode: 429, message: 'rate' },
        { key: 'contactFields', command: 'd', endpoint: '/d', supported: false, statusCode: 404, message: 'missing' },
        { key: 'groups', command: 'e', endpoint: '/e', supported: false, statusCode: 405, message: 'missing' },
        { key: 'petCategories', command: 'f', endpoint: '/f', supported: false, statusCode: 404, message: 'missing' },
        { key: 'other', command: 'g', endpoint: '/g', supported: false, statusCode: 404, message: 'missing' },
        { key: 'server', command: 'h', endpoint: '/h', supported: false, state: 'unsupported', statusCode: 500, message: 'server' },
      ],
    });
    expect(entries.map((entry) => entry.severity)).toEqual([
      'auth', 'auth', 'rate-limited', 'unsupported', 'unsupported', 'unsupported', 'unsupported', 'error',
    ]);
    expect(entries.find((entry) => entry.key === 'contactFields')?.fallbackCommands).toHaveLength(2);
    expect(entries.find((entry) => entry.key === 'groups')?.fallbackCommands).toHaveLength(4);
    expect(entries.find((entry) => entry.key === 'petCategories')?.fallbackCommands).toHaveLength(3);
  });

  it('builds unavailable entries without fallback commands', () => {
    const entries = getUnavailableCommands({
      generatedAt: '', summary: { total: 1, supported: 0, unsupported: 0 }, probes: [
        { key: 'server', command: 'server', endpoint: '/server', supported: null, state: 'unavailable', statusCode: 500, message: 'offline' },
      ],
    });
    expect(entries).toEqual([expect.objectContaining({
      severity: 'error', fallbackCommands: [], diagnostic: null,
    })]);
  });

  it('replaces generic retry advice with a typed server diagnosis', () => {
    const [entry] = getUnavailableCommands({
      generatedAt: '', summary: { total: 1, supported: 0, unsupported: 0 }, probes: [{
        key: 'contacts', command: 'contacts list', endpoint: '/contacts', supported: null,
        state: 'unavailable', statusCode: 500,
        message: 'Failed to load trust proxies from Cloudflare server.',
      }],
    });
    expect(entry.diagnostic).toMatchObject({
      code: 'monica_cloudflare_trust_proxy_fetch_failed', retryable: false,
    });
    expect(entry.recommendedAction).toContain('outbound HTTPS and DNS');
  });

  it('uses a request-failed hint when an unsupported probe has no status code', () => {
    expect(formatCapabilityHints({
      generatedAt: '', summary: { total: 1, supported: 0, unsupported: 1 }, probes: [{
        key: 'missing', command: 'missing list', endpoint: '/missing', supported: false,
        state: 'unsupported', statusCode: 0, message: 'failed',
      }],
    })).toEqual(['missing list: request failed (failed)']);
  });
});
