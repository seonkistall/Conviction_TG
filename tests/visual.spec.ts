import { test, expect } from '@playwright/test';

/**
 * Visual regression baselines.
 *
 * We capture above-the-fold screenshots of the public landing surfaces on
 * three mobile device profiles (iPhone SE, iPhone 14, Pixel 5). The point is
 * to catch "accidentally broke the hero" type regressions — not to pixel-lock
 * the whole page.
 *
 * Anti-flake strategy:
 *   - `animations: 'disabled'` pauses all CSS animations (shimmer, marquee,
 *     live-dot pulse) at t=0 so screenshots are deterministic.
 *   - We mask known time-based widgets (Header clock cluster, Hero "Closes
 *     in" label, LiveTicker) so their contents can churn without failing the
 *     diff. Masks are filled with a solid color by Playwright.
 *   - `maxDiffPixelRatio: 0.02` tolerates minor antialiasing / emoji-render
 *     differences across OSes. Real layout regressions always blow past 2%.
 *   - We wait for `networkidle` + a short buffer so YouTube iframes settle
 *     before the shot is taken.
 *
 * Note: baselines are device-specific — Playwright stores them under
 * `tests/visual.spec.ts-snapshots/<name>-<project>-linux.png`. To update
 * intentionally, run: `npx playwright test tests/visual.spec.ts --update-snapshots`.
 */

// Top-of-page clip: we only snapshot the first ~900px so shots stay stable as
// feed/leaderboard data changes below the fold.
const CLIP = { x: 0, y: 0, width: 0, height: 0 }; // width filled per-test below

test.describe('visual · landing surfaces', () => {
  test('landing page hero + ticker baseline', async ({ page, viewport }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Let the font-swap and shimmer settle one more frame.
    await page.waitForTimeout(400);

    await expect(page).toHaveScreenshot('landing.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: viewport?.width ?? 390, height: 900 },
      animations: 'disabled',
      caret: 'hide',
      mask: [
        page.locator('[data-ticker]'),
        page.locator('[data-clock-cluster]'),
        page.locator('[data-hero-countdown]'),
      ],
      maxDiffPixelRatio: 0.02,
    });
  });

  test('feed page top baseline', async ({ page, viewport }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    await expect(page).toHaveScreenshot('feed.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: viewport?.width ?? 390, height: 900 },
      animations: 'disabled',
      caret: 'hide',
      mask: [
        page.locator('[data-clock-cluster]'),
        page.locator('video'),
        page.locator('iframe'),
      ],
      maxDiffPixelRatio: 0.03,
    });
  });

  test('leaderboard page top baseline', async ({ page, viewport }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    await expect(page).toHaveScreenshot('leaderboard.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: viewport?.width ?? 390, height: 900 },
      animations: 'disabled',
      caret: 'hide',
      mask: [page.locator('[data-clock-cluster]')],
      maxDiffPixelRatio: 0.02,
    });
  });
});

// Reference CLIP so the import isn't flagged unused by the linter — kept here
// for future absolute-pixel clipping experiments.
void CLIP;
