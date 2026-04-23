'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Market } from '@/lib/types';
import { FeedCard } from '@/components/FeedCard';
import { ProposeInterstitial } from '@/components/ProposeInterstitial';
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
  | { kind: 'propose' };

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

  // v2.21-2: items interleaves FeedCard + ProposeInterstitial.
  const items = useMemo(() => buildItems(markets), [markets]);

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

      <div
        ref={ref}
        className="snap-feed no-scrollbar h-full overflow-y-scroll"
      >
        {items.map((it, i) =>
          it.kind === 'market' ? (
            <FeedCard key={`m-${it.market.id}`} market={it.market} />
          ) : (
            <ProposeInterstitial key={`p-${i}`} />
          )
        )}
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
