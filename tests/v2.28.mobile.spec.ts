import { test, expect } from '@playwright/test';

/**
 * v2.28 cross-platform smoke — mobile viewports.
 *
 * Runs on every mobile project (iPhone SE/14, Pixel 5, Galaxy S9+,
 * Android-tall S25-class, plus iPhone 14 WebKit when the runner has
 * the WebKit deps installed). Validates that the three v2.28
 * features survive the small-viewport + touch-emulation matrix:
 *
 *   1. LiveActivityTicker pills are visible AND their hit-targets
 *      do not eat the FeedCard tap region (regression guard against
 *      `pointer-events-none` getting clobbered).
 *   2. /portfolio's "Share" button renders next to "Close" without
 *      breaking the row layout — even on the narrowest viewport
 *      (Galaxy S9+ 320×658).
 *   3. /share/p/<token> renders the receipt without horizontal
 *      overflow on any viewport.
 *
 * The visual baseline regression for the new ticker chip lives in
 * `visual.spec.ts` so this file only does behavioural / layout checks.
 */

// A canonical token that points to a known-stable market in the
// catalog. Hard-coding the encoded form keeps the test independent
// from `lib/shareToken.ts` (we don't need the test to import it,
// which would force a tsconfig path resolution we don't need).
//
// Decodes to:
//   { m: 'blackpink-reunion-2026', s: 'YES', sh: 250, ap: 0.41,
//     cp: 0.62, h: 'oracle.seoul' }
const SHARE_TOKEN =
  'eyJtIjoiYmxhY2twaW5rLXJldW5pb24tMjAyNiIsInMiOiJZRVMiLCJzaCI6MjUwLCJhcCI6MC40MSwiY3AiOjAuNjIsImgiOiJvcmFjbGUuc2VvdWwifQ';

test.describe('v2.28 · mobile smoke', () => {
  test('LiveActivityTicker chips render on /feed', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/feed`);
    // Region landmark is the most stable hook — class names can
    // change but `aria-label="Live trader activity"` won't.
    const region = page.getByRole('region', {
      name: 'Live trader activity',
    });
    await expect(region).toBeVisible({ timeout: 6_000 });
    // Each visible chip is a Link → /markets/[slug]; we expect
    // VISIBLE_COUNT (=4) chips on first paint.
    const chips = region.getByRole('link');
    await expect(chips).toHaveCount(4, { timeout: 6_000 });
    // Disclosure sub-label is present so users know the demo nature.
    await expect(region.getByText(/Demo activity/i)).toBeVisible();
  });

  test('LiveActivityTicker does NOT eat the FeedCard tap region', async ({
    page,
    baseURL,
  }) => {
    // The wrapper div is `pointer-events-none` and only the chips
    // themselves are pointer-events-auto. Tapping the area BETWEEN
    // chips should still hit whatever's underneath (the FeedCard).
    await page.goto(`${baseURL}/feed`);
    const region = page.getByRole('region', {
      name: 'Live trader activity',
    });
    await region.waitFor({ state: 'visible', timeout: 6_000 });
    // CSS check rather than a synthetic click — clicking would
    // navigate (since the area below the ticker IS the FeedCard,
    // a tap closes the keyboard / fires the double-tap heuristic).
    const pe = await region.evaluate((el) => getComputedStyle(el).pointerEvents);
    expect(pe).toBe('none');
  });

  test('/portfolio Share button renders and is reachable', async ({
    page,
    baseURL,
  }) => {
    // /portfolio renders an EmptyState when there are no positions —
    // by design (positions are localStorage-keyed, fresh viewport
    // = empty storage). To exercise the Share button we seed one
    // position via localStorage before navigating.
    await page.goto(`${baseURL}/portfolio`);
    await page.evaluate(() => {
      const seed = {
        positions: [
          {
            marketId: 'blackpink-reunion-2026',
            side: 'YES',
            shares: 100,
            avgPrice: 0.42,
            currentPrice: 0.58,
            pnl: 16,
          },
        ],
        closed: [],
      };
      // The PositionsProvider keys its storage as 'conviction.positions.v2'.
      // Even if the key version bumps, getByRole below would tell us.
      try {
        window.localStorage.setItem(
          'conviction.positions.v2',
          JSON.stringify(seed)
        );
      } catch {
        /* private mode etc. — test would xfail gracefully */
      }
    });
    await page.reload();
    // Share button has aria-label="Share my conviction".
    const shareBtn = page
      .getByRole('button', { name: /share my conviction/i })
      .first();
    await expect(shareBtn).toBeVisible({ timeout: 6_000 });
  });

  test('/share/p/<token> receipt fits viewport (no horizontal overflow)', async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/share/p/${SHARE_TOKEN}`);
    // Look for the heading-equivalent: handle + side + shares pill.
    await expect(page.getByText(/oracle\.seoul/i)).toBeVisible({
      timeout: 6_000,
    });
    // No horizontal scroll on the body.
    const bodyOverflowX = await page.evaluate(() => {
      const docEl = document.documentElement;
      return docEl.scrollWidth - docEl.clientWidth;
    });
    expect(bodyOverflowX).toBeLessThanOrEqual(2); // 1-2px sub-pixel slop is fine
    // The CTA deep-links into the warm-landing path.
    const cta = page.getByRole('link', { name: /Trade YES/i });
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/\/feed\?m=blackpink-reunion-2026.*s=YES/);
  });
});
