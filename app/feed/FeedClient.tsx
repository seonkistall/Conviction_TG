'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import type { Market } from '@/lib/types';
import { FeedCard } from '@/components/FeedCard';
import { ProposeInterstitial } from '@/components/ProposeInterstitial';

/*
 * v2.29-5 — Lazy-mount the LiveActivityTicker.
 *
 * The ticker is below-fold-equivalent in priority for the first
 * paint: the feed card video + price are what the user reads in the
 * first second; the ticker chips arrive within 3 seconds of mount
 * regardless. Pulling it out of the initial bundle saves ~3KB minified
 * + the synth-feed deterministic-hash work it runs on every rotation
 * tick, which Lighthouse attributed to the long TBT (mobile mid-tier).
 *
 * `ssr: false` because the ticker's setInterval + matchMedia code is
 * client-only anyway — pre-render emits a useless static snapshot
 * that React replaces on hydration.
 */
const LiveActivityTicker = dynamic(
  () => import('@/components/LiveActivityTicker').then((m) => m.LiveActivityTicker),
  { ssr: false }
);
import { useT } from '@/lib/i18n';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';

/**
 * v2.21-2 — Feed item union. Through v2.20 the feed rendered a flat
 * `markets.map(<FeedCard>)` — the permissionless market-creation story
 * (Conviction AI's core differentiator) never surfaced mid-scroll.
 *
 * We now interleave a `ProposeInterstitial` after every 5 markets,
 * keeping the scroll-snap behavior intact (each interstitial is a
 * 100dvh snap-start child). The rest of the component tracks `idx`
 * against `items.length` — current market for keyboard Y/N shortcuts
 * resolves to `null` on an interstitial, which the handlers no-op.
 */
type FeedItem =
  | { kind: 'market'; market: Market }
  | { kind: 'propose' }
  | { kind: 'end' };

function buildItems(markets: Market[]): FeedItem[] {
  const out: FeedItem[] = [];
  markets.forEach((m, i) => {
    out.push({ kind: 'market', market: m });
    // Insert after positions 4, 9, 14, … (every 5 markets).
    // Skip the trailing insert so we don't end on an interstitial.
    if ((i + 1) % 5 === 0 && i !== markets.length - 1) {
      out.push({ kind: 'propose' });
    }
  });
  /*
   * v2.25: Terminator card at the end of the feed.
   *
   * Pre-v2.25 the feed hard-stopped at the last market — there was no
   * "I'm done" signal, which mapped poorly onto TikTok muscle memory
   * where users expect either infinite content or an explicit
   * end-state. The terminator closes the loop with a "You're all
   * caught up — propose the next market" CTA, converting the end of
   * scroll into a funnel into /markets/new. Double-duty: reinforces
   * the permissionless moat exactly when the user has just consumed
   * the full catalog.
   */
  out.push({ kind: 'end' });
  return out;
}

interface Props {
  markets: Market[];
}

export function FeedClient({ markets }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const t = useT();
  const router = useRouter();
  const positions = usePositions();
  const toast = useToast();

  /*
   * v2.28-3 — Warm-landing parser.
   *
   * Read /feed?m=<slug>&s=<YES|NO> ONCE on first mount. The captured
   * values drive (a) reordering markets so the requested slug is the
   * first card, and (b) telling that single FeedCard to auto-open
   * its order sheet — pre-picked to YES/NO if the param was given.
   *
   * We snapshot via a ref + a one-shot useEffect rather than reading
   * useSearchParams() every render because:
   *   - We don't want a second navigation that mutates the query (or
   *     even an HMR re-render in dev) to re-pop the order sheet on
   *     every render. The warm landing is a single-shot UX.
   *   - The reorder + autoOpenSide should be stable for the lifetime
   *     of the feed view; subsequent in-app navigations to /feed
   *     (the back button, the keyboard 'Esc' to grid → back) start
   *     a fresh component tree and parse fresh.
   */
  const search = useSearchParams();
  const warmLandingRef = useRef<{
    slug: string | null;
    side: 'YES' | 'NO' | null;
  }>({
    slug: search?.get('m') ?? null,
    side:
      search?.get('s') === 'YES'
        ? 'YES'
        : search?.get('s') === 'NO'
          ? 'NO'
          : null,
  });
  const warmSlug = warmLandingRef.current.slug;
  const warmSide = warmLandingRef.current.side;

  /*
   * v2.26 — Pull-to-refresh state.
   *
   * The /feed feels most alive when it responds to the native iOS /
   * Android overscroll-and-release gesture. We track three things:
   *   - `pullY`    : how far the finger has pulled past scrollTop=0.
   *                  Drives the rubberband spinner's translate + the
   *                  "release to refresh" text.
   *   - `pulling`  : true while the finger is down and scrollTop=0.
   *   - `refreshing` : latched briefly after release to (a) show the
   *                    spinner and (b) key the items array via
   *                    `refreshSeq` to force a reshuffle animation.
   *
   * We don't actually re-fetch from a server (markets are a static
   * fixture in v2 scope) — we increment `refreshSeq` which reseeds
   * the `items` memo. Any new markets added to MARKETS after first
   * mount would surface here.
   */
  const [pullY, setPullY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSeq, setRefreshSeq] = useState(0);
  const pullStart = useRef<number | null>(null);
  const PULL_THRESHOLD = 70; // px over-pull required to trigger refresh

  // v2.21-2: items interleaves FeedCard + ProposeInterstitial.
  // v2.26: depend on refreshSeq so a pull-to-refresh rebuilds the list
  // even when the underlying markets reference hasn't changed.
  // v2.28-3: when ?m=<slug> is present, hoist that market to the top
  // before the interstitials get interleaved so the warm-landed market
  // is also the *first scroll snap* — the lander never has to scroll
  // to find what their friend shared.
  const items = useMemo(() => {
    let list = markets;
    if (warmSlug) {
      const idx = markets.findIndex((m) => m.slug === warmSlug);
      if (idx > 0) {
        list = [markets[idx], ...markets.slice(0, idx), ...markets.slice(idx + 1)];
      }
    }
    return buildItems(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets, refreshSeq, warmSlug]);

  // IntersectionObserver on children to track currently-visible card
  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;
    const cards = Array.from(scroller.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.5) {
            const i = cards.indexOf(e.target as HTMLElement);
            if (i !== -1) setIdx(i);
          }
        }
      },
      { root: scroller, threshold: [0.5, 0.75] }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items.length]);

  const scrollTo = useCallback((i: number) => {
    const scroller = ref.current;
    if (!scroller) return;
    const cards = Array.from(scroller.children) as HTMLElement[];
    const target = cards[Math.max(0, Math.min(cards.length - 1, i))];
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /**
   * Desktop keyboard nav. Mobile hands the feed entirely to snap-scroll
   * + touch gestures, so we guard with a pointer-type check. The binary
   * Y/N shortcuts quietly no-op on resolved or multi-outcome cards.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const onKey = (e: globalThis.KeyboardEvent) => {
      // Don't hijack when a text field has focus (Command palette, search…).
      const tgt = e.target as HTMLElement | null;
      const tag = tgt?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (tgt as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      // Avoid double-handling when the ⌘K palette is open.
      if (document.querySelector('[aria-label="Command palette"]')) return;

      // v2.21-2: idx now tracks `items` (markets + interstitials). Y/N
      // shortcuts only apply to actual market cards.
      const currentItem = items[idx];
      const current = currentItem?.kind === 'market' ? currentItem.market : null;
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          scrollTo(idx + 1);
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          scrollTo(idx - 1);
          break;
        case 'y':
        case 'Y':
          // v2.22-1: Y/N now place a direct $10 position via
          // PositionsProvider, matching the QuickBetActions refactor.
          if (current && current.kind === 'binary' && current.status !== 'resolved') {
            e.preventDefault();
            const price = current.yesProb;
            if (price > 0 && price < 1) {
              const shares = Math.max(1, Math.round(10 / price));
              positions.buy({
                marketId: current.id,
                side: 'YES',
                shares,
                price,
              });
              toast.push({
                kind: 'trade',
                title: `YES · ${shares} shares placed`,
                body: current.title,
                amount: `-$${(shares * price).toFixed(2)}`,
                cta: { href: '/portfolio', label: 'View' },
              });
            }
          }
          break;
        case 'n':
        case 'N':
          if (current && current.kind === 'binary' && current.status !== 'resolved') {
            e.preventDefault();
            const price = 1 - current.yesProb;
            if (price > 0 && price < 1) {
              const shares = Math.max(1, Math.round(10 / price));
              positions.buy({
                marketId: current.id,
                side: 'NO',
                shares,
                price,
              });
              toast.push({
                kind: 'trade',
                title: `NO · ${shares} shares placed`,
                body: current.title,
                amount: `-$${(shares * price).toFixed(2)}`,
                cta: { href: '/portfolio', label: 'View' },
              });
            }
          }
          break;
        case '?':
          e.preventDefault();
          setShowHelp((v) => !v);
          break;
        case 'Escape':
          if (showHelp) {
            e.preventDefault();
            setShowHelp(false);
          } else {
            e.preventDefault();
            router.push('/?desktop=1');
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, items, markets, positions, router, scrollTo, showHelp, toast]);

  const progressPct = items.length > 1
    ? ((idx + 1) / items.length) * 100
    : 100;

  return (
    /*
     * v2.11 — On desktop we center the feed at 420px wide (YouTube Shorts
     * style). Chrome elements (progress rail, back chip, dot rail) align
     * to this same column because they're absolute-positioned relative to
     * THIS wrapper. The `md:mx-auto` pushes the whole column toward center
     * of the visible area to the right of the 72px SideRail that
     * ChromeShell mounts on desktop immersive routes.
     *
     * Mobile: full viewport — pure immersion, no side chrome.
     * Desktop: 420px column centered in the remaining viewport after the
     * 72px left rail.
     */
    <div className="relative mx-auto h-[100dvh] w-full md:max-w-[420px]">
      {/*
       * v2.28-1 — Live activity ticker. Pinned to the top of the
       * immersive column; sits ABOVE the progress rail (z-30) but its
       * outer container is `pointer-events-none` so the rail still
       * paints unobstructed. Hidden on the end-of-feed terminator so
       * the "🏁 You're all caught up" moment isn't competing with
       * a "Just now: @oracle.seoul …" ticker referring to markets the
       * user has already exhausted scrolling past.
       *
       * The ticker is the single biggest "this is alive" signal a
       * first-time visitor reads in their first 5 seconds on /feed —
       * Polymarket and Kalshi both ship one for exactly this reason.
       */}
      {items[idx]?.kind !== 'end' && <LiveActivityTicker />}

      {/*
       * Top progress rail. 2px volt bar that fills left→right as the
       * reader advances through the feed. Sits above the safe-area
       * inset so it's always visible even on notch/pill devices.
       * `will-change: width` keeps the animation on the compositor.
       */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[2px] bg-white/10"
        style={{ marginTop: 'env(safe-area-inset-top)' }}
        aria-hidden="true"
      >
        <div
          className="h-full bg-volt shadow-[0_0_8px_rgba(198,255,61,0.6)] transition-[width] duration-300 ease-out"
          style={{ width: `${progressPct}%`, willChange: 'width' }}
        />
      </div>

      {/* Top overlay — back to grid. `?desktop=1` guards against the mobile
          middleware redirecting us back to /feed on edge emulation cases.
          v2.17: Bumped padding (py-1.5→py-2, px-3→px-3.5) so the tap
          target clears the iOS recommended 44×44 minimum — it was 32px
          tall in v2.16, hard to hit reliably with a thumb while the
          rest of the screen is already listening for swipe/double-tap.
          Added aria-label so SR users don't just hear "Markets" and
          wonder what they're backing out to. */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link
          href="/?desktop=1"
          aria-label="Exit feed, back to markets grid"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/80 px-3.5 py-2 text-xs font-semibold text-bone backdrop-blur transition hover:bg-ink-900 active:scale-95"
        >
          <span aria-hidden="true">←</span> {t('nav.markets')}
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/70 px-2 py-1 text-[10px] text-bone-muted backdrop-blur">
          <span className="font-mono tabular-nums text-bone">{idx + 1}</span>
          <span>/</span>
          <span className="font-mono tabular-nums">{items.length}</span>
        </div>
      </div>

      {/* Progress dots — right side, desktop only. v2.21-2: dots reflect
          items (markets + interstitials) so the user can see at a glance
          where the Propose-a-market slots land in the scroll. */}
      <div className="pointer-events-none absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-1 md:flex">
        {items.map((it, i) => (
          <span
            key={i}
            className={`block h-5 w-0.5 rounded-full transition ${
              i === idx
                ? 'bg-volt'
                : it.kind === 'propose'
                  ? 'bg-conviction/50'
                  : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      {/*
       * v2.26 — Pull-to-refresh visual.
       *
       * Sits above the scroller at the top of the viewport. Opacity
       * and height scale with `pullY`; once past threshold the text
       * flips to "Release to refresh". During the refreshing latch
       * it becomes a fixed-height spinner for ~700ms. Absolute +
       * pointer-events-none so it never eats scroll touches.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center"
        style={{
          height: refreshing
            ? 56
            : Math.min(pullY, PULL_THRESHOLD + 30),
          opacity:
            refreshing || pulling || pullY > 0
              ? Math.min(1, (refreshing ? 1 : pullY / PULL_THRESHOLD))
              : 0,
          transition: pulling
            ? 'none'
            : 'opacity 220ms ease-out, height 220ms ease-out',
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-bone backdrop-blur">
          <span
            className={clsx(
              'inline-block h-3 w-3 rounded-full border-2 border-bone-muted border-t-volt',
              refreshing && 'animate-spin'
            )}
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${Math.min(360, (pullY / PULL_THRESHOLD) * 360)}deg)`,
            }}
          />
          {refreshing
            ? 'Refreshing'
            : pullY >= PULL_THRESHOLD
              ? 'Release to refresh'
              : 'Pull to refresh'}
        </div>
      </div>

      <div
        ref={ref}
        className="snap-feed no-scrollbar h-full overflow-y-scroll"
        onTouchStart={(e) => {
          const scroller = ref.current;
          if (!scroller || scroller.scrollTop > 2) return;
          pullStart.current = e.touches[0]?.clientY ?? null;
          setPulling(true);
        }}
        onTouchMove={(e) => {
          if (pullStart.current === null) return;
          const dy = (e.touches[0]?.clientY ?? 0) - pullStart.current;
          // Only track downward drags. 0.5 dampening = classic iOS
          // rubberband feel (finger moves twice as fast as the visual).
          if (dy <= 0) {
            setPullY(0);
            return;
          }
          setPullY(Math.min(dy * 0.5, PULL_THRESHOLD + 40));
        }}
        onTouchEnd={() => {
          const armed = pullY >= PULL_THRESHOLD;
          setPulling(false);
          pullStart.current = null;
          if (armed) {
            // Trigger refresh: bump seq to rebuild items, show spinner
            // for 700ms, then collapse.
            setRefreshing(true);
            setPullY(0);
            setRefreshSeq((n) => n + 1);
            window.setTimeout(() => setRefreshing(false), 700);
          } else {
            setPullY(0);
          }
        }}
      >
        {items.map((it, i) => {
          if (it.kind === 'market') {
            // v2.28-3: only the warm-landed card receives autoOpenSide.
            // Comparing by slug (not id) because the URL param is the
            // human-readable slug. Pass `undefined` (not null) on the
            // non-warm cards so the FeedCard's prop discriminator
            // ('undefined → no auto-open') stays clean.
            const isWarm = warmSlug && it.market.slug === warmSlug;
            return (
              <FeedCard
                key={`m-${it.market.id}`}
                market={it.market}
                autoOpenSide={isWarm ? warmSide : undefined}
              />
            );
          }
          if (it.kind === 'propose') {
            return <ProposeInterstitial key={`p-${i}`} />;
          }
          return <FeedEndCard key={`e-${i}`} total={markets.length} />;
        })}
      </div>

      {/* Desktop-only keyboard-nav hint + help overlay. Hidden on touch. */}
      <button
        type="button"
        onClick={() => setShowHelp((v) => !v)}
        aria-label="Keyboard shortcuts"
        className="pointer-events-auto absolute bottom-4 right-4 z-20 hidden h-8 items-center gap-1 rounded-full border border-white/10 bg-ink-900/70 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-bone-muted backdrop-blur transition hover:text-bone md:flex"
      >
        <kbd className="rounded border border-white/10 px-1 text-[10px]">?</kbd>
        Shortcuts
      </button>

      {showHelp && (
        <div
          role="dialog"
          aria-label="Feed keyboard shortcuts"
          className="absolute inset-0 z-40 hidden items-center justify-center bg-ink-900/85 p-6 backdrop-blur md:flex"
          onClick={() => setShowHelp(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-800 p-5 text-sm text-bone shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-xl">Keyboard</span>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-bone-muted hover:text-bone"
                aria-label="Close"
              >
                Esc
              </button>
            </div>
            <ul className="space-y-2 text-bone-muted">
              <ShortRow keys={['↑', 'k']} label="Previous market" />
              <ShortRow keys={['↓', 'j']} label="Next market" />
              <ShortRow keys={['Y']} label="Place $10 YES position" />
              <ShortRow keys={['N']} label="Place $10 NO position" />
              <ShortRow keys={['⌘', 'K']} label="Open search" />
              <ShortRow keys={['Esc']} label="Back to grid" />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * v2.25 — End-of-feed terminator card.
 *
 * Rendered as the last item after every market + interstitial. Same
 * snap-start geometry as other feed items so it docks cleanly at
 * 100dvh, giving users the "I'm done" signal rather than leaving
 * them scrolling into emptiness. The Propose CTA routes into the
 * permissionless wizard (/markets/new) — the funnel we want to bias
 * toward at exactly the moment the user has signaled "I want more".
 *
 * A secondary "Back to top" button lets them loop the feed without
 * navigating away, since localStorage-backed likes + positions make
 * re-browsing worthwhile.
 */
function FeedEndCard({ total }: { total: number }) {
  return (
    <article
      className="snap-start flex h-[100dvh] w-full flex-col items-center justify-center bg-gradient-to-b from-ink-900 via-ink-800 to-ink-900 px-6"
      aria-label="End of feed"
    >
      <div className="w-full max-w-sm space-y-5 text-center">
        <div aria-hidden="true" className="text-5xl">🏁</div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            You&apos;re all caught up
          </div>
          <h2 className="mt-2 font-display text-3xl leading-tight text-bone">
            You&apos;ve seen all {total} live markets.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-bone-muted">
            Every APAC narrative worth trading gets its own market. Miss
            one? You can propose the next one in 45 seconds — 23-source
            AI decides if it ships.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/markets/new"
            className="rounded-full bg-volt px-5 py-3 text-sm font-bold text-ink-900 transition hover:bg-volt-dark active:scale-[0.98]"
          >
            ✨ Propose a market
          </Link>
          <button
            type="button"
            onClick={() => {
              if (typeof window === 'undefined') return;
              // Scroll the feed scroller (the closest `.snap-feed`
              // ancestor) back to the top. This is intentionally
              // JS-driven rather than a <Link href="/feed"> because
              // a navigate would tear down autoplay state across all
              // visible iframes and lose the global MuteProvider's
              // current owner; scrolling preserves both.
              const scroller = (document.querySelector('.snap-feed') as HTMLElement | null);
              scroller?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-full border border-white/10 bg-ink-800 px-5 py-3 text-sm font-semibold text-bone transition hover:bg-ink-700 active:scale-[0.98]"
          >
            ↺ Back to top
          </button>
        </div>

        <div className="pt-4 text-[10px] text-bone-muted/70">
          Tip: tap the heart on any market to save it to your Watchlist.
        </div>
      </div>
    </article>
  );
}

function ShortRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="min-w-[24px] rounded border border-white/10 bg-ink-900 px-1.5 py-0.5 text-center text-[11px] font-mono text-bone"
          >
            {k}
          </kbd>
        ))}
      </span>
    </li>
  );
}
