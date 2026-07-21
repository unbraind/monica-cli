import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createConversationsCommand, parseBoolean } from '../src/commands/conversations';
import { createPetsCommand } from '../src/commands/pets';
import { createTagsCommand, parseStringList } from '../src/commands/tags';

describe('CRUD resource command mappings D', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('maps conversation CRUD and every nested message action', async () => {
    vi.spyOn(api, 'listAllConversations').mockResolvedValue([]);
    vi.spyOn(api, 'createConversation').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'getConversation').mockResolvedValue({
      data: { id: 1, happened_at: '2026-01-01' },
    } as never);
    vi.spyOn(api, 'updateConversation').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'listConversationMessages').mockResolvedValue({ data: [], meta: {} } as never);
    vi.spyOn(api, 'createConversationMessage').mockResolvedValue({ data: { id: 2 } } as never);
    vi.spyOn(api, 'updateConversationMessage').mockResolvedValue({ data: { id: 2 } } as never);
    vi.spyOn(api, 'deleteConversationMessage').mockResolvedValue({ id: 2, deleted: true } as never);

    await createConversationsCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createConversationsCommand().parseAsync([
      'create', '--contact', '3', '--happened-at', '2026-02-01',
      '--contact-field-type', '4',
    ], { from: 'user' });
    await createConversationsCommand().parseAsync(['update', '1'], { from: 'user' });
    await createConversationsCommand().parseAsync(['--page', '2', 'messages', '1'], { from: 'user' });
    await createConversationsCommand().parseAsync([
      'add-message', '1', '--content', 'Hello', '--contact', '3',
      '--written-at', '2026-02-01', '--written-by-me', 'false',
    ], { from: 'user' });
    await createConversationsCommand().parseAsync([
      'update-message', '1', '2', '--content', 'Updated',
    ], { from: 'user' });
    await createConversationsCommand().parseAsync(['delete-message', '1', '2'], { from: 'user' });
    await createConversationsCommand().parseAsync([
      '--format', 'json', 'delete-message', '1', '2',
    ], { from: 'user' });

    expect(api.createConversation).toHaveBeenCalledWith({
      contact_id: 3, happened_at: '2026-02-01', contact_field_type_id: 4,
    });
    expect(api.updateConversation).toHaveBeenCalledWith(1, { happened_at: '2026-01-01' });
    expect(api.listConversationMessages).toHaveBeenCalledWith(1, { page: 2, limit: undefined });
    expect(api.createConversationMessage).toHaveBeenCalledWith(1, {
      content: 'Hello', contact_id: 3, written_at: '2026-02-01', written_by_me: false,
    });
    expect(api.updateConversationMessage).toHaveBeenCalledWith(1, 2, { content: 'Updated' });
    expect(api.deleteConversationMessage).toHaveBeenCalledTimes(2);
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('false')).toBe(false);
    expect(() => parseBoolean('yes')).toThrow('Invalid boolean');
  });

  it('maps tag CRUD and contact association actions', async () => {
    vi.spyOn(api, 'listAllTags').mockResolvedValue([]);
    vi.spyOn(api, 'createTag').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'getTag').mockResolvedValue({ data: { id: 1, name: 'Friends' } } as never);
    vi.spyOn(api, 'updateTag').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'setContactTags').mockResolvedValue({ data: { id: 3, tags: [] } } as never);
    vi.spyOn(api, 'unsetContactTag').mockResolvedValue({ data: { id: 3 } } as never);
    vi.spyOn(api, 'unsetAllContactTags').mockResolvedValue({ data: { id: 3 } } as never);
    vi.spyOn(api, 'listContactsByTag').mockResolvedValue({ data: [], meta: {} } as never);

    await createTagsCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createTagsCommand().parseAsync(['create', '--name', 'Friends'], { from: 'user' });
    await createTagsCommand().parseAsync(['update', '1', '--name', 'Family'], { from: 'user' });
    await createTagsCommand().parseAsync(['set', '3', '--tags', 'Friends, Family'], { from: 'user' });
    await createTagsCommand().parseAsync(['unset', '3', '--tag-ids', '1,2'], { from: 'user' });
    await createTagsCommand().parseAsync(['clear', '3'], { from: 'user' });
    await createTagsCommand().parseAsync(['--limit', '5', 'contacts', '1'], { from: 'user' });

    expect(api.createTag).toHaveBeenCalledWith({ name: 'Friends' });
    expect(api.setContactTags).toHaveBeenCalledWith(3, ['Friends', 'Family']);
    expect(api.unsetContactTag).toHaveBeenCalledWith(3, [1, 2]);
    expect(api.unsetAllContactTags).toHaveBeenCalledWith(3);
    expect(api.listContactsByTag).toHaveBeenCalledWith(1, { page: undefined, limit: 5 });
    expect(parseStringList('a, b')).toEqual(['a', 'b']);
    expect(() => parseStringList(' , ')).toThrow('at least one');
  });

  it('maps global and contact-scoped pet operations', async () => {
    vi.spyOn(api, 'listPets').mockResolvedValue({ data: [], meta: {} } as never);
    vi.spyOn(api, 'listContactPets').mockResolvedValue({ data: [], meta: {} } as never);
    vi.spyOn(api, 'listAllPets').mockResolvedValue([]);
    vi.spyOn(api, 'createPet').mockResolvedValue({ data: { id: 5 } } as never);
    vi.spyOn(api, 'getPet').mockResolvedValue({ data: { id: 5 } } as never);
    vi.spyOn(api, 'updatePet').mockResolvedValue({ data: { id: 5 } } as never);

    await createPetsCommand().parseAsync(['list'], { from: 'user' });
    await createPetsCommand().parseAsync(['list', '--contact-id', '3'], { from: 'user' });
    await createPetsCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createPetsCommand().parseAsync([
      'create', '--contact-id', '3', '--name', 'Mochi', '--category-id', '2',
    ], { from: 'user' });
    await createPetsCommand().parseAsync([
      'update', '5', '--name', 'Mochi II', '--category-id', '4',
    ], { from: 'user' });

    expect(api.listPets).toHaveBeenCalled();
    expect(api.listContactPets).toHaveBeenCalledWith(3, expect.any(Object));
    expect(api.listAllPets).toHaveBeenCalled();
    expect(api.createPet).toHaveBeenCalledWith({
      contact_id: 3, name: 'Mochi', pet_category_id: 2,
    });
    expect(api.updatePet).toHaveBeenCalledWith(5, {
      name: 'Mochi II', pet_category_id: 4,
    });
  });
});
