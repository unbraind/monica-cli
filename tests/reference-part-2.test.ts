import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  setConfig: vi.fn(),
  getConfig: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
  MonicaApiError: class MonicaApiError extends Error {
    errorCode: number;
    statusCode: number;
    constructor(message: string, errorCode: number, statusCode: number) {
      super(message);
      this.errorCode = errorCode;
      this.statusCode = statusCode;
    }
  },
}));

import * as client from '../src/api/client';

const mockSetConfig = client.setConfig as ReturnType<typeof vi.fn>;
const mockGetConfig = client.getConfig as ReturnType<typeof vi.fn>;
const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;
import {
  getUser,
  listGenders,
  getGender,
  createGender,
  updateGender,
  deleteGender,
  listCountries,
  listCurrencies,
  getCurrency,
  listActivityTypes,
  getActivityType,
  createActivityType,
  updateActivityType,
  deleteActivityType,
  listActivityTypeCategories,
  getActivityTypeCategory,
  createActivityTypeCategory,
  updateActivityTypeCategory,
  deleteActivityTypeCategory,
  listContactFieldTypes,
  getContactFieldType,
  createContactFieldType,
  updateContactFieldType,
  deleteContactFieldType,
  listContactFields,
  listAllContactFields,
  getContactField,
  createContactField,
  updateContactField,
  deleteContactField,
  listCompliance,
  getCompliance,
  getUserComplianceStatus,
  getUserComplianceStatusForTerm,
  signCompliance,
} from '../src/api/reference';

describe('reference API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetConfig({
      apiUrl: 'http://test.local/api',
      apiKey: 'test-key',
    });
  });

  describe('Compliance', () => {
    it('listCompliance calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [], meta: {} });
      await listCompliance();
      expect(mockGet).toHaveBeenCalledWith('/compliance', undefined);
    });

    it('getCompliance calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { id: 1 } });
      await getCompliance(1);
      expect(mockGet).toHaveBeenCalledWith('/compliance/1');
    });

    it('getUserComplianceStatus calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await getUserComplianceStatus();
      expect(mockGet).toHaveBeenCalledWith('/me/compliance');
    });

    it('getUserComplianceStatusForTerm calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { signed: true } });
      await getUserComplianceStatusForTerm(1);
      expect(mockGet).toHaveBeenCalledWith('/me/compliance/1');
    });

    it('signCompliance calls correct endpoint', async () => {
      mockPost.mockResolvedValue({ data: { signed: true } });
      await signCompliance({ ip_address: '127.0.0.1' });
      expect(mockPost).toHaveBeenCalledWith('/me/compliance', { ip_address: '127.0.0.1' });
    });
  });
});
