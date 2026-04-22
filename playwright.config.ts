import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright smoke-test config.
 *
 * Two run modes:
 *   - Local: `npm run e2e` → starts `next start` against the production
 *     build and runs the smoke suite on http://localhost:3000.
 *   - CI / production: `E2E_BASE_URL=https://conviction-fe.vercel.app npm run e2e`
 *     → skips the webServer boot and smoke-tests the live deployment.
 */

const isProduction = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: isProduction
    ? undefined
    : {
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
