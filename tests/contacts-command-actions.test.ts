import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createContactsCommand } from '../src/commands/contacts';

describe('contacts command actions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(fmt, 'formatOutput').mockReturnValue('FORMATTED');
    vi.spyOn(fmt, 'formatPaginatedResponse').mockReturnValue('FORMATTED_PAGINATED');
    vi.spyOn(fmt, 'formatSuccess').mockReturnValue('SUCCESS');
    vi.spyOn(fmt, 'formatError').mockReturnValue('FORMATTED_ERROR');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('infers gender id by gender_type when updating without --gender-id', async () => {
    vi.spyOn(api, 'getContact').mockResolvedValue({
      data: {
        id: 1,
        first_name: 'Current',
        last_name: null,
        nickname: null,
        gender: 'Male',
        gender_type: 'M',
        is_dead: false,
        is_partial: false,
      },
    } as never);
    vi.spyOn(api, 'listGenders').mockResolvedValue({
      data: [
        { id: 2, name: 'Male', type: 'M' },
        { id: 3, name: 'Female', type: 'F' },
      ],
    } as never);
    const updateSpy = vi.spyOn(api, 'updateContact').mockResolvedValue({ data: { id: 1 } } as never);

    const cmd = createContactsCommand();
    await cmd.parseAsync(['--format', 'json', 'update', '1', '--first-name', 'Updated'], { from: 'user' });

    expect(updateSpy).toHaveBeenCalledWith(1, expect.objectContaining({
      first_name: 'Updated',
      gender_id: 2,
    }));
  });

  it('fails update when gender cannot be inferred and --gender-id is missing', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null | undefined) => never);

    vi.spyOn(api, 'getContact').mockResolvedValue({
      data: {
        id: 1,
        first_name: 'Current',
        last_name: null,
        nickname: null,
        gender: 'Unknown',
        gender_type: 'X',
        is_dead: false,
        is_partial: false,
      },
    } as never);
    vi.spyOn(api, 'listGenders').mockResolvedValue({ data: [] } as never);

    const cmd = createContactsCommand();
    await expect(
      cmd.parseAsync(['--format', 'json', 'update', '1', '--first-name', 'Updated'], { from: 'user' })
    ).rejects.toThrow('process.exit');

    expect(exitSpy).toHaveBeenCalled();
  });

});
