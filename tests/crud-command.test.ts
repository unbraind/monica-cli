import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Command } from 'commander';
import { createCrudCommand } from '../src/commands/crud-command';
import { emptyPaginatedResponse } from './test-utils';

interface ExampleResource {
  id: number;
  name: string;
}

interface ExampleInput {
  name: string;
}

const RESOURCE = { id: 7, name: 'Example' };

describe('typed CRUD command kernel', () => {
  const listPage = vi.fn();
  const listAll = vi.fn();
  const get = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const remove = vi.fn();
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  function command(configureList?: (command: Command) => Command) {
    return createCrudCommand<ExampleResource, ExampleInput, ExampleInput>({
      name: 'examples',
      description: 'Manage examples',
      singular: 'example',
      label: 'Example',
      fields: ['id', 'name'],
      listPage,
      listAll,
      get,
      create,
      update,
      remove,
      configureList,
      configureCreate: (candidate) => candidate.requiredOption('--name <name>', 'Name'),
      configureUpdate: (candidate) => candidate.option('--name <name>', 'Name'),
      buildCreateInput: (options) => ({ name: options.name as string }),
      buildUpdateInput: (options, current) => ({
        name: (options.name as string | undefined) ?? current.name,
      }),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null | undefined) => never);
    listPage.mockResolvedValue({ ...emptyPaginatedResponse(), data: [RESOURCE] });
    listAll.mockResolvedValue([RESOURCE]);
    get.mockResolvedValue({ data: RESOURCE });
    create.mockResolvedValue({ data: RESOURCE });
    update.mockResolvedValue({ data: RESOURCE });
    remove.mockResolvedValue({ deleted: true, id: 7 });
  });

  afterEach(() => vi.restoreAllMocks());

  it('lists a typed page with inherited pagination and custom list options', async () => {
    const cli = command((candidate) => candidate.option('--sort <field>', 'Sort field'));
    await cli.parseAsync([
      '--format', 'json', '--page', '2', '--limit', '5', 'list', '--sort', 'name',
    ], { from: 'user' });
    expect(listPage).toHaveBeenCalledWith(
      { page: 2, limit: 5, sort: 'name' },
      { sort: 'name' },
    );
    expect(logSpy.mock.calls[0]?.[0]).toContain('Example');
  });

  it('lists all resources through the default list configuration', async () => {
    await command().parseAsync(['--format', 'yaml', 'list', '--all'], { from: 'user' });
    expect(listAll).toHaveBeenCalledWith({ sort: undefined });
    expect(listPage).not.toHaveBeenCalled();
    expect(logSpy.mock.calls[0]?.[0]).toContain('name: Example');
  });

  it('gets, creates, and updates typed resources', async () => {
    await command().parseAsync(['--format', 'json', 'get', '7'], { from: 'user' });
    await command().parseAsync(['--format', 'json', 'create', '--name', 'Created'], { from: 'user' });
    await command().parseAsync(['--format', 'json', 'update', '7', '--name', 'Updated'], { from: 'user' });
    await command().parseAsync(['--format', 'json', 'update', '7'], { from: 'user' });

    expect(get).toHaveBeenCalledWith(7);
    expect(create).toHaveBeenCalledWith({ name: 'Created' });
    expect(update).toHaveBeenNthCalledWith(1, 7, { name: 'Updated' });
    expect(update).toHaveBeenNthCalledWith(2, 7, { name: 'Example' });
    expect(logSpy.mock.calls.flat().join('\n')).toContain('Example created');
    expect(logSpy.mock.calls.flat().join('\n')).toContain('Example updated');
  });

  it('formats delete responses for JSON and human output', async () => {
    await command().parseAsync(['--format', 'json', 'delete', '7'], { from: 'user' });
    await command().parseAsync(['--format', 'toon', 'delete', '7'], { from: 'user' });
    expect(logSpy).toHaveBeenNthCalledWith(1, '{"deleted":true,"id":7}');
    expect(logSpy.mock.calls[1]?.[0]).toContain('7');
  });

  it.each([
    ['list'], ['get', '7'], ['create', '--name', 'Created'],
    ['update', '7', '--name', 'Updated'], ['delete', '7'],
  ])('formats errors and exits for %s', async (...args) => {
    listPage.mockRejectedValue(new Error('boom'));
    get.mockRejectedValue(new Error('boom'));
    create.mockRejectedValue(new Error('boom'));
    remove.mockRejectedValue(new Error('boom'));
    await expect(command().parseAsync(args, { from: 'user' })).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalled();
  });
});
