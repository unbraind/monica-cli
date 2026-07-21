import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createContactsCommand } from '../src/commands/contacts';

describe('contacts command CRUD and reads', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('maps paginated, all-page, and expanded contact reads', async () => {
    vi.spyOn(api, 'listContacts').mockResolvedValue({ data: [], meta: {} } as never);
    vi.spyOn(api, 'listAllContacts').mockResolvedValue([]);
    vi.spyOn(api, 'getContact').mockResolvedValue({ data: { id: 1 } } as never);
    await createContactsCommand().parseAsync([
      '--page', '2', '--limit', '5', 'list', '--query', 'Alex', '--sort', 'updated_at',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'list', '--all', '--query', 'Sam', '--sort', 'created_at',
    ], { from: 'user' });
    await createContactsCommand().parseAsync(['get', '1', '--with-fields'], { from: 'user' });
    expect(api.listContacts).toHaveBeenCalledWith({
      page: 2, limit: 5, query: 'Alex', sort: 'updated_at',
    });
    expect(api.listAllContacts).toHaveBeenCalledWith({ sort: 'created_at', query: 'Sam' });
    expect(api.getContact).toHaveBeenCalledWith(1, 'contactfields');
  });

  it('maps contact create and explicit-gender update fields', async () => {
    vi.spyOn(api, 'createContact').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'getContact').mockResolvedValue({
      data: {
        id: 1, first_name: 'Old', last_name: null, nickname: null,
        gender: 'Unknown', is_dead: false, is_partial: true,
      },
    } as never);
    vi.spyOn(api, 'updateContact').mockResolvedValue({ data: { id: 1 } } as never);
    await createContactsCommand().parseAsync([
      'create', '--first-name', 'Alex', '--last-name', 'Doe', '--nickname', 'A',
      '--gender-id', '2', '--is-deceased', '--is-partial',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'update', '1', '--first-name', 'New', '--last-name', 'Name', '--nickname', 'N',
      '--gender-id', '3',
    ], { from: 'user' });
    expect(api.createContact).toHaveBeenCalledWith({
      first_name: 'Alex', last_name: 'Doe', nickname: 'A', gender_id: 2,
      is_birthdate_known: false, is_deceased: true, is_deceased_date_known: false,
      is_partial: true,
    });
    expect(api.updateContact).toHaveBeenCalledWith(1, {
      first_name: 'New', last_name: 'Name', nickname: 'N', gender_id: 3,
      is_birthdate_known: false, is_deceased: false, is_deceased_date_known: false,
      is_partial: true,
    });
  });

  it('searches contacts and reads contact audit logs', async () => {
    vi.spyOn(api, 'searchContacts').mockResolvedValue({ data: [], meta: {} } as never);
    vi.spyOn(api, 'getContactLogs').mockResolvedValue({ data: [], meta: {} } as never);
    await createContactsCommand().parseAsync(['--limit', '4', 'search', 'Alex'], { from: 'user' });
    await createContactsCommand().parseAsync(['--page', '2', 'logs', '1'], { from: 'user' });
    expect(api.searchContacts).toHaveBeenCalledWith('Alex', { page: undefined, limit: 4 });
    expect(api.getContactLogs).toHaveBeenCalledWith(1, { page: 2, limit: undefined });
  });

  it('executes every contact-scoped related list', async () => {
    const names = [
      'getContactFields', 'getContactActivities', 'getContactNotes', 'getContactTasks',
      'getContactReminders', 'listContactAddresses', 'listContactCalls',
      'listContactConversations', 'listContactDocuments', 'listContactGifts', 'listContactPhotos',
    ] as const;
    const commands = [
      'fields', 'activities', 'notes', 'tasks', 'reminders', 'addresses', 'calls',
      'conversations', 'documents', 'gifts', 'photos',
    ];
    for (const apiName of names) {
      vi.spyOn(api, apiName).mockResolvedValue({ data: [], meta: {} } as never);
    }
    for (const commandName of commands) {
      await createContactsCommand().parseAsync([
        '--page', '2', '--limit', '5', commandName, '1',
      ], { from: 'user' });
    }
    for (const apiName of names) {
      expect(api[apiName]).toHaveBeenCalledWith(1, { page: 2, limit: 5 });
    }
  });
});
