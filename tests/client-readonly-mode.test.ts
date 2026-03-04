import { describe, expect, it } from 'vitest';
import { resolveReadOnlyMode } from '../src/api/client';

describe('client read-only mode resolver', () => {
  it('maps legacy readOnly settings through normalized readOnlyMode', () => {
    const resolved = resolveReadOnlyMode(undefined, { readOnlyMode: true });
    expect(resolved).toBe(true);
  });

  it('prefers MONICA_READ_ONLY env override when set', () => {
    const resolvedFalse = resolveReadOnlyMode('false', { readOnlyMode: true });
    const resolvedTrue = resolveReadOnlyMode('1', { readOnlyMode: false });
    expect(resolvedFalse).toBe(false);
    expect(resolvedTrue).toBe(true);
  });
});
