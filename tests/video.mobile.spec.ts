import { test, expect } from '@playwright/test';

/**
 * Video playback smoke — mobile mirror of video.spec.ts.
 *
 * Same assertions but the filename matches the mobile projects'
 * testMatch regex (`(mobile|visual)\.spec\.ts`). Runs on:
 *   - mobile-iphone-14         · chromium-on-iPhone-14 metrics (iPhone Chrome)
 *   - mobile-iphone-14-webkit  · WebKit engine (Mac/iOS Safari)
 *   - mobile-pixel-5           · chromium-on-Pixel-5 metrics (Android Chrome)
 *   - mobile-android-tall      · chromium with Android-tall UA + viewport (S25-class)
 *   - mobile-iphone-se         · narrow iPhone metrics
 *   - mobile-galaxy-s9plus     · narrow Android metrics
 *
 * The user's reported regression was iOS-shaped ("YouTube 로고 + Play
 * 버튼만 보임" on Android Chrome). The webkit project additionally
 * surfaces real Safari rendering quirks that chromium-with-iOS-metrics
 * doesn't catch (backdrop-filter, scroll-snap-stop, dvh).
 */

const YT = 'youtube-nocookie.com/embed/';

test.describe('video · post-rollback smoke (mobile)', () => {
  test('Landing Hero iframe mounts', async ({ page, baseURL }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    // /?desktop=1 bypasses the mobile→/feed redirect so we can verify
    // the landing Hero specifically, then we test /feed separately.
    await page.goto(`${baseURL}/?desktop=1`);
    const iframe = page.locator(`iframe[src*="${YT}"]`).first();
    await expect(iframe).toHaveCount(1, { timeout: 12_000 });
    expect(errs).toEqual([]);
  });

  test('Landing Hero poster <img> exists (fallback if iframe blocked)', async ({
    page,
    baseURL,
  }) => {
    await page.goto(`${baseURL}/?desktop=1`);
    const poster = page.locator('img[src*="i.ytimg.com/vi/"]').first();
    await expect(poster).toHaveCount(1, { timeout: 10_000 });
  });

  test('/markets/[slug] hero iframe', async ({ page, baseURL }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${baseURL}/markets/blackpink-reunion-2026`);
    const iframe = page.locator(`iframe[src*="${YT}"]`).first();
    await expect(iframe).toHaveCount(1, { timeout: 12_000 });
    expect(errs).toEqual([]);
  });

  test('/feed first card iframe', async ({ page, baseURL }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${baseURL}/feed`);
    await page.waitForTimeout(3_000);
    const iframe = page.locator(`iframe[src*="${YT}"]`).first();
    await expect(iframe).toBeVisible({ timeout: 12_000 });
    expect(errs).toEqual([]);
  });
});
