import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createRelationshipsCommand } from '../src/commands/relationships';

describe('relationships command actions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED');
    vi.spyOn(fmt, 'formatError').mockReturnValue('FORMATTED_ERROR');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists relationship types via API', async () => {
    const listSpy = vi.spyOn(api, 'listRelationshipTypes').mockResolvedValue({ data: [] } as never);
    const cmd = createRelationshipsCommand();

    await cmd.parseAsync(['--format', 'json', 'types'], { from: 'user' });

    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it('gets a relationship type by id', async () => {
    const getSpy = vi.spyOn(api, 'getRelationshipType').mockResolvedValue({ data: { id: 7 } } as never);
    const cmd = createRelationshipsCommand();

    await cmd.parseAsync(['--format', 'json', 'type', '7'], { from: 'user' });

    expect(getSpy).toHaveBeenCalledWith(7);
  });

  it('gets a relationship type group by id', async () => {
    const getSpy = vi.spyOn(api, 'getRelationshipTypeGroup').mockResolvedValue({ data: { id: 3 } } as never);
    const cmd = createRelationshipsCommand();

    await cmd.parseAsync(['--format', 'json', 'group', '3'], { from: 'user' });

    expect(getSpy).toHaveBeenCalledWith(3);
  });
});
