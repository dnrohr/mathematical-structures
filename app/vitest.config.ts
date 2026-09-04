import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests only — e2e/*.spec.ts belongs to Playwright, not Vitest.
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
