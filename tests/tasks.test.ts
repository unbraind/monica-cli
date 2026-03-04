import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  getAllPages: vi.fn(),
}));

import * as client from '../src/api/client';
import * as tasks from '../src/api/tasks';

const mockGet = client.get as ReturnType<typeof vi.fn>;
const mockPost = client.post as ReturnType<typeof vi.fn>;
const mockPut = client.put as ReturnType<typeof vi.fn>;
const mockDel = client.del as ReturnType<typeof vi.fn>;
const mockGetAllPages = client.getAllPages as ReturnType<typeof vi.fn>;

describe('tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTasks', () => {
    it('calls GET /tasks with params', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await tasks.listTasks({ page: 1, limit: 10 });
      
      expect(mockGet).toHaveBeenCalledWith('/tasks', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTask', () => {
    it('calls GET /tasks/:id', async () => {
      const mockTask = { id: 1, object: 'task', title: 'Test task' };
      mockGet.mockResolvedValue({ data: mockTask });
      
      const result = await tasks.getTask(1);
      
      expect(mockGet).toHaveBeenCalledWith('/tasks/1');
      expect(result.data).toEqual(mockTask);
    });
  });

  describe('createTask', () => {
    it('calls POST /tasks with data', async () => {
      const mockTask = { id: 1, object: 'task', title: 'Test task' };
      mockPost.mockResolvedValue({ data: mockTask });
      
      const input = { title: 'Test task', completed: 0, contact_id: 1 };
      const result = await tasks.createTask(input);
      
      expect(mockPost).toHaveBeenCalledWith('/tasks', input);
      expect(result.data).toEqual(mockTask);
    });
  });

  describe('updateTask', () => {
    it('calls PUT /tasks/:id with data', async () => {
      const mockTask = { id: 1, object: 'task', title: 'Updated task' };
      mockPut.mockResolvedValue({ data: mockTask });
      
      const input = { title: 'Updated task', completed: 1, contact_id: 1 };
      const result = await tasks.updateTask(1, input);
      
      expect(mockPut).toHaveBeenCalledWith('/tasks/1', input);
      expect(result.data).toEqual(mockTask);
    });
  });

  describe('deleteTask', () => {
    it('calls DELETE /tasks/:id', async () => {
      mockDel.mockResolvedValue({ deleted: true, id: 1 });
      
      const result = await tasks.deleteTask(1);
      
      expect(mockDel).toHaveBeenCalledWith('/tasks/1');
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });

  describe('listContactTasks', () => {
    it('calls GET /contacts/:id/tasks', async () => {
      const mockResponse = { data: [], links: {} as any, meta: {} as any };
      mockGet.mockResolvedValue(mockResponse);
      
      const result = await tasks.listContactTasks(1);
      
      expect(mockGet).toHaveBeenCalledWith('/contacts/1/tasks', undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listAllTasks', () => {
    it('calls getAllPages for /tasks', async () => {
      const mockTasks = [{ id: 1 }, { id: 2 }];
      mockGetAllPages.mockResolvedValue(mockTasks);
      
      const result = await tasks.listAllTasks();
      
      expect(mockGetAllPages).toHaveBeenCalledWith('/tasks', undefined, undefined);
      expect(result).toEqual(mockTasks);
    });
  });
});
