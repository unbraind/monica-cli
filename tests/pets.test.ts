import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  setConfig: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as client from '../src/api/client';
import {
  listPets,
  listAllPets,
  listContactPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
} from '../src/api/pets';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;

describe('pets API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listPets', () => {
    it('calls GET /pets with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await listPets({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/pets', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listContactPets', () => {
    it('calls GET /contacts/:id/pets', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await listContactPets(1);
      
      expect(mockGet).toHaveBeenCalledWith('/contacts/1/pets', undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPet', () => {
    it('calls GET /pets/:id', async () => {
      const mockPet = { id: 1, object: 'pet', name: 'Fluffy' };
      mockGet.mockResolvedValue({ data: mockPet });
      
      const result = await getPet(1);
      
      expect(mockGet).toHaveBeenCalledWith('/pets/1');
      expect(result.data).toEqual(mockPet);
    });
  });

  describe('createPet', () => {
    it('calls POST /pets with data', async () => {
      const mockPet = { id: 1, object: 'pet', name: 'Fluffy' };
      mockPost.mockResolvedValue({ data: mockPet });
      
      const input = {
        contact_id: 1,
        name: 'Fluffy',
        pet_category_id: 1,
      };
      const result = await createPet(input);
      
      expect(mockPost).toHaveBeenCalledWith('/pets', input);
      expect(result.data).toEqual(mockPet);
    });
  });

  describe('updatePet', () => {
    it('calls PUT /pets/:id with data', async () => {
      const mockPet = { id: 1, object: 'pet', name: 'Fluffy Updated' };
      mockPut.mockResolvedValue({ data: mockPet });
      
      const input = {
        name: 'Fluffy Updated',
      };
      const result = await updatePet(1, input);
      
      expect(mockPut).toHaveBeenCalledWith('/pets/1', input);
      expect(result.data).toEqual(mockPet);
    });
  });

  describe('deletePet', () => {
    it('calls DELETE /pets/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await deletePet(1);
      
      expect(mockDel).toHaveBeenCalledWith('/pets/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });
});
