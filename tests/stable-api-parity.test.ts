import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn(), getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as places from '../src/api/places';
import * as lifeEvents from '../src/api/life-events';
import * as statistics from '../src/api/statistics';
import * as reminders from '../src/api/reminders';
import * as reference from '../src/api/reference';
import { createProgram } from '../src/program';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('Monica stable 4.x API parity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps place CRUD and pagination routes', async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ data: { id: 1 } });
    mockPut.mockResolvedValue({ data: { id: 1 } });
    mockDel.mockResolvedValue({ deleted: true, id: 1 });
    mockGetAllPages.mockResolvedValue([]);
    await places.listPlaces({ limit: 2 }); await places.getPlace(1);
    await places.listAllPlaces({ sort: 'created_at' }, 2);
    await places.createPlace({ city: 'Vienna' }); await places.updatePlace(1, { city: 'Graz' }); await places.deletePlace(1);
    expect(client.get).toHaveBeenNthCalledWith(1, '/places', { limit: 2 });
    expect(client.get).toHaveBeenNthCalledWith(2, '/places/1');
    expect(client.post).toHaveBeenCalledWith('/places', { city: 'Vienna' });
    expect(client.put).toHaveBeenCalledWith('/places/1', { city: 'Graz' });
    expect(client.del).toHaveBeenCalledWith('/places/1');
    expect(client.getAllPages).toHaveBeenCalledWith('/places', { sort: 'created_at' }, 2);
  });

  it('maps life-event CRUD routes', async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ data: { id: 2 } });
    mockPut.mockResolvedValue({ data: { id: 2 } });
    mockDel.mockResolvedValue({ deleted: true, id: 2 });
    mockGetAllPages.mockResolvedValue([]);
    const createInput = { contact_id: 1, life_event_type_id: 2, happened_at: '2026-01-01', has_reminder: false, happened_at_month_unknown: false, happened_at_day_unknown: false };
    await lifeEvents.listLifeEvents(); await lifeEvents.getLifeEvent(2); await lifeEvents.createLifeEvent(createInput);
    await lifeEvents.listAllLifeEvents({ sort: 'happened_at' }, 3);
    await lifeEvents.updateLifeEvent(2, { life_event_type_id: 2, happened_at: '2026-01-02' }); await lifeEvents.deleteLifeEvent(2);
    expect(client.get).toHaveBeenNthCalledWith(1, '/lifeevents', undefined);
    expect(client.get).toHaveBeenNthCalledWith(2, '/lifeevents/2');
    expect(client.post).toHaveBeenCalledWith('/lifeevents', createInput);
    expect(client.put).toHaveBeenCalledWith('/lifeevents/2', { life_event_type_id: 2, happened_at: '2026-01-02' });
    expect(client.getAllPages).toHaveBeenCalledWith('/lifeevents', { sort: 'happened_at' }, 3);
  });

  it('maps statistics, upcoming reminders, and me-contact routes', async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue(['true']);
    mockDel.mockResolvedValue(['true']);
    await statistics.getInstanceStatistics(); await reminders.listUpcomingReminders(1);
    await reference.setMeContact(9); await reference.unsetMeContact();
    expect(client.get).toHaveBeenNthCalledWith(1, '/statistics');
    expect(client.get).toHaveBeenNthCalledWith(2, '/reminders/upcoming/1');
    expect(client.post).toHaveBeenCalledWith('/me/contact', { contact_id: 9 });
    expect(client.del).toHaveBeenCalledWith('/me/contact');
  });

  it('registers every new command with discoverable help', () => {
    const program = createProgram(['node', 'monica']);
    for (const name of ['places', 'life-events', 'statistics']) {
      const command = program.commands.find((candidate) => candidate.name() === name);
      expect(command?.description()).toBeTruthy();
      expect(command?.helpInformation()).toContain('Output format (toon|json|yaml|table|md)');
    }
    expect(program.commands.find((command) => command.name() === 'reminders')?.commands.some((command) => command.name() === 'upcoming')).toBe(true);
  });
});
