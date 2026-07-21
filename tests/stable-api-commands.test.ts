import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import * as fmt from '../src/formatters';
import { createLifeEventsCommand } from '../src/commands/life-events';
import { createPlacesCommand } from '../src/commands/places';
import { createStatisticsCommand } from '../src/commands/statistics';
import { emptyPaginatedResponse } from './test-utils';

const PLACE = { id: 7, object: 'place', city: 'Vienna' };
const LIFE_EVENT = { id: 9, object: 'lifeevent', name: 'Conference' };

describe('stable Monica API commands', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as (code?: string | number | null | undefined) => never);
  });

  afterEach(() => vi.restoreAllMocks());

  describe('places', () => {
    it('lists one page and all pages with typed pagination options', async () => {
      const page = { ...emptyPaginatedResponse(), data: [PLACE] };
      vi.spyOn(api, 'listPlaces').mockResolvedValue(page as never);
      vi.spyOn(api, 'listAllPlaces').mockResolvedValue([PLACE] as never);

      await createPlacesCommand().parseAsync([
        '--format', 'json', '--page', '2', '--limit', '5', 'list', '--sort', 'city',
      ], { from: 'user' });
      await createPlacesCommand().parseAsync([
        '--format', 'json', 'list', '--all', '--sort', 'city',
      ], { from: 'user' });

      expect(api.listPlaces).toHaveBeenCalledWith({ page: 2, limit: 5, sort: 'city' });
      expect(api.listAllPlaces).toHaveBeenCalledWith({ sort: 'city' });
      expect(logSpy).toHaveBeenCalledTimes(2);
    });

    it('gets, creates, and updates source-backed place payloads', async () => {
      vi.spyOn(api, 'getPlace').mockResolvedValue({ data: PLACE } as never);
      vi.spyOn(api, 'createPlace').mockResolvedValue({ data: PLACE } as never);
      vi.spyOn(api, 'updatePlace').mockResolvedValue({ data: PLACE } as never);

      await createPlacesCommand().parseAsync(['--format', 'json', 'get', '7'], { from: 'user' });
      await createPlacesCommand().parseAsync([
        '--format', 'json', 'create', '--city', 'Vienna', '--country', 'AUT',
        '--latitude', '48.2', '--longitude', '16.37',
      ], { from: 'user' });
      await createPlacesCommand().parseAsync([
        '--format', 'json', 'update', '7', '--city', 'Graz', '--postal-code', '8010',
      ], { from: 'user' });

      expect(api.getPlace).toHaveBeenCalledWith(7);
      expect(api.createPlace).toHaveBeenCalledWith(expect.objectContaining({
        city: 'Vienna', country: 'AUT', latitude: 48.2, longitude: 16.37,
      }));
      expect(api.updatePlace).toHaveBeenCalledWith(7, expect.objectContaining({
        city: 'Graz', postal_code: '8010',
      }));
    });

    it('formats deletion for JSON and human output', async () => {
      vi.spyOn(api, 'deletePlace').mockResolvedValue({ deleted: true, id: 7 });
      await createPlacesCommand().parseAsync(['--format', 'json', 'delete', '7'], { from: 'user' });
      await createPlacesCommand().parseAsync(['--format', 'toon', 'delete', '7'], { from: 'user' });
      expect(logSpy).toHaveBeenNthCalledWith(1, '{"deleted":true,"id":7}');
      expect(logSpy.mock.calls[1]?.[0]).toContain('7');
    });

    it.each([
      ['list'], ['get', '7'], ['create', '--city', 'Vienna'],
      ['update', '7', '--city', 'Graz'], ['delete', '7'],
    ])('formats API errors for %s', async (...args) => {
      vi.spyOn(api, 'listPlaces').mockRejectedValue(new Error('boom'));
      vi.spyOn(api, 'getPlace').mockRejectedValue(new Error('boom'));
      vi.spyOn(api, 'createPlace').mockRejectedValue(new Error('boom'));
      vi.spyOn(api, 'updatePlace').mockRejectedValue(new Error('boom'));
      vi.spyOn(api, 'deletePlace').mockRejectedValue(new Error('boom'));
      await expect(createPlacesCommand().parseAsync(args, { from: 'user' })).rejects.toThrow('process.exit');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('life-events', () => {
    it('lists one page and all pages', async () => {
      vi.spyOn(api, 'listLifeEvents').mockResolvedValue({
        ...emptyPaginatedResponse(), data: [LIFE_EVENT],
      } as never);
      vi.spyOn(api, 'listAllLifeEvents').mockResolvedValue([LIFE_EVENT] as never);

      await createLifeEventsCommand().parseAsync([
        '--format', 'yaml', '--page', '2', '--limit', '5', 'list', '--sort', 'happened_at',
      ], { from: 'user' });
      await createLifeEventsCommand().parseAsync([
        '--format', 'json', 'list', '--all', '--sort', 'happened_at',
      ], { from: 'user' });

      expect(api.listLifeEvents).toHaveBeenCalledWith({ page: 2, limit: 5, sort: 'happened_at' });
      expect(api.listAllLifeEvents).toHaveBeenCalledWith({ sort: 'happened_at' });
    });

    it('gets, creates, and updates source-backed life events', async () => {
      vi.spyOn(api, 'getLifeEvent').mockResolvedValue({ data: LIFE_EVENT } as never);
      vi.spyOn(api, 'createLifeEvent').mockResolvedValue({ data: LIFE_EVENT } as never);
      vi.spyOn(api, 'updateLifeEvent').mockResolvedValue({ data: LIFE_EVENT } as never);

      await createLifeEventsCommand().parseAsync(['get', '9'], { from: 'user' });
      await createLifeEventsCommand().parseAsync([
        'create', '--contact', '2', '--type-id', '3', '--date', '2026-07-21',
        '--name', 'Conference', '--note', 'Vienna', '--reminder', '--month-unknown', '--day-unknown',
      ], { from: 'user' });
      await createLifeEventsCommand().parseAsync([
        'update', '9', '--type-id', '3', '--date', '2026-07-22', '--name', 'Updated',
      ], { from: 'user' });

      expect(api.getLifeEvent).toHaveBeenCalledWith(9);
      expect(api.createLifeEvent).toHaveBeenCalledWith({
        contact_id: 2,
        life_event_type_id: 3,
        happened_at: '2026-07-21',
        name: 'Conference',
        note: 'Vienna',
        has_reminder: true,
        happened_at_month_unknown: true,
        happened_at_day_unknown: true,
      });
      expect(api.updateLifeEvent).toHaveBeenCalledWith(9, expect.objectContaining({
        life_event_type_id: 3, happened_at: '2026-07-22', name: 'Updated',
      }));
    });

    it('formats deletion for JSON and human output', async () => {
      vi.spyOn(api, 'deleteLifeEvent').mockResolvedValue({ deleted: true, id: 9 });
      await createLifeEventsCommand().parseAsync(['--format', 'json', 'delete', '9'], { from: 'user' });
      await createLifeEventsCommand().parseAsync(['delete', '9'], { from: 'user' });
      expect(logSpy).toHaveBeenNthCalledWith(1, '{"deleted":true,"id":9}');
      expect(logSpy.mock.calls[1]?.[0]).toContain('9');
    });

    it.each([
      ['list'], ['get', '9'],
      ['create', '--contact', '2', '--type-id', '3', '--date', '2026-07-21'],
      ['update', '9', '--type-id', '3', '--date', '2026-07-22'], ['delete', '9'],
    ])('formats API errors for %s', async (...args) => {
      vi.spyOn(api, 'listLifeEvents').mockRejectedValue(new Error('boom'));
      vi.spyOn(api, 'getLifeEvent').mockRejectedValue(new Error('boom'));
      vi.spyOn(api, 'createLifeEvent').mockRejectedValue(new Error('boom'));
      vi.spyOn(api, 'updateLifeEvent').mockRejectedValue(new Error('boom'));
      vi.spyOn(api, 'deleteLifeEvent').mockRejectedValue(new Error('boom'));
      await expect(createLifeEventsCommand().parseAsync(args, { from: 'user' })).rejects.toThrow('process.exit');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  it('renders public statistics and formats failures', async () => {
    const statisticsSpy = vi.spyOn(api, 'getInstanceStatistics').mockResolvedValue([{
      instance_creation_date: '2020-01-01',
      number_of_contacts: 4,
      number_of_users: 1,
      number_of_activities: 2,
      number_of_reminders: 3,
      number_of_new_users_last_week: 0,
    }]);
    await createStatisticsCommand().parseAsync(['--format', 'json', 'get'], { from: 'user' });
    expect(logSpy.mock.calls[0]?.[0]).toContain('number_of_contacts');

    statisticsSpy.mockRejectedValueOnce(new Error('boom'));
    await expect(createStatisticsCommand().parseAsync(['get'], { from: 'user' })).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith(fmt.formatError(new Error('boom')));
  });
});
