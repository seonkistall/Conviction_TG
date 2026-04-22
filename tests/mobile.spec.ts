import { test, expect, type Page } from '@playwright/test';

/**
 * Mobile-fit smoke suite (v2.6.2).
 *
 * Asserts the landing page and a handful of critical routes actually fit
 * inside a phone-sized viewport. Runs under three device projects (iPhone
 * SE 375px, iPhone 14 390px, Pixel 5 393px) — see playwright.config.ts.
 *
 * What we guard against:
 *   1. Horizontal scroll on <body> (the #1 symptom of "screen doesn't fit").
 *   2. Hero H1 rendered wider than the viewport (catches runaway
 *      text-6xl without a mobile override).
 *   3. Hero CTA + "How it resolves" both visible above the fold.
 *   4. Header fits inside the viewport width (no clipped trade button).
 *   5. No uncaught JS errors on mobile (mobile-only hydration regressions).
 */

const ROUTES_TO_CHECK = ['/', '/feed', '/leaderboard', '/methodology'];

async function assertNoHorizontalScroll(page: Page, label: string) {
  /*
   * We don't check raw `scrollWidth` because intentional marquees
   * (LiveTicker, TrendingStrip) duplicate their content far past viewport
   * width and rely on their own `overflow-hidden` wrapper + the global
   * `overflow-x: hidden` on <html>/<body> to stay visually clipped.
   *
   * What we actually care about is: "can the user scroll the page
   * horizontally?" We test that by trying to scroll window 500px to the
   * right and asserting scrollX stays at 0. When `overflow-x: hidden` is
   * in effect globally, the browser refuses the scroll.
   */
  const result = await page.evaluate(() => {
    window.scrollTo(500, 0);
    const x = window.scrollX ?? window.pageXOffset ?? 0;
    window.scrollTo(0, 0);
    return {
      scrollX: x,
      clientWidth: document.documentElement.clientWidth,
    };
  });
  expect(
    result.scrollX,
    `${label}: user should not be able to horizontally scroll (window.scrollX=${result.scrollX}, clientWidth=${result.clientWidth})`
  ).toBe(0);
}

test.describe('mobile-fit · horizontal overflow guard', () => {
  for (const path of ROUTES_TO_CHECK) {
    test(`${path} has no horizontal scroll on mobile`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} HTTP status`).toBe(200);
      await assertNoHorizontalScroll(page, path);
    });
  }
});

test.describe('mobile-fit · landing Hero', () => {
  test('Hero H1 fits within viewport width', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const box = await h1.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'h1 should have a bounding box').not.toBeNull();
    expect(viewport, 'viewport size').not.toBeNull();
    expect(
      box!.width,
      `Hero H1 width (${box!.width}px) should fit in viewport (${viewport!.width}px)`
    ).toBeLessThanOrEqual(viewport!.width);
  });

  test('Hero CTA and secondary link are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Explore markets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /How it resolves/i })).toBeVisible();
  });
});

test.describe('mobile-fit · Header', () => {
  test('Header Connect button fits inside viewport', async ({ page }) => {
    await page.goto('/');
    const connect = page.getByRole('button', { name: /Connect/i }).first();
    await expect(connect).toBeVisible();
    const box = await connect.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    // Right edge of the Connect button must not exceed the viewport.
    expect(
      box!.x + box!.width,
      `Connect button right-edge (${(box!.x + box!.width).toFixed(0)}px) must fit in viewport (${viewport!.width}px)`
    ).toBeLessThanOrEqual(viewport!.width);
  });

  test('MobileNav bottom bar is visible on phones', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: /Primary mobile/i })).toBeVisible();
  });
});
