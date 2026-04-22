import { test, expect, type Page } from '@playwright/test';

/**
 * Mobile-fit smoke suite (v2.6.2).
 *
 * Asserts the landing page and a handful of critical routes actually fit
 * inside a phone-sized viewport. Runs under three device projects (iPhone
 * SE 375px, iPhone 14 390px, Pixel 5 393px) — see playwright.config.ts.
 *
 * What we guard against:
 *   1. Horizontal scroll on <body> (the #1 symptom of "screen doesn't fit").
 *   2. Hero H1 rendered wider than the viewport (catches runaway
 *      text-6xl without a mobile override).
 *   3. Hero CTA + "How it resolves" both visible above the fold.
 *   4. Header fits inside the viewport width (no clipped trade button).
 *   5. No uncaught JS errors on mobile (mobile-only hydration regressions).
 *
 * v2.11 — middleware interaction:
 *   Mobile UAs hitting `/` are now 307-redirected to `/feed`. Landing-
 *   targeted assertions use the `?desktop=1` escape hatch so they still
 *   render against the marketing landing from a mobile viewport. The
 *   redirect itself is covered by a dedicated guard below.
 */

// `?desktop=1` bypasses the middleware's mobile→/feed redirect (see
// `middleware.ts`). We use it so mobile-viewport tests that specifically
// target landing-page elements (Hero, Header, MobileNav) still resolve to
// the landing page rather than bouncing to /feed.
const LANDING = '/?desktop=1';

const ROUTES_TO_CHECK = [LANDING, '/feed', '/leaderboard', '/methodology'];

async function assertNoHorizontalScroll(page: Page, label: string) {
  /*
   * We don't check raw `scrollWidth` because intentional marquees
   * (LiveTicker, TrendingStrip) duplicate their content far past viewport
   * width and rely on their own `overflow-hidden` wrapper + the global
   * `overflow-x: hidden` on <html>/<body> to stay visually clipped.
   *
   * What we actually care about is: "can the user scroll the page
   * horizontally?" We test that by trying to scroll window 500px to the
   * right and asserting scrollX stays at 0. When `overflow-x: hidden` is
   * in effect globally, the browser refuses the scroll.
   */
  const result = await page.evaluate(() => {
    window.scrollTo(500, 0);
    const x = window.scrollX ?? window.pageXOffset ?? 0;
    window.scrollTo(0, 0);
    return {
      scrollX: x,
      clientWidth: document.documentElement.clientWidth,
    };
  });
  expect(
    result.scrollX,
    `${label}: user should not be able to horizontally scroll (window.scrollX=${result.scrollX}, clientWidth=${result.clientWidth})`
  ).toBe(0);
}

test.describe('mobile-fit · horizontal overflow guard', () => {
  for (const path of ROUTES_TO_CHECK) {
    test(`${path} has no horizontal scroll on mobile`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} HTTP status`).toBe(200);
      await assertNoHorizontalScroll(page, path);
    });
  }
});

test.describe('mobile-fit · landing Hero', () => {
  test('Hero H1 fits within viewport width', async ({ page }) => {
    await page.goto(LANDING);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const box = await h1.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'h1 should have a bounding box').not.toBeNull();
    expect(viewport, 'viewport size').not.toBeNull();
    expect(
      box!.width,
      `Hero H1 width (${box!.width}px) should fit in viewport (${viewport!.width}px)`
    ).toBeLessThanOrEqual(viewport!.width);
  });

  test('Hero CTA and secondary link are visible', async ({ page }) => {
    await page.goto(LANDING);
    await expect(page.getByRole('link', { name: /Explore markets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /How it resolves/i })).toBeVisible();
  });
});

test.describe('mobile-fit · Header', () => {
  test('Header Connect button fits inside viewport', async ({ page }) => {
    await page.goto(LANDING);
    const connect = page.getByRole('button', { name: /Connect/i }).first();
    await expect(connect).toBeVisible();
    const box = await connect.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    // Right edge of the Connect button must not exceed the viewport.
    expect(
      box!.x + box!.width,
      `Connect button right-edge (${(box!.x + box!.width).toFixed(0)}px) must fit in viewport (${viewport!.width}px)`
    ).toBeLessThanOrEqual(viewport!.width);
  });

  test('MobileNav bottom bar is visible on phones', async ({ page }) => {
    await page.goto(LANDING);
    await expect(page.getByRole('navigation', { name: /Primary mobile/i })).toBeVisible();
  });
});

/*
 * v2.10 — /feed immersive chrome guard.
 *
 * The TikTok-style /feed route deliberately hides the site Header,
 * Footer, and MobileNav so the full-bleed video card owns the entire
 * 100dvh. Before v2.10, those three chrome bars + the Samsung Internet
 * / Chrome Mobile browser chrome combined to compress the usable video
 * area on tall Android portraits (Galaxy S25 Ultra class). The user
 * reported it as "the screen is pushed down" twice.
 *
 * These assertions fail cleanly if anyone re-adds a global Header or
 * MobileNav on /feed in the future (e.g. by forgetting to pathname-gate
 * a new layout component). We check the semantic landmarks rather than
 * specific DOM class names so component refactors don't flap this test.
 */
test.describe('mobile-fit · /feed immersive chrome', () => {
  test('Header is hidden on /feed', async ({ page }) => {
    await page.goto('/feed');
    await expect(
      page.getByRole('banner'),
      '/feed should not render the site Header'
    ).toHaveCount(0);
  });

  test('MobileNav is hidden on /feed', async ({ page }) => {
    await page.goto('/feed');
    await expect(
      page.getByRole('navigation', { name: /Primary mobile/i }),
      '/feed should not render the mobile bottom nav'
    ).toHaveCount(0);
  });

  test('Feed card owns the full dynamic viewport height', async ({ page, viewport }) => {
    test.skip(!viewport, 'needs a viewport');
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    // The first <article> is the first feed card. Its top must start at
    // y=0 (no Header pushing it down) and its height must equal the
    // viewport height (full 100dvh, no MobileNav chewing space off the
    // bottom). We allow 2px tolerance for sub-pixel rounding.
    const firstCard = page.locator('article').first();
    await expect(firstCard).toBeVisible();
    const box = await firstCard.boundingBox();
    expect(box, 'first feed card bounding box').not.toBeNull();
    expect(
      box!.y,
      `Feed card should start at y=0, got ${box!.y}px (Header still rendering?)`
    ).toBeLessThanOrEqual(2);
    expect(
      box!.height,
      `Feed card height (${box!.height}px) should ~match viewport height (${viewport!.height}px)`
    ).toBeGreaterThanOrEqual(viewport!.height - 2);
  });
});

/*
 * v2.11 — middleware mobile→/feed redirect guard.
 *
 * Every mobile-project in playwright.config.ts sets a mobile-class UA
 * (iPhone SE / iPhone 14 / Pixel 5 / Galaxy S9+ / the synthesized
 * S25-Ultra-class UA). Hitting `/` should 307-bounce all of them to
 * `/feed` via middleware.ts. The escape hatch `?desktop=1` must continue
 * to bypass the redirect.
 *
 * If this test ever fails, the most likely causes are:
 *   - matcher widened or narrowed away from `/`,
 *   - MOBILE_UA_RE regressed,
 *   - the `?desktop=1` branch was removed.
 * All three are high-blast-radius regressions — mobile users would either
 * land on the wrong surface or get trapped in a redirect loop.
 */
test.describe('mobile-fit · v2.11 landing redirect', () => {
  test('mobile UA on / redirects to /feed', async ({ page }) => {
    const response = await page.goto('/');
    expect(response, 'response').not.toBeNull();
    // Final landing URL should be /feed (the 307 is followed automatically).
    expect(
      new URL(page.url()).pathname,
      `Mobile UA hit / but landed on ${page.url()} — redirect rule broken`
    ).toBe('/feed');
  });

  test('?desktop=1 bypasses the redirect from mobile UA', async ({ page }) => {
    await page.goto(LANDING);
    // We should NOT have been redirected — stay on /
    expect(
      new URL(page.url()).pathname,
      `?desktop=1 should have kept us on /, but we ended up on ${page.url()}`
    ).toBe('/');
    // And the landing Hero should be visible to confirm we rendered the
    // marketing page, not an empty /feed shell.
    await expect(page.getByRole('link', { name: /Explore markets/i })).toBeVisible();
  });
});

/*
 * v2.11 — Markets grid inline YES/NO quick-bet guard.
 *
 * Dev feedback #1 was that phone users decide in 10–20s and want to place
 * a trade from the first screen rather than drilling into `/markets/[slug]`.
 * We replaced the decorative QuickAction chips on each MarketCard with real
 * <button>s (QuickBetActions.tsx) that call parlay.add() directly.
 *
 * These assertions break if someone ever swaps the buttons back for plain
 * divs, or removes the aria-label pattern that makes them reachable to AT.
 * We check by accessible name (`/Buy YES at/i`) rather than class so CSS
 * refactors don't flap this.
 *
 * Pre-dismiss the OnboardingIntro overlay — it's a `fixed inset-0 z-[80]`
 * modal that intercepts clicks on first-visit and is gated by the
 * `cv_onboarded_v1` localStorage flag (see components/OnboardingIntro.tsx).
 * Setting it in `addInitScript` means the page boots already marked as
 * "onboarded" so the modal never renders, and our clicks reach the card.
 */
const ONBOARDING_STORAGE_KEY = 'cv_onboarded_v1';
async function dismissOnboarding(page: Page) {
  await page.addInitScript((key) => {
    try {
      window.localStorage.setItem(key, '1');
    } catch {
      /* private-mode Safari — best effort */
    }
  }, ONBOARDING_STORAGE_KEY);
}

test.describe('mobile-fit · v2.11 markets grid quick-bet', () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboarding(page);
  });

  test('MarketCard renders real YES + NO buttons with accessible labels', async ({
    page,
  }) => {
    // Mobile UA on `/` would redirect to /feed — use the escape hatch so
    // we land on the markets grid that hosts MarketCard.
    await page.goto(LANDING);
    // Wait for the grid to mount — at least one YES button must appear.
    const yesButtons = page.getByRole('button', { name: /^Buy YES at \d+ cents$/i });
    const noButtons = page.getByRole('button', { name: /^Buy NO at \d+ cents$/i });
    await expect(yesButtons.first()).toBeVisible();
    await expect(noButtons.first()).toBeVisible();

    // Sanity: the button labels resolve to exactly the rendered price text
    // (QuickBetActions shows `¢{Math.round(yesProb * 100)}`). We assert a
    // loose visual match — the label number should appear inside the button.
    const firstYes = yesButtons.first();
    const label = await firstYes.getAttribute('aria-label');
    expect(label).toMatch(/^Buy YES at \d+ cents$/);
    const cents = Number(label!.match(/(\d+)/)![1]);
    await expect(firstYes).toContainText(`¢${cents}`);
  });

  test('Tapping YES on a MarketCard does NOT navigate away (preventDefault)', async ({
    page,
  }) => {
    await page.goto(LANDING);
    const beforeUrl = page.url();
    const firstYes = page.getByRole('button', { name: /^Buy YES at \d+ cents$/i }).first();
    await firstYes.click();
    // Give the router a tick — if preventDefault slipped, Next.js would
    // already be rewriting the URL to /markets/[slug].
    await page.waitForTimeout(200);
    expect(
      new URL(page.url()).pathname,
      `Clicking quick-YES navigated to ${page.url()} — Link parent was not preventDefault'd`
    ).toBe(new URL(beforeUrl).pathname);
  });
});

/*
 * v2.11 — /feed detail-sheet guard.
 *
 * Dev feedback #2: a button on each feed card that opens the market's
 * structured detail as a blurred bottom sheet. We added an info button
 * (aria-label="View market details") to the right rail, and a
 * role="dialog" aria-modal="true" sheet with aria-label "<title> — market
 * details".
 *
 * We guard:
 *   1. The info button is reachable by accessible name.
 *   2. Clicking it opens a dialog element.
 *   3. ESC closes the dialog (keyboard-accessibility regression guard).
 */
test.describe('mobile-fit · v2.11 feed detail sheet', () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboarding(page);
  });

  test('Info button opens market detail sheet and ESC closes it', async ({ page }) => {
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');

    const info = page.getByRole('button', { name: /^View market details$/i }).first();
    await expect(info).toBeVisible();
    await info.click();

    // The sheet is a role="dialog" with aria-label "<title> — market details".
    const dialog = page.getByRole('dialog', { name: /market details$/i });
    await expect(dialog).toBeVisible();

    // YES/NO price buttons and the "View full market" link should be inside.
    // Accessible name is computed from inner text ("Buy YES ¢56"), so match
    // by prefix rather than anchoring to end.
    await expect(dialog.getByRole('button', { name: /Buy YES/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Buy NO/i })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /View full market/i })).toBeVisible();

    // ESC should close the sheet.
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
});
