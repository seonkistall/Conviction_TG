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
      // Desktop project skips the mobile-fit + visual-regression specs —
      // those run exclusively on the phone-device projects below since their
      // baselines are viewport-specific.
      testIgnore: /(mobile|visual)\.spec\.ts/,
    },
    /*
     * v2.6.2 — explicit mobile viewports. We emulate common APAC-market
     * screen sizes so the mobile-fit regression (Hero overflowing, 3-col
     * stats grid, horizontal body scroll) stays caught in CI rather than
     * surfacing as a "screen doesn't fit" bug report after deploy.
     *
     * v2.9 — expanded:
     *   - Added `mobile-iphone-14-webkit` so real Safari DOM quirks
     *     (backdrop-filter prefix, date parsing, dvh clipping, scroll-snap
     *     stop) get exercised, not just Chromium-over-iPhone-device-metrics.
     *   - Added `mobile-galaxy-s9plus` and `mobile-android-tall`
     *     (920 × 393 portrait, emulating Galaxy S25 Ultra class aspect
     *     ratio ~0.43) so the YouTube-iframe cover-math regression that
     *     surfaced on real hardware has a dedicated baseline.
     *
     * We still force `browserName: 'chromium'` on the Chromium projects;
     * the WebKit project installs the webkit runtime once via
     * `npx playwright install webkit`.
     */
    {
      name: 'mobile-iphone-se',
      use: { ...devices['iPhone SE'], browserName: 'chromium' }, // 375 × 667
      testMatch: /(mobile|visual)\.spec\.ts/,
    },
    {
      name: 'mobile-iphone-14',
      use: { ...devices['iPhone 14'], browserName: 'chromium' }, // 390 × 844
      testMatch: /(mobile|visual)\.spec\.ts/,
    },
    {
      name: 'mobile-iphone-14-webkit',
      // Same device metrics, but WebKit engine — catches real Safari
      // differences (backdrop-filter, Date parsing, scroll-snap quirks).
      use: { ...devices['iPhone 14'], browserName: 'webkit' },
      testMatch: /(mobile|visual)\.spec\.ts/,
    },
    {
      name: 'mobile-pixel-5',
      use: { ...devices['Pixel 5'], browserName: 'chromium' }, // 393 × 851
      testMatch: /(mobile|visual)\.spec\.ts/,
    },
    {
      name: 'mobile-galaxy-s9plus',
      use: { ...devices['Galaxy S9+'], browserName: 'chromium' }, // 320 × 658
      testMatch: /(mobile|visual)\.spec\.ts/,
    },
    {
      // Tall-portrait Android emulation — matches the Galaxy S25 Ultra class
      // (aspect ratio ~0.43) where the feed-card YouTube iframe letterbox
      // bug originally surfaced. No Playwright descriptor exists for S25
      // yet, so we synthesize the viewport explicitly.
      name: 'mobile-android-tall',
      use: {
        browserName: 'chromium',
        viewport: { width: 384, height: 854 },
        deviceScaleFactor: 3.5,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 14; SM-S928U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
      },
      testMatch: /(mobile|visual)\.spec\.ts/,
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
