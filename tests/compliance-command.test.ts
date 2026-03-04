import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createComplianceCommand } from '../src/commands/compliance';

describe('compliance command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null | undefined) => never);
    vi.spyOn(fmt, 'resolveOutputFormat').mockImplementation((f) => (f as 'toon' | 'json' | 'table') || 'toon');
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED_OUTPUT');
    vi.spyOn(fmt, 'formatPaginatedResponse').mockReturnValue('FORMATTED_PAGINATED');
    vi.spyOn(fmt, 'formatSuccess').mockReturnValue('FORMATTED_SUCCESS');
    vi.spyOn(fmt, 'formatError').mockReturnValue('FORMATTED_ERROR');
  });

  it('lists compliance terms', async () => {
    vi.spyOn(api, 'listCompliance').mockResolvedValue({
      data: [{ id: 1, name: 'Terms' }],
      links: { first: '', last: '', prev: null, next: null },
      meta: { current_page: 1, from: 1, last_page: 1, path: '', per_page: 10, to: 1, total: 1 },
    });

    const cmd = createComplianceCommand();
    await cmd.parseAsync(['list', '--format', 'json'], { from: 'user' });

    expect(api.listCompliance).toHaveBeenCalledWith({ page: undefined, limit: undefined });
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_PAGINATED');
  });

  it('gets compliance status list when no term id is provided', async () => {
    const statusSpy = vi.spyOn(api, 'getUserComplianceStatus');
    const statusForTermSpy = vi.spyOn(api, 'getUserComplianceStatusForTerm');

    statusSpy.mockResolvedValue({
      data: [{ id: 1, has_signed: true }],
    } as never);

    const cmd = createComplianceCommand();
    await cmd.parseAsync(['status'], { from: 'user' });

    expect(statusSpy).toHaveBeenCalledOnce();
    expect(statusForTermSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_OUTPUT');
  });

  it('gets compliance status for a specific term id', async () => {
    vi.spyOn(api, 'getUserComplianceStatusForTerm').mockResolvedValue({
      data: { id: 10, has_signed: true },
    } as never);

    const cmd = createComplianceCommand();
    await cmd.parseAsync(['status', '10'], { from: 'user' });

    expect(api.getUserComplianceStatusForTerm).toHaveBeenCalledWith(10);
    expect(logSpy).toHaveBeenCalledWith('FORMATTED_OUTPUT');
  });

  it('handles sign errors via formatter and exits', async () => {
    vi.spyOn(api, 'signCompliance').mockRejectedValue(new Error('Read-only mode enabled'));

    const cmd = createComplianceCommand();
    await expect(
      cmd.parseAsync(['sign', '--ip-address', '127.0.0.1'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(fmt.formatError).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
