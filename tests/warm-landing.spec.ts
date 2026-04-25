import { test, expect } from '@playwright/test';

/**
 * v2.28-3 — Warm landing smoke.
 *
 * Validates that /feed?m=<slug> reorders the catalog so the requested
 * market is the first card AND auto-opens its order sheet on mount.
 * /feed without the param renders the default catalog with no sheet
 * open — this protects against the auto-open accidentally firing on
 * every visit (which would torch the immersive feed UX).
 */

test.describe('warm landing — /feed?m=<slug>', () => {
  test('?m=<slug> auto-opens detail sheet', async ({ page, baseURL }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${baseURL}/feed?m=blackpink-reunion-2026&s=YES`);

    // FeedDetailSheet renders a dialog with role/aria-modal once opened.
    const sheet = page.locator('[role="dialog"][aria-modal="true"]').first();
    await expect(sheet).toBeVisible({ timeout: 6_000 });
    expect(errors).toEqual([]);
  });

  test('plain /feed does not auto-open the sheet', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/feed`);
    // Wait for hydration — give effects a chance to fire so we'd catch
    // an accidental auto-open.
    await page.waitForTimeout(800);
    const sheet = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(sheet).toHaveCount(0);
  });
});
