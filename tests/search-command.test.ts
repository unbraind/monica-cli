import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from '../src/api';
import * as formatters from '../src/formatters';
import { createSearchCommand } from '../src/commands/search';

describe('search command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let mockSearchContacts: ReturnType<typeof vi.spyOn>;
  let mockListAllActivities: ReturnType<typeof vi.spyOn>;
  let mockListAllNotes: ReturnType<typeof vi.spyOn>;
  let mockListAllTasks: ReturnType<typeof vi.spyOn>;
  let mockListAllReminders: ReturnType<typeof vi.spyOn>;
  let mockFormatOutput: ReturnType<typeof vi.spyOn>;
  let mockFormatError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null | undefined) => never);

    mockSearchContacts = vi.spyOn(api, 'searchContacts');
    mockListAllActivities = vi.spyOn(api, 'listAllActivities');
    mockListAllNotes = vi.spyOn(api, 'listAllNotes');
    mockListAllTasks = vi.spyOn(api, 'listAllTasks');
    mockListAllReminders = vi.spyOn(api, 'listAllReminders');
    mockFormatOutput = vi.spyOn(formatters, 'formatOutput');
    mockFormatError = vi.spyOn(formatters, 'formatError');
    mockFormatOutput.mockReturnValue('FORMATTED_OUTPUT');
    mockFormatError.mockReturnValue('FORMATTED_ERROR');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses server-side contact search and respects per-type limit', async () => {
    mockSearchContacts.mockResolvedValue({
      data: [
        { id: 1, first_name: 'John', last_name: 'Doe', description: 'Friend', gender: 'male' },
        { id: 2, first_name: 'Jane', last_name: 'Doe', description: 'Friend', gender: 'female' },
      ],
    });

    const cmd = createSearchCommand();
    await cmd.parseAsync(['john', '--type', 'contacts', '--limit', '1', '--format', 'json'], { from: 'user' });

    expect(mockSearchContacts).toHaveBeenCalledWith('john', { limit: 1 });
    expect(mockListAllActivities).not.toHaveBeenCalled();
    expect(mockListAllNotes).not.toHaveBeenCalled();
    expect(mockListAllTasks).not.toHaveBeenCalled();
    expect(mockListAllReminders).not.toHaveBeenCalled();

    const payloadArg = mockFormatOutput.mock.calls[0]?.[0] as { totalResults: number; results: Array<{ type: string }> };
    expect(payloadArg.totalResults).toBe(1);
    expect(payloadArg.results[0].type).toBe('contact');
  }, 15000);

  it('runs all resource searches and passes max-pages to non-contact resources', async () => {
    mockSearchContacts.mockResolvedValue({ data: [{ id: 1, first_name: 'John', last_name: 'Doe' }] });
    mockListAllActivities.mockResolvedValue([{ id: 2, summary: 'Met John', description: '', happened_at: '2026-03-01' }]);
    mockListAllNotes.mockResolvedValue([{ id: 3, body: 'john note', contact: { id: 1 } }]);
    mockListAllTasks.mockResolvedValue([{ id: 4, title: 'Call John', description: '', completed: false }]);
    mockListAllReminders.mockResolvedValue([{ id: 5, title: 'John reminder', description: '', next_expected_date: '2026-04-01' }]);

    const cmd = createSearchCommand();
    await cmd.parseAsync(['john', '--type', 'all', '--limit', '2', '--max-pages', '4'], { from: 'user' });

    expect(mockSearchContacts).toHaveBeenCalledWith('john', { limit: 2 });
    expect(mockListAllActivities).toHaveBeenCalledWith(4);
    expect(mockListAllNotes).toHaveBeenCalledWith(4);
    expect(mockListAllTasks).toHaveBeenCalledWith(undefined, 4);
    expect(mockListAllReminders).toHaveBeenCalledWith(4);
    expect(mockFormatOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'john',
        type: 'all',
        partial: false,
        failedTypes: [],
        errors: [],
      }),
      'toon'
    );
  });

  it('formats invalid search type errors', async () => {
    const cmd = createSearchCommand();
    await expect(
      cmd.parseAsync(['john', '--type', 'unknown'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(mockFormatError).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
  });

  it('supports yaml output format', async () => {
    mockSearchContacts.mockResolvedValue({
      data: [{ id: 1, first_name: 'John', last_name: 'Doe', description: 'Friend', gender: 'male' }],
    });

    const cmd = createSearchCommand();
    await cmd.parseAsync(['john', '--type', 'contacts', '--format', 'yaml'], { from: 'user' });

    expect(mockFormatOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'john',
        type: 'contacts',
        partial: false,
        failedTypes: [],
        errors: [],
      }),
      'yaml'
    );
  });

  it('supports yml output format alias', async () => {
    mockSearchContacts.mockResolvedValue({
      data: [{ id: 1, first_name: 'John', last_name: 'Doe', description: 'Friend', gender: 'male' }],
    });

    const cmd = createSearchCommand();
    await cmd.parseAsync(['john', '--type', 'contacts', '--format', 'yml'], { from: 'user' });

    expect(mockFormatOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'john',
        type: 'contacts',
        partial: false,
      }),
      'yaml'
    );
  });

  it('returns partial results in best-effort mode when one search type fails', async () => {
    mockSearchContacts.mockResolvedValue({ data: [{ id: 1, first_name: 'John', last_name: 'Doe' }] });
    mockListAllActivities.mockRejectedValue(new Error('HTTP 404'));
    mockListAllNotes.mockResolvedValue([{ id: 3, body: 'john note', contact: { id: 1 } }]);
    mockListAllTasks.mockResolvedValue([{ id: 4, title: 'Call John', description: '', completed: false }]);
    mockListAllReminders.mockResolvedValue([{ id: 5, title: 'John reminder', description: '', next_expected_date: '2026-04-01' }]);

    const cmd = createSearchCommand();
    await cmd.parseAsync(['john', '--type', 'all', '--format', 'json'], { from: 'user' });

    const payloadArg = mockFormatOutput.mock.calls[0]?.[0] as {
      partial: boolean;
      failedTypes: string[];
      errors: Array<{ type: string; message: string }>;
      totalResults: number;
    };
    expect(payloadArg.partial).toBe(true);
    expect(payloadArg.failedTypes).toContain('activities');
    expect(payloadArg.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'activities', message: 'HTTP 404' }),
      ])
    );
    expect(payloadArg.totalResults).toBeGreaterThan(0);
  });

  it('fails in strict mode when one search type fails', async () => {
    mockSearchContacts.mockResolvedValue({ data: [{ id: 1, first_name: 'John', last_name: 'Doe' }] });
    mockListAllActivities.mockRejectedValue(new Error('HTTP 404'));
    mockListAllNotes.mockResolvedValue([]);
    mockListAllTasks.mockResolvedValue([]);
    mockListAllReminders.mockResolvedValue([]);

    const cmd = createSearchCommand();
    await expect(
      cmd.parseAsync(['john', '--type', 'all', '--strict'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(mockFormatError).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('FORMATTED_ERROR');
  });
});
