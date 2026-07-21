import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createActivityTypeCategoriesCommand } from '../src/commands/activity-type-categories';
import { createActivityTypesCommand } from '../src/commands/activity-types';
import { createContactFieldTypesCommand } from '../src/commands/contact-field-types';
import {
  createDebtsCommand,
  parseDebtDirection,
  parseDebtStatus,
} from '../src/commands/debts';
import { createGendersCommand } from '../src/commands/genders';
import { parseFiniteNumber } from '../src/commands/global-options';
import { createOccupationsCommand } from '../src/commands/occupations';
import { createTasksCommand } from '../src/commands/tasks';

describe('CRUD resource command mappings B', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('maps and validates debt fields', async () => {
    vi.spyOn(api, 'listAllDebts').mockResolvedValue([]);
    vi.spyOn(api, 'createDebt').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'getDebt').mockResolvedValue({
      data: {
        id: 1, contact: { id: 2 }, in_debt: 'no', amount: 3, status: 'inprogress', reason: null,
      },
    } as never);
    vi.spyOn(api, 'updateDebt').mockResolvedValue({ data: { id: 1 } } as never);

    await createDebtsCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createDebtsCommand().parseAsync([
      'create', '--contact', '2', '--in-debt', 'yes', '--amount', '12.5',
      '--status', 'complete', '--reason', 'Dinner',
    ], { from: 'user' });
    await createDebtsCommand().parseAsync(['update', '1'], { from: 'user' });
    vi.mocked(api.getDebt).mockResolvedValueOnce({
      data: { id: 1, contact: null, in_debt: 'no', amount: 3, status: 'inprogress' },
    } as never);
    await createDebtsCommand().parseAsync(['update', '1'], { from: 'user' });

    expect(api.createDebt).toHaveBeenCalledWith({
      contact_id: 2, in_debt: 'yes', amount: 12.5, status: 'complete', reason: 'Dinner',
    });
    expect(api.updateDebt).toHaveBeenCalledWith(1, {
      contact_id: 2, in_debt: 'no', amount: 3, status: 'inprogress', reason: undefined,
    });
    expect(api.updateDebt).toHaveBeenLastCalledWith(1, expect.objectContaining({ contact_id: 0 }));

    expect(parseDebtDirection('yes')).toBe('yes');
    expect(parseDebtDirection('no')).toBe('no');
    expect(() => parseDebtDirection('maybe')).toThrow('Invalid debt direction');
    expect(parseDebtStatus('inprogress')).toBe('inprogress');
    expect(parseDebtStatus('complete')).toBe('complete');
    expect(() => parseDebtStatus('open')).toThrow('Invalid debt status');
  });

  it('maps occupation fields and preserves omitted values', async () => {
    vi.spyOn(api, 'listAllOccupations').mockResolvedValue([]);
    vi.spyOn(api, 'createOccupation').mockResolvedValue({ data: { id: 3 } } as never);
    vi.spyOn(api, 'getOccupation').mockResolvedValue({
      data: {
        id: 3, contact: { id: 2 }, company: null, job: 'Engineer', active: true,
        start_date: null, end_date: null,
      },
    } as never);
    vi.spyOn(api, 'updateOccupation').mockResolvedValue({ data: { id: 3 } } as never);

    await createOccupationsCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createOccupationsCommand().parseAsync([
      'create', '--contact', '2', '--company', 'Acme', '--job', 'Lead', '--active',
      '--start-date', '2026-01-01', '--end-date', '2026-12-31',
    ], { from: 'user' });
    await createOccupationsCommand().parseAsync(['update', '3'], { from: 'user' });
    vi.mocked(api.getOccupation).mockResolvedValueOnce({
      data: { id: 3, contact: null, company: null, job: null, active: false },
    } as never);
    await createOccupationsCommand().parseAsync(['update', '3'], { from: 'user' });

    expect(api.createOccupation).toHaveBeenCalledWith({
      contact_id: 2, company: 'Acme', job: 'Lead', active: true,
      start_date: '2026-01-01', end_date: '2026-12-31',
    });
    expect(api.updateOccupation).toHaveBeenCalledWith(3, {
      contact_id: 2, company: undefined, job: 'Engineer', active: true,
      start_date: undefined, end_date: undefined,
    });
    expect(api.updateOccupation).toHaveBeenLastCalledWith(3, {
      contact_id: 0, company: undefined, job: undefined, active: false,
      start_date: undefined, end_date: undefined,
    });
  });

  it('maps small reference CRUD families', async () => {
    vi.spyOn(api, 'createGender').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'createActivityTypeCategory').mockResolvedValue({ data: { id: 2 } } as never);
    vi.spyOn(api, 'createActivityType').mockResolvedValue({ data: { id: 3 } } as never);
    vi.spyOn(api, 'createContactFieldType').mockResolvedValue({ data: { id: 4 } } as never);
    vi.spyOn(api, 'getGender').mockResolvedValue({ data: { id: 1, name: 'Old' } } as never);
    vi.spyOn(api, 'updateGender').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'getActivityTypeCategory').mockResolvedValue({ data: { id: 2, name: 'Old' } } as never);
    vi.spyOn(api, 'updateActivityTypeCategory').mockResolvedValue({ data: { id: 2 } } as never);
    vi.spyOn(api, 'getActivityType').mockResolvedValue({ data: { id: 3 } } as never);
    vi.spyOn(api, 'updateActivityType').mockResolvedValue({ data: { id: 3 } } as never);
    vi.spyOn(api, 'getContactFieldType').mockResolvedValue({ data: { id: 4 } } as never);
    vi.spyOn(api, 'updateContactFieldType').mockResolvedValue({ data: { id: 4 } } as never);

    await createGendersCommand().parseAsync(['create', '--name', 'Nonbinary'], { from: 'user' });
    await createActivityTypeCategoriesCommand().parseAsync(['create', '--name', 'Sports'], { from: 'user' });
    await createActivityTypesCommand().parseAsync([
      'create', '--name', 'Running', '--category-id', '2',
    ], { from: 'user' });
    await createGendersCommand().parseAsync(['update', '1', '--name', 'Updated'], { from: 'user' });
    await createActivityTypeCategoriesCommand().parseAsync([
      'update', '2', '--name', 'Updated',
    ], { from: 'user' });
    await createActivityTypesCommand().parseAsync([
      'update', '3', '--name', 'Cycling', '--category-id', '2',
    ], { from: 'user' });
    await createContactFieldTypesCommand().parseAsync([
      'create', '--name', 'Signal', '--icon', 'fa-signal', '--protocol', 'signal:',
      '--delible', '--type', 'messaging',
    ], { from: 'user' });
    await createContactFieldTypesCommand().parseAsync([
      'update', '4', '--name', 'Phone',
    ], { from: 'user' });
    await createContactFieldTypesCommand().parseAsync([
      'create', '--name', 'Plain',
    ], { from: 'user' });
    await createContactFieldTypesCommand().parseAsync([
      'update', '4', '--name', 'Signal', '--delible',
    ], { from: 'user' });

    expect(api.createGender).toHaveBeenCalledWith({ name: 'Nonbinary' });
    expect(api.createActivityTypeCategory).toHaveBeenCalledWith({ name: 'Sports' });
    expect(api.createActivityType).toHaveBeenCalledWith({
      name: 'Running', activity_type_category_id: 2,
    });
    expect(api.updateGender).toHaveBeenCalledWith(1, { name: 'Updated' });
    expect(api.updateActivityTypeCategory).toHaveBeenCalledWith(2, { name: 'Updated' });
    expect(api.updateActivityType).toHaveBeenCalledWith(3, {
      name: 'Cycling', activity_type_category_id: 2,
    });
    expect(api.createContactFieldType).toHaveBeenCalledWith({
      name: 'Signal', fontawesome_icon: 'fa-signal', protocol: 'signal:', delible: 1,
      type: 'messaging',
    });
    expect(api.updateContactFieldType).toHaveBeenCalledWith(4, {
      name: 'Phone', fontawesome_icon: undefined, protocol: undefined, delible: 0, type: undefined,
    });
    expect(api.createContactFieldType).toHaveBeenLastCalledWith(expect.objectContaining({ delible: 0 }));
    expect(api.updateContactFieldType).toHaveBeenLastCalledWith(4, expect.objectContaining({ delible: 1 }));
  });

  it('maps task sorting, completion flags, and dedicated completion', async () => {
    vi.spyOn(api, 'listAllTasks').mockResolvedValue([]);
    vi.spyOn(api, 'createTask').mockResolvedValue({ data: { id: 5 } } as never);
    vi.spyOn(api, 'getTask').mockResolvedValue({
      data: { id: 5, title: 'Old', description: null, completed: false, contact: { id: 2 } },
    } as never);
    vi.spyOn(api, 'updateTask').mockResolvedValue({ data: { id: 5 } } as never);

    await createTasksCommand().parseAsync(['list', '--all', '--sort', 'completed_at'], { from: 'user' });
    await createTasksCommand().parseAsync([
      'create', '--title', 'Call', '--contact', '2', '--description', 'Today', '--completed',
    ], { from: 'user' });
    await createTasksCommand().parseAsync(['update', '5', '--completed'], { from: 'user' });
    await createTasksCommand().parseAsync(['update', '5', '--not-completed'], { from: 'user' });
    await createTasksCommand().parseAsync(['update', '5'], { from: 'user' });
    await createTasksCommand().parseAsync(['complete', '5'], { from: 'user' });
    vi.mocked(api.getTask).mockResolvedValueOnce({
      data: { id: 5, title: 'Done', completed: true, contact: null },
    } as never);
    await createTasksCommand().parseAsync([
      'update', '5', '--title', 'Changed', '--description', 'Details',
    ], { from: 'user' });
    await createTasksCommand().parseAsync(['create', '--title', 'Open', '--contact', '2'], { from: 'user' });
    vi.mocked(api.getTask).mockResolvedValueOnce({
      data: { id: 5, title: 'No contact', completed: false, contact: null },
    } as never);
    await createTasksCommand().parseAsync(['complete', '5'], { from: 'user' });

    expect(api.listAllTasks).toHaveBeenCalledWith({ sort: 'completed_at' });
    expect(api.createTask).toHaveBeenCalledWith({
      title: 'Call', description: 'Today', contact_id: 2, completed: 1,
    });
    expect(api.updateTask).toHaveBeenNthCalledWith(1, 5, {
      title: 'Old', description: undefined, contact_id: 2, completed: 1,
    });
    expect(api.updateTask).toHaveBeenNthCalledWith(2, 5, {
      title: 'Old', description: undefined, contact_id: 2, completed: 0,
    });
    expect(api.updateTask).toHaveBeenNthCalledWith(3, 5, {
      title: 'Old', description: undefined, contact_id: 2, completed: 0,
    });
    expect(api.updateTask).toHaveBeenNthCalledWith(4, 5, {
      title: 'Old', description: undefined, contact_id: 2, completed: 1,
    });
    expect(api.updateTask).toHaveBeenNthCalledWith(5, 5, {
      title: 'Changed', description: 'Details', contact_id: 0, completed: 1,
    });
    expect(api.createTask).toHaveBeenLastCalledWith(expect.objectContaining({ completed: 0 }));
    expect(api.updateTask).toHaveBeenLastCalledWith(5, expect.objectContaining({ contact_id: 0 }));
  });

  it('strictly parses finite numeric values', () => {
    expect(parseFiniteNumber('-1.25')).toBe(-1.25);
    expect(() => parseFiniteNumber('')).toThrow('finite numeric value');
    expect(() => parseFiniteNumber('12px')).toThrow('finite numeric value');
  });
});
