import { test, expect, type Page } from '@playwright/test';
import { installTgMock } from './helpers/tgMock';

/**
 * v2.28.2 — Sprint-1 + Sprint-1.1 e2e in TG-mocked context.
 *
 * Covers the four findings whose acceptance is impossible in the
 * existing browser-only smoke suite:
 *   F-02  Sticky Buy MainButton appears on market detail
 *   F-06  Region routing — KR user sees a Music card before Crypto
 *   F-08  Native HapticFeedback fires on confirm
 *   F-10  Deeplink start_param routes user to the target market
 *
 * We mock window.Telegram.WebApp via tests/helpers/tgMock.ts. The
 * mock records every MainButton.setParams call on
 * window.__cv_mainBtnLog and every HapticFeedback call on
 * window.__cv_hapticLog so assertions are deterministic.
 *
 * Project filter: chromium only (TG mock works in any browser; no
 * mobile-viewport-specific assertions yet — visual regression for
 * the buy sheet is a Sprint-2 follow-up).
 */

test.describe('Sprint-1 TG mini app surface', () => {
  test('F-10 · deeplink market_<slug> routes straight to that market', async ({ page, baseURL }) => {
    await installTgMock(page, { startParam: 'market_btc-150k-eoy' });
    await page.goto(`${baseURL}/`);
    // TelegramAdapter calls router.replace inside a useEffect → wait
    // for the URL to settle on /markets/btc-150k-eoy.
    await page.waitForURL(/\/markets\/btc-150k-eoy/, { timeout: 5_000 });
    await expect(page).toHaveURL(/\/markets\/btc-150k-eoy/);
    // Hero copy on the BTC market detail.
    await expect(page.getByRole('heading', { name: /Bitcoin/i })).toBeVisible();
  });

  test('F-02 · MainButton shows "Buy YES ¢XX" on market detail', async ({ page, baseURL }) => {
    await installTgMock(page);
    await page.goto(`${baseURL}/markets/btc-150k-eoy`);

    // MarketTgBuyButton mounts on first paint and pushes a Buy YES /
    // Buy NO label depending on yesProb. Wait for the mock log to
    // record a Buy entry.
    await page.waitForFunction(
      () => {
        const log = (window as unknown as { __cv_mainBtnLog?: Array<{ text: string; isVisible: boolean }> }).__cv_mainBtnLog;
        return Array.isArray(log) && log.some((s) => /^Buy (YES|NO) ¢\d+$/.test(s.text) && s.isVisible);
      },
      null,
      { timeout: 5_000 }
    );
  });

  test('F-08 · tapping MainButton opens buy sheet, then haptic on confirm', async ({ page, baseURL }) => {
    await installTgMock(page);
    await page.goto(`${baseURL}/markets/btc-150k-eoy`);

    // Wait for MainButton to be wired.
    await page.waitForFunction(
      () => {
        const log = (window as unknown as { __cv_mainBtnLog?: Array<{ text: string; isVisible: boolean }> }).__cv_mainBtnLog;
        return Array.isArray(log) && log.some((s) => /^Buy /.test(s.text) && s.isVisible);
      },
      null,
      { timeout: 5_000 }
    );

    // Synthetically fire MainButton click → opens TgBuySheet.
    await page.evaluate(() => (window as unknown as { __cv_clickMain: () => void }).__cv_clickMain());
    await expect(page.getByRole('dialog', { name: /Place a bet/i })).toBeVisible();

    // Now MainButton text changes to "Confirm · YES <n> shares · $25" — wait for it.
    await page.waitForFunction(
      () => {
        const log = (window as unknown as { __cv_mainBtnLog?: Array<{ text: string }> }).__cv_mainBtnLog;
        return Array.isArray(log) && log.some((s) => /^Confirm · /.test(s.text));
      },
      null,
      { timeout: 3_000 }
    );

    // Click confirm. Haptic.success() should fire after the simulated 600ms commit.
    await page.evaluate(() => (window as unknown as { __cv_clickMain: () => void }).__cv_clickMain());
    await page.waitForFunction(
      () => {
        const log = (window as unknown as { __cv_hapticLog?: Array<{ kind: string; arg: string }> }).__cv_hapticLog;
        // commit() fires impact 'heavy' then notify 'success' — we accept either.
        return Array.isArray(log) && log.some((h) =>
          (h.kind === 'notify' && h.arg === 'success') ||
          (h.kind === 'impact' && h.arg === 'heavy')
        );
      },
      null,
      { timeout: 2_500 }
    );
  });

  test('F-06 · KR user — first trending strip card is regionally relevant', async ({ page, baseURL }) => {
    await installTgMock(page, { languageCode: 'ko' });
    await page.goto(`${baseURL}/?desktop=1`); // bypass mobile→/feed redirect for the strip

    // After hydration the TrendingStrip useEffect commits the region
    // reorder. The first non-padding card visible should belong to a
    // KR-friendly category. We allow Music | Sports | Esports.
    const firstCategory = page.locator(
      '.animate-marquee a span.text-bone-muted'
    ).first();
    await expect(firstCategory).toBeVisible({ timeout: 5_000 });
    const txt = (await firstCategory.textContent())?.trim() ?? '';
    expect(['Music', 'Sports', 'Esports']).toContain(txt);
  });
});
