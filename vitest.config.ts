import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    isolate: true,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 65,
        lines: 50,
      },
    },
  },
});
