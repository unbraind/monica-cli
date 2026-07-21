import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { createAuditLogsCommand } from '../src/commands/audit-logs';
import { createCountriesCommand } from '../src/commands/countries';
import { createCurrenciesCommand } from '../src/commands/currencies';
import { createDocumentsCommand } from '../src/commands/documents';
import { createInfoCommand } from '../src/commands/info';
import { createPhotosCommand } from '../src/commands/photos';
import * as capabilityCache from '../src/utils/capability-cache';

describe('read-only reference commands', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('lists countries and reads currencies', async () => {
    vi.spyOn(api, 'listCountries').mockResolvedValue({ data: { AUT: { id: 1 } } } as never);
    vi.spyOn(api, 'listCurrencies').mockResolvedValue({ data: [], meta: {} } as never);
    vi.spyOn(api, 'getCurrency').mockResolvedValue({ data: { id: 2 } } as never);
    await createCountriesCommand().parseAsync(['list'], { from: 'user' });
    await createCurrenciesCommand().parseAsync(['--page', '2', 'list'], { from: 'user' });
    await createCurrenciesCommand().parseAsync(['get', '2'], { from: 'user' });
    expect(api.listCountries).toHaveBeenCalled();
    expect(api.listCurrencies).toHaveBeenCalledWith({ page: 2, limit: undefined });
    expect(api.getCurrency).toHaveBeenCalledWith(2);
  });

  it('lists audit logs with pagination', async () => {
    vi.spyOn(api, 'listAuditLogs').mockResolvedValue({ data: [], meta: {} } as never);
    await createAuditLogsCommand().parseAsync(['--limit', '5', 'list'], { from: 'user' });
    expect(api.listAuditLogs).toHaveBeenCalledWith({ page: undefined, limit: 5 });
  });

  it('executes every compact info lookup', async () => {
    vi.spyOn(capabilityCache, 'loadCachedCapabilityReport').mockReturnValue(null);
    const lookups = [
      ['me', 'getUser'], ['genders', 'listGenders'], ['countries', 'listCountries'],
      ['currencies', 'listCurrencies'], ['activity-types', 'listActivityTypes'],
      ['relationship-types', 'listRelationshipTypes'],
    ] as const;
    for (const [commandName, apiName] of lookups) {
      vi.spyOn(api, apiName).mockResolvedValue({ data: [] } as never);
      await createInfoCommand().parseAsync([commandName], { from: 'user' });
      expect(api[apiName]).toHaveBeenCalled();
    }
    vi.spyOn(api, 'listContactFieldTypes').mockResolvedValue({ data: [], meta: {} } as never);
    await createInfoCommand().parseAsync([
      'contact-field-types', '--page', '2', '--limit', '5',
    ], { from: 'user' });
    expect(api.listContactFieldTypes).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });

  it('executes document and photo wrapper list-all callbacks', async () => {
    vi.spyOn(api, 'listAllDocuments').mockResolvedValue([]);
    vi.spyOn(api, 'listAllPhotos').mockResolvedValue([]);
    await createDocumentsCommand().parseAsync(['list', '--all'], { from: 'user' });
    await createPhotosCommand().parseAsync(['list', '--all'], { from: 'user' });
    expect(api.listAllDocuments).toHaveBeenCalled();
    expect(api.listAllPhotos).toHaveBeenCalled();
  });
});
