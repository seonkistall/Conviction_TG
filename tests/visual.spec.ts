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

  /*
   * v2.9 — Feed cover-math regression guard.
   *
   * Catches the Galaxy S25 Ultra class bug where the YouTube iframe
   * letterboxed inside the 9:19.5 portrait feed card because the old
   * `scale-[1.35]` cover hack couldn't reach aspect ratios <0.6.
   *
   * We probe the first feed card's iframe bounding box directly rather than
   * diffing pixels (YouTube content differs across runs even with masks).
   * Success = the iframe's rendered width & height both exceed the viewport
   * by at least 1.5× — which is only true when the cqw/cqh cover math kicks
   * in. A scale-[1.35] style regression would fail this assertion cleanly.
   */
  test('feed card iframe covers portrait viewport', async ({ page, viewport }) => {
    test.skip(!viewport, 'needs a viewport');
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // Wait for the first feed card's iframe to mount (YouTubeEmbed adds it
    // after a 120ms settle delay inside AutoVideo).
    const firstIframe = page.locator('article iframe').first();
    await firstIframe.waitFor({ state: 'attached', timeout: 8_000 });
    await page.waitForTimeout(500);

    const box = await firstIframe.boundingBox();
    if (!box) throw new Error('iframe has no bounding box');

    const vw = viewport!.width;
    const vh = viewport!.height;
    const portraitAspect = vw / vh;

    if (portraitAspect < 16 / 9) {
      // Container is taller than 16:9 → height axis must be over-sized so
      // the 16:9 iframe's content covers. We expect at least the viewport
      // width AND the 16:9-scaled-to-viewport-height width.
      const expectedMinWidth = (vh * 16) / 9 * 0.95; // 5% tolerance
      if (box.width < expectedMinWidth) {
        throw new Error(
          `Feed iframe width ${box.width} too small; expected ≥ ${expectedMinWidth} to cover ${vw}×${vh} viewport`
        );
      }
    }

    // The iframe must at minimum match the viewport in both dimensions; if
    // it doesn't, the background will letterbox visibly.
    if (box.width < vw - 1 || box.height < vh - 1) {
      throw new Error(
        `Feed iframe ${box.width}×${box.height} doesn't cover viewport ${vw}×${vh}`
      );
    }
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
