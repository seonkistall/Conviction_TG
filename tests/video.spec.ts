import { test, expect } from '@playwright/test';

/**
 * Video playback smoke (desktop chromium project).
 *
 * Validates the YouTube iframe mount path on the surfaces where
 * video matters most. Designed to surface the regression class the
 * user just hit ("Android 영상 재생 안됨") before it reaches a real
 * device — Playwright + Chrome devtools-protocol matches the engine
 * that actually ships in Chrome on Android, so a failure here would
 * also fail there.
 *
 * The mobile mirror of this file lives at video.mobile.spec.ts (the
 * mobile projects in playwright.config use a testMatch regex that
 * requires "mobile" or "visual" in the filename).
 *
 * What we check:
 *   1. Landing /  (Hero priority slot — eager iframe mount)
 *   2. /markets/[slug] hero (priority — same eager rule)
 *   3. /feed first card (immersive surface; iframe present after
 *      the IntersectionObserver fires for the first card)
 *
 * Failure modes this catches:
 *   - lazy-mount IO bug (iframe never enters DOM)
 *   - Embed origin / src misformatting (iframe present but src wrong)
 *   - JS runtime exception during AutoVideo render
 */

const YT = 'youtube-nocookie.com/embed/';

test.describe('video · post-rollback smoke (desktop)', () => {
  test('Landing Hero mounts a YouTube iframe', async ({ page, baseURL }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${baseURL}/?desktop=1`);
    const iframe = page.locator(`iframe[src*="${YT}"]`).first();
    await expect(iframe).toHaveCount(1, { timeout: 10_000 });
    const src = await iframe.getAttribute('src');
    expect(src).toMatch(/\/embed\/[A-Za-z0-9_-]{6,}/);
    expect(errs).toEqual([]);
  });

  test('Landing Hero poster <img> exists', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/?desktop=1`);
    const poster = page.locator('img[src*="i.ytimg.com/vi/"]').first();
    await expect(poster).toHaveCount(1, { timeout: 10_000 });
  });

  test('/markets/[slug] hero iframe', async ({ page, baseURL }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${baseURL}/markets/blackpink-reunion-2026`);
    const iframe = page.locator(`iframe[src*="${YT}"]`).first();
    await expect(iframe).toHaveCount(1, { timeout: 10_000 });
    expect(errs).toEqual([]);
  });

  test('/feed first card iframe', async ({ page, baseURL }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${baseURL}/feed`);
    await page.waitForTimeout(2_500);
    const iframe = page.locator(`iframe[src*="${YT}"]`).first();
    await expect(iframe).toBeVisible({ timeout: 10_000 });
    expect(errs).toEqual([]);
  });
});
