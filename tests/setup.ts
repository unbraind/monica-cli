import { vi, type MockedFunction } from 'vitest';
import type * as client from '../src/api/client';

// Declare the mocked client module type
type MockedClient = {
  get: MockedFunction<typeof client.get>;
  post: MockedFunction<typeof client.post>;
  put: MockedFunction<typeof client.put>;
  del: MockedFunction<typeof client.del>;
  getAllPages: MockedFunction<typeof client.getAllPages>;
};

// Export helper for tests
declare global {
  var mockedClient: MockedClient;
}

// Ensure proper test isolation
beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});
