import { test, expect } from '@playwright/test';

/**
 * v2.14 — Edge OG image pixel regression.  v2.15 — baselines committed,
 * default-on.  v2.16 — coverage expanded to 8 routes, tolerance tightened
 * to 3% after the ▲-glyph dynamic-font fix removed Vercel-vs-local font
 * fallback jitter.
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
 * For a hand-picked set of representative routes (markets across K/J/C
 * regions covering different card-layout shapes + two trader personas)
 * we hit the OG endpoint directly, render the returned PNG in a blank
 * page, and diff it against a checked-in baseline. Fonts can still
 * jitter a small amount across runs (subpixel hinting, anti-aliasing
 * differences across Chromium versions), but a real breakage — missing
 * card, dropped Hangul, empty title — always blows through 3%.
 *
 * Tolerance note
 * --------------
 * Started at 5% in v2.15 to absorb the dynamic-font fallback jitter from
 * the ▲ logo glyph (next/og's runtime font fetch returned 400 for that
 * codepoint, so local and Vercel renders disagreed on the fallback). In
 * v2.16 the logo became a CSS-drawn triangle (no font needed), so we
 * tightened to 3% — wide enough to absorb subpixel hinting noise, tight
 * enough to catch a layout regression on a single quadrant of the card.
 *
 * Re-baselining
 * -------------
 * If a deliberate OG layout change pushes a diff above 3%, run:
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
  // v2.16: Three additional layout shapes that v2.15 baselines didn't
  // cover. NewJeans = K-pop debut card style (long Hangul-leaning title +
  // trending chip), BYD = global EV market (large numeric AI edge), KBO =
  // baseball player prop (player-handle category pill). Each renders a
  // different AI edge polarity, which exercises the green/red branch in
  // markets/[id]/opengraph-image.tsx.
  {
    name: 'market-newjeans-comeback',
    path: '/markets/newjeans-comeback-q4/opengraph-image/newjeans-comeback-q4',
  },
  {
    name: 'market-byd-tesla-ev',
    path: '/markets/byd-beats-tesla-ev-2026/opengraph-image/byd-beats-tesla-ev-2026',
  },
  {
    name: 'market-kiwoom-kbo',
    path: '/markets/kiwoom-kbo-2026/opengraph-image/kiwoom-kbo-2026',
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
        // 3% (down from 5% in v2.15) — the ▲ logo is now CSS-drawn so
        // the dynamic-font fallback jitter is gone. Remaining variance
        // is subpixel hinting only. Real regressions (missing card,
        // dropped Hangul, empty title) always exceed this by a wide
        // margin.
        maxDiffPixelRatio: 0.03,
      });
    });
  }
});
