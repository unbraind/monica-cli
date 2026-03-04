import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs before importing documents
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => Buffer.from('test file content')),
}));

vi.mock('../src/api/client', () => ({
  setConfig: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
  upload: vi.fn(),
}));

import * as client from '../src/api/client';
import * as documents from '../src/api/documents';

const mockSetConfig = client.setConfig as ReturnType<typeof vi.fn>;
const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;
const mockUpload = client.upload as ReturnType<typeof vi.fn>;

describe('documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetConfig({
      apiUrl: 'http://test.local/api',
      apiKey: 'test-key',
    });
  });

  describe('listDocuments', () => {
    it('should be a function', () => {
      expect(typeof documents.listDocuments).toBe('function');
    });
  });

  describe('listAllDocuments', () => {
    it('should be a function', () => {
      expect(typeof documents.listAllDocuments).toBe('function');
    });
  });

  describe('getDocument', () => {
    it('should be a function', () => {
      expect(typeof documents.getDocument).toBe('function');
    });
  });

  describe('listContactDocuments', () => {
    it('should be a function', () => {
      expect(typeof documents.listContactDocuments).toBe('function');
    });
  });

  describe('deleteDocument', () => {
    it('should be a function', () => {
      expect(typeof documents.deleteDocument).toBe('function');
    });
  });

  describe('createDocument', () => {
    it('should be a function', () => {
      expect(typeof documents.createDocument).toBe('function');
    });

    it('calls upload with correct endpoint and form data', async () => {
      mockUpload.mockResolvedValue({
        data: { id: 1, name: 'test.pdf' },
      });

      const result = await documents.createDocument(123, '/path/to/test.pdf');

      expect(mockUpload).toHaveBeenCalledWith('/documents', expect.any(FormData));
      expect(result.data.id).toBe(1);
    });
  });
});
