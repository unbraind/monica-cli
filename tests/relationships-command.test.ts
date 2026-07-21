import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createRelationshipsCommand } from '../src/commands/relationships';

describe('relationships command', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(api, 'listRelationships').mockResolvedValue({ data: [], meta: {} } as never);
    vi.spyOn(api, 'getRelationship').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'createRelationship').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'updateRelationship').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'deleteRelationship').mockResolvedValue({ id: 1, deleted: true } as never);
    vi.spyOn(api, 'listRelationshipTypes').mockResolvedValue({ data: [] });
    vi.spyOn(api, 'getRelationshipType').mockResolvedValue({ data: { id: 2 } } as never);
    vi.spyOn(api, 'listRelationshipTypeGroups').mockResolvedValue({ data: [] });
    vi.spyOn(api, 'getRelationshipTypeGroup').mockResolvedValue({ data: { id: 3 } } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  it('executes relationship CRUD with strict mappings', async () => {
    await createRelationshipsCommand().parseAsync(['--page', '2', 'list', '4'], { from: 'user' });
    await createRelationshipsCommand().parseAsync(['get', '1'], { from: 'user' });
    await createRelationshipsCommand().parseAsync([
      'create', '--contact', '4', '--related-contact', '5', '--type', '6',
    ], { from: 'user' });
    await createRelationshipsCommand().parseAsync(['update', '1', '--type', '7'], { from: 'user' });
    await createRelationshipsCommand().parseAsync(['delete', '1'], { from: 'user' });
    await createRelationshipsCommand().parseAsync(['--format', 'json', 'delete', '1'], { from: 'user' });
    expect(api.listRelationships).toHaveBeenCalledWith(4, { page: 2, limit: undefined });
    expect(api.createRelationship).toHaveBeenCalledWith({
      contact_id: 4, related_contact_id: 5, relationship_type_id: 6,
    });
    expect(api.updateRelationship).toHaveBeenCalledWith(1, { relationship_type_id: 7 });
    expect(api.deleteRelationship).toHaveBeenCalledTimes(2);
  });

  it('lists and gets relationship metadata', async () => {
    await createRelationshipsCommand().parseAsync(['types'], { from: 'user' });
    await createRelationshipsCommand().parseAsync(['type', '2'], { from: 'user' });
    await createRelationshipsCommand().parseAsync(['groups'], { from: 'user' });
    await createRelationshipsCommand().parseAsync(['group', '3'], { from: 'user' });
    expect(api.listRelationshipTypes).toHaveBeenCalled();
    expect(api.getRelationshipType).toHaveBeenCalledWith(2);
    expect(api.listRelationshipTypeGroups).toHaveBeenCalled();
    expect(api.getRelationshipTypeGroup).toHaveBeenCalledWith(3);
  });
});
