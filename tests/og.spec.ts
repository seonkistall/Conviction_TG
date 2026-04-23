import { test, expect } from '@playwright/test';

/**
 * v2.14 — Edge OG image pixel regression.  v2.15 — baselines committed,
 * default-on.
 *
 * Why this exists
 * ---------------
 * The Satori renderer (behind next/og) silently drops elements when it
 * hits unsupported flex rules or a missing font glyph — the image keeps
 * shipping, just blank where the broken piece was. That's the exact
 * failure mode we want to catch BEFORE a share card ends up on someone's
 * timeline with a missing logo or dropped Hangul.
 *
 * How it works
 * ------------
 * For a hand-picked set of representative routes (one market per
 * K/J/C region + two trader personas) we hit the OG endpoint directly,
 * render the returned PNG in a blank page, and diff it against a
 * checked-in baseline with a generous pixel tolerance. Fonts and emoji
 * can jitter a few pixels between runs, but a real breakage (missing
 * card, wrong tint, empty title) always blows through 5%.
 *
 * Tolerance note
 * --------------
 * 5% is wider than the 2% that's typical for raster diffs. It's tuned
 * for `next/og`'s dynamic-font behavior — the runtime fetches glyphs at
 * request time, and the same image rendered locally vs. on Vercel can
 * fall back to a different font if the dynamic-font fetch fails in
 * one environment but not the other. 5% absorbs the "logo glyph
 * swapped for fallback" jitter while still tripping on a fully-broken
 * card.
 *
 * Re-baselining
 * -------------
 * If a deliberate OG layout change pushes a diff above 5%, run:
 *
 *   npx playwright test tests/og.spec.ts \
 *     --project=chromium --update-snapshots
 *
 * and commit the regenerated `tests/og.spec.ts-snapshots/`.
 *
 * The test honors `OG_SNAPSHOTS=0` as an explicit opt-out for
 * environments where outbound font fetches are blocked entirely.
 */

const ENABLED = process.env.OG_SNAPSHOTS !== '0';

// Representative OG endpoints. The `id` segment mirrors what Next's
// metadata pipeline emits (id === the slug/handle from
// generateImageMetadata). A bust query param isn't needed — the OG route
// itself is content-addressed by path.
const OG_TARGETS: { name: string; path: string }[] = [
  {
    name: 'market-blackpink-reunion',
    path: '/markets/blackpink-reunion-2026/opengraph-image/blackpink-reunion-2026',
  },
  {
    name: 'market-lpl-spring-winner',
    path: '/markets/lpl-spring-2026-winner/opengraph-image/lpl-spring-2026-winner',
  },
  {
    name: 'market-hanshin-tigers',
    path: '/markets/hanshin-tigers-japan-series-2026/opengraph-image/hanshin-tigers-japan-series-2026',
  },
  {
    name: 'trader-ai-oracle-kr',
    path: '/traders/ai.oracle.kr/opengraph-image/ai.oracle.kr',
  },
  {
    name: 'trader-allora-lck',
    path: '/traders/allora.lck/opengraph-image/allora.lck',
  },
];

test.describe('visual · OG images', () => {
  test.skip(!ENABLED, 'Set OG_SNAPSHOTS=1 to run; see header comment');

  for (const { name, path } of OG_TARGETS) {
    test(`${name} matches baseline`, async ({ page }) => {
      // Navigate directly to the PNG endpoint. Chromium renders it in a
      // centered <img> inside an auto-generated document — we screenshot
      // just that element so outer chrome (scrollbar, tab padding) can't
      // pollute the diff.
      const response = await page.goto(path);
      expect(
        response?.status(),
        `OG endpoint ${path} HTTP status`
      ).toBe(200);
      expect(
        response?.headers()['content-type'] ?? '',
        'OG should be an image'
      ).toMatch(/^image\/(png|jpeg)/);

      const img = page.locator('img').first();
      await expect(img).toBeVisible();
      await expect(img).toHaveScreenshot(`${name}.png`, {
        // 5% tolerates next/og dynamic-font fallbacks across CI vs.
        // Vercel runtime, plus the usual font hinting / emoji subpixel
        // jitter. Real regressions (missing card, dropped Hangul,
        // empty title) always exceed this by a wide margin.
        maxDiffPixelRatio: 0.05,
      });
    });
  }
});
