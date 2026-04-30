'use client';

import { useEffect } from 'react';
import { mark, PERF_MARKS } from '@/lib/perfMarks';
import { usePathname, useRouter } from 'next/navigation';

/**
 * v2.27 — Telegram Mini App adapter (Phase 1, minimal).
 *
 * Wires Conviction into Telegram's WebApp shell when the page is loaded
 * inside Telegram (`window.Telegram?.WebApp` is defined). On a regular
 * browser this component is a no-op — every effect early-returns when
 * the SDK isn't present, so visitors on conviction-fe.vercel.app see
 * exactly the same UI they always have.
 *
 * What it does inside Telegram:
 *   1. Calls `WebApp.ready()` to dismiss TG's loading spinner.
 *   2. Calls `WebApp.expand()` so the WebApp takes the full viewport
 *      instead of the half-sheet default — required for an immersive
 *      `/feed`.
 *   3. Disables the vertical-swipe-down dismiss on TG ≥ 7.7. TG
 *      treats a downward swipe at the top of the viewport as "close
 *      this WebApp"; that gesture conflicts directly with our
 *      pull-to-refresh on `/feed` and would close the app whenever a
 *      user tried to refresh the stream.
 *   4. Reads `WebApp.themeParams` and exposes them as CSS custom
 *      properties on `:root` (`--tg-bg-color`, `--tg-text-color`,
 *      etc.). Conviction's brand stays dark by design, but having the
 *      vars available means a future surface can opt into the user's
 *      preferred TG theme without re-plumbing.
 *   5. Wires `WebApp.BackButton` to `router.back()` on every non-root
 *      pathname. On `/` (and `/feed` which is the mobile root via the
 *      middleware redirect) the BackButton hides — closing the app is
 *      the user's job (TG's native close affordance handles it).
 *
 * Phase 1 NON-goals (deferred to Phase 2):
 *   - initData validation server-side (TG auth → Conviction user)
 *   - MainButton wired to YES/NO/Confirm
 *   - HapticFeedback on quick-bet taps
 *   - Native TG share replacing the X intent on /share/p/[token]
 *   - Telegram Stars / crypto payments
 */

// v2.28: type + global declare moved to lib/tgWebApp.ts (single source of truth).


export function TelegramAdapter() {
  const router = useRouter();
  const pathname = usePathname();

  // Mount-time setup: ready/expand/theme/disableSwipes. Runs once per
  // SDK availability — the SDK either loads fast (TG injects it before
  // first paint when it knows it's a WebApp) or never (regular browser).
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setup = () => {
      const tg = window.Telegram?.WebApp;
      if (!tg) return false;

      try {
        tg.ready();
        mark(PERF_MARKS.tgReady);
        if (!tg.isExpanded) tg.expand();
        // 7.7+ — guards `/feed` pull-to-refresh from being interpreted
        // as a close-the-app gesture.
        tg.disableVerticalSwipes?.();
        // Force the TG header + background to match Conviction's
        // brand ink so the WebApp visually merges with our shell
        // instead of showing TG's default white/black bar.
        tg.setHeaderColor?.('#05060A');
        tg.setBackgroundColor?.('#05060A');

        // Mirror TG theme params into CSS vars. Useful for components
        // that want to opt into the user's TG color scheme later.
        const root = document.documentElement;
        for (const [k, v] of Object.entries(tg.themeParams ?? {})) {
          if (typeof v === 'string') {
            // bg_color → --tg-bg-color
            root.style.setProperty(`--tg-${k.replace(/_/g, '-')}`, v);
          }
        }

        // viewportStableHeight is the height TG guarantees won't change
        // while the WebApp is open (excludes keyboard / temporary UI).
        // Surfaces that hard-code 100dvh (the immersive /feed) read
        // this var as a fallback so a TG-specific bottom bar doesn't
        // crop the bottom-of-card YES/NO buttons.
        root.style.setProperty(
          '--tg-viewport-height',
          `${tg.viewportStableHeight}px`
        );

        // Mark the body so CSS / future components can branch via
        // `[data-platform="telegram"]` selectors.
        document.body.dataset.platform = 'telegram';
        document.body.dataset.tgVersion = tg.version;

        return true;
      } catch (err) {
        // SDK quirks (older TG clients) shouldn't crash the page.
        // eslint-disable-next-line no-console
        console.warn('[TelegramAdapter] setup error:', err);
        return true; // We tried; don't poll forever.
      }
    };

    if (setup()) return;

    // SDK script loads `async defer`, so it might not be ready on
    // first effect tick. Poll a few times before giving up — total
    // wait window ~600ms which is well under any user-perceptible
    // delay even on the slowest TG client boot.
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (setup() || tries >= 6) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  // Per-route: BackButton management. Show on every non-root path,
  // wire to router.back(). Hide on `/` and `/feed` (the two roots a
  // TG user might land on directly).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const isRoot = pathname === '/' || pathname === '/feed';
    const onClick = () => router.back();

    if (isRoot) {
      tg.BackButton.hide();
      return;
    }

    tg.BackButton.onClick(onClick);
    tg.BackButton.show();

    return () => {
      tg.BackButton.offClick(onClick);
      tg.BackButton.hide();
    };
  }, [pathname, router]);

  // -- Phase 2 (v2.28) — Deeplink routing via start_param ---------------
  //
  // Smoketest finding F-10. Group-chat viral loop:
  //   friend shares  t.me/Conviction_Predict_bot/open?startapp=market_btc-150k-eoy
  //   user taps      → Mini App launches → this effect routes to
  //                    /markets/btc-150k-eoy on first paint.
  //
  // Conventions:
  //   market_<slug>     → /markets/<slug>
  //   propose_<query>   → /markets/new?q=<decoded query>
  //   propose           → /markets/new
  //   feed              → /feed
  //   leaderboard       → /leaderboard
  //
  // Runs once per Mini-App session. We use sessionStorage as the
  // single-flight latch so a soft route change (router.replace then
  // user navigates back to /) doesn't re-fire the redirect and trap
  // the user at the deeplink target forever.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    const startParam = tg.initDataUnsafe?.start_param;
    if (!startParam) return;
    if (sessionStorage.getItem('cv_tg_start_handled') === '1') return;
    sessionStorage.setItem('cv_tg_start_handled', '1');

    let target: string | null = null;
    if (startParam.startsWith('market_')) {
      const slug = startParam.slice('market_'.length);
      if (slug) target = '/markets/' + encodeURIComponent(slug);
    } else if (startParam.startsWith('propose_')) {
      const q = startParam.slice('propose_'.length);
      target = q
        ? '/markets/new?q=' + encodeURIComponent(decodeURIComponent(q))
        : '/markets/new';
    } else if (startParam === 'propose') {
      target = '/markets/new';
    } else if (startParam === 'feed') {
      target = '/feed';
    } else if (startParam === 'leaderboard') {
      target = '/leaderboard';
    }

    if (target && target !== pathname) {
      router.replace(target);
    }
    // Run only once on mount — the latch handles re-entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
