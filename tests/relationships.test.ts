import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as client from '../src/api/client';
import * as relationships from '../src/api/relationships';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;

describe('relationships API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listRelationships', () => {
    it('calls GET /contacts/:id/relationships', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);

      const result = await relationships.listRelationships(1, { page: 1, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/contacts/1/relationships', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRelationship', () => {
    it('calls GET /relationships/:id', async () => {
      const mockRelationship = {
        id: 1,
        object: 'relationship',
        contact_is: 'partner',
      };
      mockGet.mockResolvedValue({ data: mockRelationship });

      const result = await relationships.getRelationship(1);

      expect(mockGet).toHaveBeenCalledWith('/relationships/1');
      expect(result.data).toEqual(mockRelationship);
    });
  });

  describe('createRelationship', () => {
    it('calls POST /relationships with data', async () => {
      const mockRelationship = {
        id: 1,
        object: 'relationship',
        contact_is: 'partner',
      };
      mockPost.mockResolvedValue({ data: mockRelationship });

      const input = {
        contact_id: 1,
        related_contact_id: 2,
        relationship_type_id: 1,
      };
      const result = await relationships.createRelationship(input);

      expect(mockPost).toHaveBeenCalledWith('/relationships', input);
      expect(result.data).toEqual(mockRelationship);
    });
  });

  describe('updateRelationship', () => {
    it('calls PUT /relationships/:id with data', async () => {
      const mockRelationship = {
        id: 1,
        object: 'relationship',
        contact_is: 'partner',
      };
      mockPut.mockResolvedValue({ data: mockRelationship });

      const input = {
        relationship_type_id: 2,
      };
      const result = await relationships.updateRelationship(1, input);

      expect(mockPut).toHaveBeenCalledWith('/relationships/1', input);
      expect(result.data).toEqual(mockRelationship);
    });
  });

  describe('deleteRelationship', () => {
    it('calls DELETE /relationships/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });

      const result = await relationships.deleteRelationship(1);

      expect(mockDel).toHaveBeenCalledWith('/relationships/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('listRelationshipTypes', () => {
    it('calls GET /relationshiptypes', async () => {
      const mockTypes = [
        { id: 1, object: 'relationshiptype', name: 'partner' },
        { id: 2, object: 'relationshiptype', name: 'child' },
      ];
      mockGet.mockResolvedValue({ data: mockTypes });

      const result = await relationships.listRelationshipTypes();

      expect(mockGet).toHaveBeenCalledWith('/relationshiptypes');
      expect(result.data).toEqual(mockTypes);
    });
  });

  describe('getRelationshipType', () => {
    it('calls GET /relationshiptypes/:id', async () => {
      const mockType = { id: 1, object: 'relationshiptype', name: 'partner' };
      mockGet.mockResolvedValue({ data: mockType });

      const result = await relationships.getRelationshipType(1);

      expect(mockGet).toHaveBeenCalledWith('/relationshiptypes/1');
      expect(result.data).toEqual(mockType);
    });
  });

  describe('listRelationshipTypeGroups', () => {
    it('calls GET /relationshiptypegroups', async () => {
      const mockGroups = [
        { id: 1, object: 'relationshiptypegroup', name: 'love' },
        { id: 2, object: 'relationshiptypegroup', name: 'family' },
      ];
      mockGet.mockResolvedValue({ data: mockGroups });

      const result = await relationships.listRelationshipTypeGroups();

      expect(mockGet).toHaveBeenCalledWith('/relationshiptypegroups');
      expect(result.data).toEqual(mockGroups);
    });
  });

  describe('getRelationshipTypeGroup', () => {
    it('calls GET /relationshiptypegroups/:id', async () => {
      const mockGroup = { id: 1, object: 'relationshiptypegroup', name: 'love' };
      mockGet.mockResolvedValue({ data: mockGroup });

      const result = await relationships.getRelationshipTypeGroup(1);

      expect(mockGet).toHaveBeenCalledWith('/relationshiptypegroups/1');
      expect(result.data).toEqual(mockGroup);
    });
  });
});
