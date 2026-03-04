import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs before importing photos
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => Buffer.from('test image content')),
}));

vi.mock('../src/api/client', () => ({
  setConfig: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
  upload: vi.fn(),
}));

import * as client from '../src/api/client';
import * as photos from '../src/api/photos';

const mockSetConfig = client.setConfig as ReturnType<typeof vi.fn>;
const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;
const mockUpload = client.upload as ReturnType<typeof vi.fn>;

describe('photos API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetConfig({
      apiUrl: 'http://test.local/api',
      apiKey: 'test-key',
    });
  });

  describe('listPhotos', () => {
    it('should be a function', () => {
      expect(typeof photos.listPhotos).toBe('function');
    });
  });

  describe('listAllPhotos', () => {
    it('should be a function', () => {
      expect(typeof photos.listAllPhotos).toBe('function');
    });
  });

  describe('getPhoto', () => {
    it('should be a function', () => {
      expect(typeof photos.getPhoto).toBe('function');
    });
  });

  describe('listContactPhotos', () => {
    it('should be a function', () => {
      expect(typeof photos.listContactPhotos).toBe('function');
    });
  });

  describe('deletePhoto', () => {
    it('should be a function', () => {
      expect(typeof photos.deletePhoto).toBe('function');
    });
  });

  describe('createPhoto', () => {
    it('should be a function', () => {
      expect(typeof photos.createPhoto).toBe('function');
    });

    it('calls upload with correct endpoint and form data', async () => {
      mockUpload.mockResolvedValue({
        data: { id: 1, original_filename: 'test.jpg' },
      });

      const result = await photos.createPhoto(123, '/path/to/test.jpg');

      expect(mockUpload).toHaveBeenCalledWith('/photos', expect.any(FormData));
      expect(result.data.id).toBe(1);
    });
  });
});
