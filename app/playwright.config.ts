import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke suite for the spec §11 journeys, run against the built dist/
 * (ROADMAP M3): `npm run build` at the repo root first, then
 * `npm run test:e2e`. In environments with a preinstalled browser, point
 * ATLAS_CHROMIUM at the executable instead of downloading one.
 */
const executablePath = process.env['ATLAS_CHROMIUM'];

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: {
    // vite preview serves build.outDir (../dist) — app assets + data together.
    // The preview host is pinned to 127.0.0.1 in vite.config.ts so this URL
    // and the server can't disagree about loopback flavor.
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
