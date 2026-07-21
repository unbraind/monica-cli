import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createActivitiesCommand, parseResourceIds } from '../src/commands/activities';
import { createGiftsCommand, parseGiftStatus } from '../src/commands/gifts';
import { createJournalCommand } from '../src/commands/journal';
import {
  createRemindersCommand,
  parseMonthOffset,
  parseReminderFrequency,
} from '../src/commands/reminders';

describe('CRUD resource command mappings C', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('maps activity fields and attendee fallbacks', async () => {
    vi.spyOn(api, 'listAllActivities').mockResolvedValue([]);
    vi.spyOn(api, 'createActivity').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'getActivity').mockResolvedValue({
      data: {
        id: 1, activity_type: null, summary: 'Old', description: null,
        happened_at: '2026-01-01', attendees: { contacts: [{ id: 3 }] },
      },
    } as never);
    vi.spyOn(api, 'updateActivity').mockResolvedValue({ data: { id: 1 } } as never);

    await createActivitiesCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createActivitiesCommand().parseAsync([
      'create', '--type', '2', '--summary', 'Lunch', '--date', '2026-01-02',
      '--contacts', '3, 4', '--description', 'Cafe',
    ], { from: 'user' });
    await createActivitiesCommand().parseAsync(['update', '1'], { from: 'user' });

    expect(api.createActivity).toHaveBeenCalledWith({
      activity_type_id: 2, summary: 'Lunch', happened_at: '2026-01-02',
      contacts: [3, 4], description: 'Cafe',
    });
    expect(api.updateActivity).toHaveBeenCalledWith(1, {
      activity_type_id: 1, summary: 'Old', description: undefined,
      happened_at: '2026-01-01', contacts: [3],
    });
    expect(parseResourceIds('1, 2')).toEqual([1, 2]);
    expect(() => parseResourceIds('1,x')).toThrow('positive integer');
  });

  it('maps journal create and update values', async () => {
    vi.spyOn(api, 'listAllJournalEntries').mockResolvedValue([]);
    vi.spyOn(api, 'createJournalEntry').mockResolvedValue({ data: { id: 2 } } as never);
    vi.spyOn(api, 'getJournalEntry').mockResolvedValue({
      data: { id: 2, post: 'Old post', title: 'Old title' },
    } as never);
    vi.spyOn(api, 'updateJournalEntry').mockResolvedValue({ data: { id: 2 } } as never);

    await createJournalCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createJournalCommand().parseAsync([
      'create', '--post', 'New post', '--title', 'New title',
    ], { from: 'user' });
    await createJournalCommand().parseAsync(['update', '2'], { from: 'user' });

    expect(api.createJournalEntry).toHaveBeenCalledWith({ post: 'New post', title: 'New title' });
    expect(api.updateJournalEntry).toHaveBeenCalledWith(2, { post: 'Old post', title: 'Old title' });
  });

  it('maps gift fields, update fallbacks, photo association, and status validation', async () => {
    vi.spyOn(api, 'listAllGifts').mockResolvedValue([]);
    vi.spyOn(api, 'createGift').mockResolvedValue({ data: { id: 3 } } as never);
    vi.spyOn(api, 'getGift').mockResolvedValue({
      data: {
        id: 3, contact: { id: 4 }, name: 'Book', status: 'idea', comment: null,
        url: null, amount: '12.50', date: null,
      },
    } as never);
    vi.spyOn(api, 'updateGift').mockResolvedValue({ data: { id: 3 } } as never);
    vi.spyOn(api, 'associateGiftPhoto').mockResolvedValue({ data: { id: 3 } } as never);

    await createGiftsCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createGiftsCommand().parseAsync([
      'create', '--contact', '4', '--recipient', '5', '--name', 'Book', '--status', 'offered',
      '--comment', 'Signed', '--url', 'https://example.test', '--amount', '12.5',
      '--date', '2026-01-03',
    ], { from: 'user' });
    await createGiftsCommand().parseAsync(['update', '3'], { from: 'user' });
    vi.mocked(api.getGift).mockResolvedValueOnce({
      data: { id: 3, contact: null, name: 'Coin', status: 'idea', amount: null },
    } as never);
    await createGiftsCommand().parseAsync(['update', '3'], { from: 'user' });
    await createGiftsCommand().parseAsync(['associate-photo', '3', '--photo', '6'], { from: 'user' });

    expect(api.createGift).toHaveBeenCalledWith({
      contact_id: 4, recipient_id: 5, name: 'Book', status: 'offered', comment: 'Signed',
      url: 'https://example.test', amount: 12.5, date: '2026-01-03',
    });
    expect(api.updateGift).toHaveBeenCalledWith(3, {
      contact_id: 4, name: 'Book', status: 'idea', comment: undefined,
      url: undefined, amount: 12.5, date: undefined,
    });
    expect(api.updateGift).toHaveBeenLastCalledWith(3, expect.objectContaining({
      contact_id: 0, amount: undefined,
    }));
    expect(api.associateGiftPhoto).toHaveBeenCalledWith(3, 6);
    expect(parseGiftStatus('received')).toBe('received');
    expect(() => parseGiftStatus('lost')).toThrow('Invalid gift status');
  });

  it('maps reminder fields, upcoming offsets, and strict frequency validation', async () => {
    vi.spyOn(api, 'listAllReminders').mockResolvedValue([]);
    vi.spyOn(api, 'createReminder').mockResolvedValue({ data: { id: 7 } } as never);
    vi.spyOn(api, 'getReminder').mockResolvedValue({
      data: {
        id: 7, title: 'Birthday', description: null, contact: { id: 4 },
        next_expected_date: '2026-04-05T00:00:00Z', frequency_type: 'year',
        frequency_number: null,
      },
    } as never);
    vi.spyOn(api, 'updateReminder').mockResolvedValue({ data: { id: 7 } } as never);
    vi.spyOn(api, 'listUpcomingReminders').mockResolvedValue({ data: [] });

    await createRemindersCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createRemindersCommand().parseAsync([
      'create', '--title', 'Call', '--contact', '4', '--date', '2026-01-04',
      '--frequency', 'month', '--description', 'Check in', '--interval', '2',
    ], { from: 'user' });
    await createRemindersCommand().parseAsync(['update', '7'], { from: 'user' });
    vi.mocked(api.getReminder).mockResolvedValueOnce({
      data: {
        id: 7, title: 'Current', contact: null, initial_date: '2026-05-06T00:00:00Z',
        frequency_type: 'month',
      },
    } as never);
    await createRemindersCommand().parseAsync(['update', '7'], { from: 'user' });
    vi.mocked(api.getReminder).mockResolvedValueOnce({
      data: { id: 7, title: 'No date', contact: null, frequency_type: 'one_time' },
    } as never);
    await createRemindersCommand().parseAsync(['update', '7'], { from: 'user' });
    await createRemindersCommand().parseAsync(['upcoming'], { from: 'user' });
    await createRemindersCommand().parseAsync(['upcoming', '2'], { from: 'user' });

    expect(api.createReminder).toHaveBeenCalledWith({
      title: 'Call', contact_id: 4, initial_date: '2026-01-04', frequency_type: 'month',
      description: 'Check in', frequency_number: 2,
    });
    expect(api.updateReminder).toHaveBeenCalledWith(7, {
      title: 'Birthday', description: undefined, contact_id: 4, initial_date: '2026-04-05',
      frequency_type: 'year', frequency_number: undefined,
    });
    expect(api.updateReminder).toHaveBeenNthCalledWith(2, 7, expect.objectContaining({
      contact_id: 0, initial_date: '2026-05-06',
    }));
    expect(api.updateReminder).toHaveBeenNthCalledWith(3, 7, expect.objectContaining({
      initial_date: '',
    }));
    expect(api.listUpcomingReminders).toHaveBeenNthCalledWith(1, 0);
    expect(api.listUpcomingReminders).toHaveBeenNthCalledWith(2, 2);
    expect(parseReminderFrequency('one_time')).toBe('one_time');
    expect(() => parseReminderFrequency('daily')).toThrow('Invalid reminder frequency');
    expect(parseMonthOffset('0')).toBe(0);
    expect(() => parseMonthOffset('-1')).toThrow('non-negative integer');
    expect(() => parseMonthOffset('9'.repeat(100))).toThrow('non-negative integer');
  });
});
