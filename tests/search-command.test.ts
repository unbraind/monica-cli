import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from '../src/api';
import * as formatters from '../src/formatters';
import { createSearchCommand } from '../src/commands/search';
import { Command } from 'commander';

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

  it('renders absent optional contact text fields safely', async () => {
    mockSearchContacts.mockResolvedValue({ data: [{ id: 1, first_name: null, last_name: null }] as never });
    await createSearchCommand().parseAsync(['john', '--type', 'contacts'], { from: 'user' });
    const payload = mockFormatOutput.mock.calls[0]?.[0] as { results: unknown[] };
    expect(payload.results).toEqual([
      { type: 'contact', id: 1, title: 'Unnamed', subtitle: undefined },
    ]);
  });

  it('normalizes sparse and alternate result shapes for every resource type', async () => {
    mockListAllActivities.mockResolvedValue([
      { id: 1, summary: '', description: 'john description', happened_at: '2026-01-01' },
      { id: 2, summary: '', description: '', happened_at: '2026-01-02' },
    ]);
    await createSearchCommand().parseAsync(['john', '--type', 'activities'], { from: 'user' });
    expect((mockFormatOutput.mock.calls.at(-1)?.[0] as { results: Array<{ title: string }> }).results[0].title)
      .toBe('Untitled');

    mockListAllNotes.mockResolvedValue([
      { id: 3, body: `john ${'x'.repeat(60)}`, contact: undefined },
      { id: 4, body: undefined, contact: undefined },
    ] as never);
    await createSearchCommand().parseAsync(['john', '--type', 'notes'], { from: 'user' });
    expect((mockFormatOutput.mock.calls.at(-1)?.[0] as { results: Array<{ title: string }> }).results[0].title)
      .toContain('...');

    mockListAllTasks.mockResolvedValue([
      { id: 5, title: '', description: 'john task', completed: true },
      { id: 6, title: '', description: '', completed: false },
    ]);
    await createSearchCommand().parseAsync(['john', '--type', 'tasks'], { from: 'user' });
    expect((mockFormatOutput.mock.calls.at(-1)?.[0] as { results: Array<{ title: string; subtitle: string }> }).results[0])
      .toMatchObject({ title: 'Untitled', subtitle: 'Completed' });

    mockListAllReminders.mockResolvedValue([
      { id: 7, title: '', description: 'john initial', initial_date: '2026-01-01' },
      { id: 8, title: '', description: 'john next', next_expected_date: '2026-02-01' },
      { id: 9, title: '', description: 'john unknown' },
    ] as never);
    await createSearchCommand().parseAsync(['john', '--type', 'reminders'], { from: 'user' });
    const reminders = (mockFormatOutput.mock.calls.at(-1)?.[0] as {
      results: Array<{ title: string; subtitle: string }>;
    }).results;
    expect(reminders.map((item) => item.subtitle)).toEqual([
      'Next: 2026-01-01', 'Next: 2026-02-01', 'Next: unknown',
    ]);
  });

  it('normalizes non-Error search failures in best-effort mode', async () => {
    mockListAllActivities.mockRejectedValue(null);
    await createSearchCommand().parseAsync(['john', '--type', 'activities'], { from: 'user' });
    expect(mockFormatOutput).toHaveBeenLastCalledWith(expect.objectContaining({
      partial: true, errors: [{ type: 'activities', message: 'Unknown error' }],
    }), 'toon');
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

  it('emits raw result arrays from an inherited global flag', async () => {
    mockSearchContacts.mockResolvedValue({ data: [{ id: 1, first_name: 'John' }] });
    const root = new Command('monica').option('--raw');
    root.addCommand(createSearchCommand());
    await root.parseAsync(['--raw', 'search', 'john'], { from: 'user' });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"type": "contact"'));
    expect(mockFormatOutput).not.toHaveBeenCalled();
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
