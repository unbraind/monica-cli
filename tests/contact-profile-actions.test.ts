import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import {
  parseContactAvatarSource,
} from '../src/commands/contact-profile-actions';
import { createContactsCommand } from '../src/commands/contacts';

describe('contact profile action commands', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('maps date, deceased, stay-in-touch, and first-met profiles', async () => {
    vi.spyOn(api, 'updateContactBirthdate').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'updateContactDeceasedDate').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'updateContactStayInTouch').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'updateContactFirstMet').mockResolvedValue({ data: { id: 1 } } as never);
    await createContactsCommand().parseAsync([
      'birthdate', '1', '--date', '1990-01-02', '--age-based', '--year-unknown',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'deceased', '1', '--date', '2020-01-02', '--add-reminder',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'stay-in-touch', '1', '--frequency', '30', '--trigger-date', '2026-01-02',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'first-met', '1', '--date', '2020-02-03', '--contact', '2', '--info', 'Conference',
    ], { from: 'user' });
    expect(api.updateContactBirthdate).toHaveBeenCalledWith(1, {
      birthdate_date: '1990-01-02', birthdate_is_age_based: true,
      birthdate_is_year_unknown: true,
    });
    expect(api.updateContactDeceasedDate).toHaveBeenCalledWith(1, {
      is_deceased: true, is_deceased_date_known: true,
      deceased_date_date: '2020-01-02', is_deceased_add_reminder: true,
    });
    expect(api.updateContactStayInTouch).toHaveBeenCalledWith(1, {
      stay_in_touch_frequency: 30, stay_in_touch_trigger_date: '2026-01-02',
    });
    expect(api.updateContactFirstMet).toHaveBeenCalledWith(1, {
      first_met_date: '2020-02-03', first_met_through_contact_id: 2,
      first_met_general_information: 'Conference',
    });
  });

  it('maps introduction, food, avatars, and career profiles', async () => {
    vi.spyOn(api, 'updateContactIntroduction').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'updateContactFoodPreferences').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'setContactAvatar').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'updateContactAvatar').mockResolvedValue({ data: { id: 1 } } as never);
    vi.spyOn(api, 'updateContactCareer').mockResolvedValue({ data: { id: 1 } } as never);
    await createContactsCommand().parseAsync([
      'introduction', '1', '--met-through', '2', '--info', 'Meetup', '--where', 'Vienna',
      '--date-known', '--age-based', '--day', '1', '--month', '2', '--year', '2020',
      '--age', '6', '--add-reminder',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'food-preferences', '1', '--preferences', 'Vegetarian',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'set-avatar', '1', '--url', 'https://example.test/avatar.jpg',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'avatar', '1', '--source', 'photo', '--photo-id', '3',
    ], { from: 'user' });
    await createContactsCommand().parseAsync([
      'career', '1', '--job', 'Engineer', '--company', 'Acme',
    ], { from: 'user' });
    expect(api.updateContactIntroduction).toHaveBeenCalledWith(1, {
      met_through_contact_id: 2, general_information: 'Meetup', where: 'Vienna',
      is_date_known: true, is_age_based: true, day: 1, month: 2, year: 2020, age: 6,
      add_reminder: true,
    });
    expect(api.updateContactFoodPreferences).toHaveBeenCalledWith(1, {
      food_preferences: 'Vegetarian',
    });
    expect(api.setContactAvatar).toHaveBeenCalledWith(1, 'https://example.test/avatar.jpg');
    expect(api.updateContactAvatar).toHaveBeenCalledWith(1, 'photo', 3);
    expect(api.updateContactCareer).toHaveBeenCalledWith(1, { job: 'Engineer', company: 'Acme' });
  });

  it('deletes avatars in both output modes and validates sources', async () => {
    vi.spyOn(api, 'deleteContactAvatar').mockResolvedValue({ id: 1, deleted: true } as never);
    await createContactsCommand().parseAsync(['delete-avatar', '1'], { from: 'user' });
    await createContactsCommand().parseAsync([
      '--format', 'json', 'delete-avatar', '1',
    ], { from: 'user' });
    expect(api.deleteContactAvatar).toHaveBeenCalledTimes(2);
    expect(parseContactAvatarSource('gravatar')).toBe('gravatar');
    expect(() => parseContactAvatarSource('remote')).toThrow('Invalid avatar source');
  });
});
