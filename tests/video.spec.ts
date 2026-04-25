import { test, expect } from '@playwright/test';

/**
 * Video playback smoke — runs after v2.29 rollback.
 *
 * Validates that the AutoVideo component still mounts a YouTube
 * iframe pointed at `youtube-nocookie.com/embed/<videoId>` on the
 * surfaces where video matters most:
 *
 *   1. Landing Hero (priority LCP slot — must mount eagerly)
 *   2. /markets/[slug] hero (priority — same eager-mount rule)
 *   3. /feed first card (immersive surface; iframe should mount on
 *      first paint of the visible card)
 *
 * The poster fallback chain (maxres → hq → gradient) is also checked
 * for the static <img> presence — if YouTube serves nothing, the
 * poster keeps the card from looking empty.
 *
 * Why a separate spec instead of folding into smoke.spec.ts? The
 * existing smoke covers HTTP 200 + basic content. Video has its own
 * failure modes (ad-blocker DOM rules, third-party cookie blocking,
 * iframe-src CSP) that warrant their own targeted assertions.
 */

const HOME_PRIORITY_SLUG_HINT = 'youtube-nocookie.com/embed/';

test.describe('video · post-rollback smoke', () => {
  test('Landing Hero mounts a YouTube iframe within 5s', async ({
    page,
    baseURL,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${baseURL}/?desktop=1`);
    // The Hero featured AutoVideo runs with priority=true → iframe
    // mounts immediately. Allow 5s for the network idle + lazy hooks.
    const iframe = page
      .locator(`iframe[src*="${HOME_PRIORITY_SLUG_HINT}"]`)
      .first();
    await expect(iframe).toHaveCount(1, { timeout: 5_000 });
    // Sanity-check the videoId portion is non-empty (not just /embed/?...).
    const src = await iframe.getAttribute('src');
    expect(src).toMatch(/\/embed\/[A-Za-z0-9_-]{6,}/);
    expect(errors).toEqual([]);
  });

  test('Landing Hero poster <img> exists as fallback', async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/?desktop=1`);
    // The poster <img> is rendered alongside the iframe by AutoVideo —
    // sits behind the iframe to handle the iframe-blocked path.
    const poster = page
      .locator('img[src*="i.ytimg.com/vi/"]')
      .first();
    await expect(poster).toHaveCount(1, { timeout: 5_000 });
    const src = await poster.getAttribute('src');
    // We standardized on hqdefault in v2.27-4 for payload reasons.
    expect(src).toContain('hqdefault.jpg');
  });

  test('/markets/[slug] hero mounts a YouTube iframe', async ({
    page,
    baseURL,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${baseURL}/markets/blackpink-reunion-2026`);
    const iframe = page
      .locator(`iframe[src*="${HOME_PRIORITY_SLUG_HINT}"]`)
      .first();
    await expect(iframe).toHaveCount(1, { timeout: 5_000 });
    expect(errors).toEqual([]);
  });

  test('/feed first card mounts a YouTube iframe', async ({
    page,
    baseURL,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${baseURL}/feed`);
    // The first card is the IntersectionObserver "active" candidate
    // immediately after mount. AutoVideo's lazy + priority logic
    // should resolve to iframe present within a couple of frames.
    const iframe = page
      .locator(`iframe[src*="${HOME_PRIORITY_SLUG_HINT}"]`)
      .first();
    await expect(iframe).toBeVisible({ timeout: 8_000 });
    expect(errors).toEqual([]);
  });

  test('/feed warm-landing iframe loads for a specific market', async ({
    page,
    baseURL,
  }) => {
    // Regression on v2.28-3: the warm-landing reorder shouldn't break
    // the iframe mount on the first (now-pinned) card.
    await page.goto(
      `${baseURL}/feed?m=blackpink-reunion-2026&s=YES`
    );
    const iframe = page
      .locator(`iframe[src*="${HOME_PRIORITY_SLUG_HINT}"]`)
      .first();
    await expect(iframe).toBeVisible({ timeout: 8_000 });
  });
});
