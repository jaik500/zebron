
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Discover all tests under the centralized tests directory.
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
    ],

    // Exclude dependencies and generated build output.
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/functions/lib/**',
      '**/dist/**',
    ],

    // Allow only one test file to execute at a time.
    fileParallelism: false,

    // Prevent concurrent execution of tests within a file.
    sequence: {
      concurrent: false,
    },

    // Test and hook timeouts.
    testTimeout: 30_000,
    hookTimeout: 60_000,

    // Reset mocks between tests.
    clearMocks: true,
    restoreMocks: true,
  },
});

