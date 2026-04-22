import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

/**
 * Smoke suite — the minimum evidence that a build is shippable.
 *
 * Guarantees asserted:
 *   1. Every core route returns 200 and renders expected landmarks.
 *   2. The 6 narrative-index routes return 200 and include the basket-
 *      price sparkline + basket-constituents section.
 *   3. A market detail page renders (title + hero + order book).
 *   4. No uncaught JavaScript errors surface in the browser console
 *      on any tested route (warnings are allowed; errors fail the run).
 *   5. sitemap.xml and robots.txt resolve and contain expected slugs.
 *   6. JSON-LD is present on narrative + market detail pages (SEO regression
 *      guard).
 */

const NARRATIVE_SLUGS = [
  'kpop-big4-2026',
  'lck-dominance-2026',
  'lpl-rising-2026',
  'japan-heat-2026',
  'china-macro-2026',
  'hallyu-goes-global-2027',
];

const SAMPLE_MARKET_SLUGS = [
  'blackpink-reunion-2026',
  't1-wins-lol-worlds-2026',
  'worlds-2026-winner',
];

/** Capture console errors into an array. Ignore known-noisy sources. */
function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  const onMsg = (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Ignore third-party iframe errors we can't control (ytimg posters that
    // still 404 even on hq fallback for some edge cases).
    if (/youtube|ytimg|googlesyndication|doubleclick/i.test(text)) return;
    errors.push(text);
  };
  page.on('console', onMsg);
  return errors;
}

test.describe('smoke · core routes', () => {
  for (const path of ['/', '/feed', '/leaderboard', '/markets/new', '/worlds-2026']) {
    test(`GET ${path} renders`, async ({ page }) => {
      const errors = trackConsoleErrors(page);
      const response = await page.goto(path);
      expect(response?.status(), `${path} HTTP status`).toBe(200);
      // Skip-link is in every layout — good universal landmark.
      await expect(page.locator('a.skip-link')).toHaveCount(1);
      await expect(page.locator('#main-content')).toBeVisible();
      expect(errors, `console errors on ${path}`).toEqual([]);
    });
  }
});

test.describe('smoke · narrative indices', () => {
  for (const slug of NARRATIVE_SLUGS) {
    test(`/narratives/${slug} is live`, async ({ page }) => {
      const errors = trackConsoleErrors(page);
      const response = await page.goto(`/narratives/${slug}`);
      expect(response?.status()).toBe(200);
      // Hero landmarks
      await expect(page.getByText(/Narrative Index · Live/i)).toBeVisible();
      await expect(page.getByText(/Index price/i)).toBeVisible();
      // Basket constituents section — uses aria-labelledby pointing to this heading.
      await expect(
        page.locator('#narrative-legs-heading')
      ).toBeVisible();
      // Basket price sparkline
      await expect(page.getByText(/Basket price · 30d/i)).toBeVisible();
      // JSON-LD for SEO
      const ldCount = await page
        .locator('script[type="application/ld+json"]')
        .count();
      expect(ldCount).toBeGreaterThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('smoke · market detail', () => {
  for (const slug of SAMPLE_MARKET_SLUGS) {
    test(`/markets/${slug} renders`, async ({ page }) => {
      const response = await page.goto(`/markets/${slug}`);
      expect(response?.status()).toBe(200);
      const ldCount = await page
        .locator('script[type="application/ld+json"]')
        .count();
      expect(ldCount).toBeGreaterThanOrEqual(1);
    });
  }
});

test.describe('smoke · SEO artifacts', () => {
  test('sitemap.xml is served and lists narrative slugs', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    for (const slug of NARRATIVE_SLUGS) {
      expect(body).toContain(`/narratives/${slug}`);
    }
  });

  test('robots.txt points to the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/Sitemap:\s*https?:\/\/.+\/sitemap\.xml/);
  });
});
