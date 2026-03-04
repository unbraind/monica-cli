import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as contacts from '../src/api/contacts';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listContacts', () => {
    it('calls GET /contacts with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await contacts.listContacts({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/contacts', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getContact', () => {
    it('calls GET /contacts/:id', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockGet.mockResolvedValue({ data: mockContact });
      
      const result = await contacts.getContact(1);
      
      expect(mockGet).toHaveBeenCalledWith('/contacts/1', undefined);
      expect(result.data).toEqual(mockContact);
    });

    it('calls GET /contacts/:id with contactfields', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockGet.mockResolvedValue({ data: mockContact });
      
      await contacts.getContact(1, 'contactfields');
      
      expect(mockGet).toHaveBeenCalledWith('/contacts/1', { with: 'contactfields' });
    });
  });

  describe('createContact', () => {
    it('calls POST /contacts with data', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockPost.mockResolvedValue({ data: mockContact });
      
      const input = {
        first_name: 'Test',
        gender_id: 1,
        is_birthdate_known: false,
        is_deceased: false,
        is_deceased_date_known: false,
      };
      const result = await contacts.createContact(input);
      
      expect(mockPost).toHaveBeenCalledWith('/contacts', input);
      expect(result.data).toEqual(mockContact);
    });
  });

  describe('deleteContact', () => {
    it('calls DELETE /contacts/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await contacts.deleteContact(1);
      
      expect(mockDel).toHaveBeenCalledWith('/contacts/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('searchContacts', () => {
    it('calls GET /contacts with query', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      await contacts.searchContacts('test');
      
      expect(mockGet).toHaveBeenCalledWith('/contacts', { query: 'test', limit: undefined, page: undefined });
    });
  });

  describe('updateContactBirthdate', () => {
    it('calls PUT /contacts/:id/birthdate', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockPut.mockResolvedValue({ data: mockContact });
      
      const result = await contacts.updateContactBirthdate(1, {
        birthdate_date: '1990-01-15',
      });
      
      expect(mockPut).toHaveBeenCalledWith('/contacts/1/birthdate', {
        birthdate_date: '1990-01-15',
      });
      expect(result.data).toEqual(mockContact);
    });
  });

  describe('updateContactDeceasedDate', () => {
    it('calls PUT /contacts/:id/deceasedDate', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockPut.mockResolvedValue({ data: mockContact });
      
      const result = await contacts.updateContactDeceasedDate(1, {
        is_deceased: true,
        is_deceased_date_known: true,
        deceased_date_date: '2023-01-15',
      });
      
      expect(mockPut).toHaveBeenCalledWith('/contacts/1/deceasedDate', {
        is_deceased: true,
        is_deceased_date_known: true,
        deceased_date_date: '2023-01-15',
      });
      expect(result.data).toEqual(mockContact);
    });
  });

  describe('updateContactStayInTouch', () => {
    it('calls POST /contacts/:id/stayInTouch', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockPost.mockResolvedValue({ data: mockContact });
      
      const result = await contacts.updateContactStayInTouch(1, {
        stay_in_touch_frequency: 30,
      });
      
      expect(mockPost).toHaveBeenCalledWith('/contacts/1/stayInTouch', {
        stay_in_touch_frequency: 30,
      });
      expect(result.data).toEqual(mockContact);
    });
  });

  describe('updateContactFirstMet', () => {
    it('calls PUT /contacts/:id/firstMet', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockPut.mockResolvedValue({ data: mockContact });
      
      const result = await contacts.updateContactFirstMet(1, {
        first_met_general_information: 'Met at conference',
      });
      
      expect(mockPut).toHaveBeenCalledWith('/contacts/1/firstMet', {
        first_met_general_information: 'Met at conference',
      });
      expect(result.data).toEqual(mockContact);
    });
  });

  describe('updateContactFoodPreferences', () => {
    it('calls PUT /contacts/:id/foodpreferences', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockPut.mockResolvedValue({ data: mockContact });
      
      const result = await contacts.updateContactFoodPreferences(1, {
        food_preferences: 'Vegetarian',
      });
      
      expect(mockPut).toHaveBeenCalledWith('/contacts/1/foodpreferences', {
        food_preferences: 'Vegetarian',
      });
      expect(result.data).toEqual(mockContact);
    });
  });

  describe('setContactAvatar', () => {
    it('calls POST /contacts/:id/avatar', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockPost.mockResolvedValue({ data: mockContact });
      
      const result = await contacts.setContactAvatar(1, 'https://example.com/avatar.jpg');
      
      expect(mockPost).toHaveBeenCalledWith('/contacts/1/avatar', {
        avatar: 'https://example.com/avatar.jpg',
      });
      expect(result.data).toEqual(mockContact);
    });
  });

  describe('deleteContactAvatar', () => {
    it('calls DELETE /contacts/:id/avatar', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await contacts.deleteContactAvatar(1);
      
      expect(mockDel).toHaveBeenCalledWith('/contacts/1/avatar');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('updateContactCareer', () => {
    it('calls PUT /contacts/:id/career', async () => {
      const mockContact = { id: 1, object: 'contact', first_name: 'Test' };
      mockPut.mockResolvedValue({ data: mockContact });
      
      const result = await contacts.updateContactCareer(1, {
        job: 'Software Engineer',
        company: 'Tech Corp',
      });
      
      expect(mockPut).toHaveBeenCalledWith('/contacts/1/career', {
        job: 'Software Engineer',
        company: 'Tech Corp',
      });
      expect(result.data).toEqual(mockContact);
    });
  });

  describe('getContactFields', () => {
    it('calls GET /contacts/:id/contactfields with pagination params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await contacts.getContactFields(7, { page: 2, limit: 5 });

      expect(mockGet).toHaveBeenCalledWith('/contacts/7/contactfields', { page: 2, limit: 5 });
      expect(result).toEqual(mockResponse);
    });
  });
});
