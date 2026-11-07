
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

    // The integration tests call Cloud Functions code, which uses the
    // default Firebase Admin app (functions/src/firebase-admin.ts calls
    // initializeApp() with no options when the module loads). Give that
    // app the same project and emulator as the tests, so it neither looks
    // for real Google credentials nor writes to another project's data.
    env: {
      GCLOUD_PROJECT: 'zebron-test',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    },

    // Reset mocks between tests.
    clearMocks: true,
    restoreMocks: true,
  },
});

