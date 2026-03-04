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

  describe('User', () => {
    it('getUser calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { id: 1, first_name: 'Test' } });
      await getUser();
      expect(mockGet).toHaveBeenCalledWith('/me');
    });
  });

  describe('Genders', () => {
    it('listGenders calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [], meta: {} });
      await listGenders();
      expect(mockGet).toHaveBeenCalledWith('/genders');
    });

    it('getGender calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { id: 1 } });
      await getGender(1);
      expect(mockGet).toHaveBeenCalledWith('/genders/1');
    });

    it('createGender calls correct endpoint', async () => {
      mockPost.mockResolvedValue({ data: { id: 1 } });
      await createGender({ name: 'Test' });
      expect(mockPost).toHaveBeenCalledWith('/genders', { name: 'Test' });
    });

    it('updateGender calls correct endpoint', async () => {
      mockPut.mockResolvedValue({ data: { id: 1 } });
      await updateGender(1, { name: 'Updated' });
      expect(mockPut).toHaveBeenCalledWith('/genders/1', { name: 'Updated' });
    });

    it('deleteGender calls correct endpoint', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      await deleteGender(1);
      expect(mockDel).toHaveBeenCalledWith('/genders/1');
    });
  });

  describe('Countries', () => {
    it('listCountries calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: {} });
      await listCountries();
      expect(mockGet).toHaveBeenCalledWith('/countries');
    });
  });

  describe('Currencies', () => {
    it('listCurrencies calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [], meta: {} });
      await listCurrencies();
      expect(mockGet).toHaveBeenCalledWith('/currencies', undefined);
    });

    it('getCurrency calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { id: 1 } });
      await getCurrency(1);
      expect(mockGet).toHaveBeenCalledWith('/currencies/1');
    });
  });

  describe('Activity Types', () => {
    it('listActivityTypes calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [], meta: {} });
      await listActivityTypes();
      expect(mockGet).toHaveBeenCalledWith('/activitytypes', undefined);
    });

    it('getActivityType calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { id: 1 } });
      await getActivityType(1);
      expect(mockGet).toHaveBeenCalledWith('/activitytypes/1');
    });

    it('createActivityType calls correct endpoint', async () => {
      mockPost.mockResolvedValue({ data: { id: 1 } });
      await createActivityType({ name: 'Test', activity_type_category_id: 1 });
      expect(mockPost).toHaveBeenCalledWith('/activitytypes', { name: 'Test', activity_type_category_id: 1 });
    });

    it('updateActivityType calls correct endpoint', async () => {
      mockPut.mockResolvedValue({ data: { id: 1 } });
      await updateActivityType(1, { name: 'Updated', activity_type_category_id: 1 });
      expect(mockPut).toHaveBeenCalledWith('/activitytypes/1', { name: 'Updated', activity_type_category_id: 1 });
    });

    it('deleteActivityType calls correct endpoint', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      await deleteActivityType(1);
      expect(mockDel).toHaveBeenCalledWith('/activitytypes/1');
    });
  });

  describe('Activity Type Categories', () => {
    it('listActivityTypeCategories calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [], meta: {} });
      await listActivityTypeCategories();
      expect(mockGet).toHaveBeenCalledWith('/activitytypecategories', undefined);
    });

    it('getActivityTypeCategory calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { id: 1 } });
      await getActivityTypeCategory(1);
      expect(mockGet).toHaveBeenCalledWith('/activitytypecategories/1');
    });

    it('createActivityTypeCategory calls correct endpoint', async () => {
      mockPost.mockResolvedValue({ data: { id: 1 } });
      await createActivityTypeCategory({ name: 'Test' });
      expect(mockPost).toHaveBeenCalledWith('/activitytypecategories', { name: 'Test' });
    });

    it('updateActivityTypeCategory calls correct endpoint', async () => {
      mockPut.mockResolvedValue({ data: { id: 1 } });
      await updateActivityTypeCategory(1, { name: 'Updated' });
      expect(mockPut).toHaveBeenCalledWith('/activitytypecategories/1', { name: 'Updated' });
    });

    it('deleteActivityTypeCategory calls correct endpoint', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      await deleteActivityTypeCategory(1);
      expect(mockDel).toHaveBeenCalledWith('/activitytypecategories/1');
    });
  });

  describe('Contact Field Types', () => {
    it('listContactFieldTypes calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [], meta: {} });
      await listContactFieldTypes();
      expect(mockGet).toHaveBeenCalledWith('/contactfieldtypes', undefined);
    });

    it('getContactFieldType calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { id: 1 } });
      await getContactFieldType(1);
      expect(mockGet).toHaveBeenCalledWith('/contactfieldtypes/1');
    });

    it('createContactFieldType calls correct endpoint', async () => {
      mockPost.mockResolvedValue({ data: { id: 1 } });
      await createContactFieldType({ name: 'Test' });
      expect(mockPost).toHaveBeenCalledWith('/contactfieldtypes', { name: 'Test' });
    });

    it('updateContactFieldType calls correct endpoint', async () => {
      mockPut.mockResolvedValue({ data: { id: 1 } });
      await updateContactFieldType(1, { name: 'Updated' });
      expect(mockPut).toHaveBeenCalledWith('/contactfieldtypes/1', { name: 'Updated' });
    });

    it('deleteContactFieldType calls correct endpoint', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      await deleteContactFieldType(1);
      expect(mockDel).toHaveBeenCalledWith('/contactfieldtypes/1');
    });
  });

  describe('Contact Fields', () => {
    it('listContactFields calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [], meta: {} });
      await listContactFields(1);
      expect(mockGet).toHaveBeenCalledWith('/contacts/1/contactfields', undefined);
    });

    it('listAllContactFields calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: [], meta: {} });
      await listAllContactFields();
      expect(mockGet).toHaveBeenCalledWith('/contactfields', undefined);
    });

    it('getContactField calls correct endpoint', async () => {
      mockGet.mockResolvedValue({ data: { id: 1 } });
      await getContactField(1);
      expect(mockGet).toHaveBeenCalledWith('/contactfields/1');
    });

    it('createContactField calls correct endpoint', async () => {
      mockPost.mockResolvedValue({ data: { id: 1 } });
      await createContactField({ contact_id: 1, contact_field_type_id: 1, content: 'test@test.com' });
      expect(mockPost).toHaveBeenCalledWith('/contactfields', { contact_id: 1, contact_field_type_id: 1, content: 'test@test.com' });
    });

    it('updateContactField calls correct endpoint', async () => {
      mockPut.mockResolvedValue({ data: { id: 1 } });
      await updateContactField(1, { contact_id: 1, contact_field_type_id: 1, content: 'updated@test.com' });
      expect(mockPut).toHaveBeenCalledWith('/contactfields/1', { contact_id: 1, contact_field_type_id: 1, content: 'updated@test.com' });
    });

    it('deleteContactField calls correct endpoint', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      await deleteContactField(1);
      expect(mockDel).toHaveBeenCalledWith('/contactfields/1');
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
