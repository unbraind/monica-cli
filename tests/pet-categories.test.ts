import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import {
  listPetCategories,
  listAllPetCategories,
  getPetCategory,
} from '../src/api/pet-categories';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('pet-categories API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listPetCategories calls GET /petcategories with params', async () => {
    const mockResponse = { data: [], links: {} as never, meta: {} as never };
    mockGet.mockResolvedValue(mockResponse);

    const result = await listPetCategories({ page: 2, limit: 5 });

    expect(client.get).toHaveBeenCalledWith('/petcategories', { page: 2, limit: 5 });
    expect(result).toEqual(mockResponse);
  });

  it('listAllPetCategories calls getAllPages /petcategories', async () => {
    const mockCategories = [{ id: 1, name: 'Dog', is_common: true }];
    mockGetAllPages.mockResolvedValue(mockCategories as never);

    const result = await listAllPetCategories(3);

    expect(client.getAllPages).toHaveBeenCalledWith('/petcategories', undefined, 3);
    expect(result).toEqual(mockCategories);
  });

  it('getPetCategory calls GET /petcategories/:id', async () => {
    const mockResponse = { data: { id: 1, name: 'Dog', is_common: true } };
    mockGet.mockResolvedValue(mockResponse as never);

    const result = await getPetCategory(1);

    expect(client.get).toHaveBeenCalledWith('/petcategories/1');
    expect(result).toEqual(mockResponse);
  });
});
