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
      // Desktop project skips the mobile-fit spec — mobile viewports are
      // handled by the phone-device projects below.
      testIgnore: /mobile\.spec\.ts/,
    },
    /*
     * v2.6.2 — explicit mobile viewports. We emulate three common APAC-market
     * screen sizes so the mobile-fit regression (Hero overflowing, 3-col
     * stats grid, horizontal body scroll) stays caught in CI rather than
     * surfacing as a "screen doesn't fit" bug report after deploy.
     *
     * We force `browserName: 'chromium'` so we only need the Chromium
     * runtime installed; the iPhone/Pixel device descriptors carry the
     * right viewport + UA + touch emulation regardless of which underlying
     * browser engine is launched.
     */
    {
      name: 'mobile-iphone-se',
      use: { ...devices['iPhone SE'], browserName: 'chromium' }, // 375 × 667
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile-iphone-14',
      use: { ...devices['iPhone 14'], browserName: 'chromium' }, // 390 × 844
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile-pixel-5',
      use: { ...devices['Pixel 5'], browserName: 'chromium' }, // 393 × 851
      testMatch: /mobile\.spec\.ts/,
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
