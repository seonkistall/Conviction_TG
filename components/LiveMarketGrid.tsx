'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { useLivePrices } from '@/lib/livePrices';
import { MarketCard } from './MarketCard';
import type { Market } from '@/lib/types';

/**
 * v2.15 — `LiveMarketGrid` is the single batched-subscription wrapper for any
 * place we render a list of `<MarketCard>`s. It opens exactly one
 * `useLivePrices(ids, seeds)` subscription on the parent and feeds each card
 * its current mark via the new `livePrice` prop.
 *
 * Why a wrapper instead of making MarketCard itself a client component:
 *
 *   - MarketCard is rendered from server pages (leaderboard, worlds-2026,
 *     market detail). Promoting it to "use client" would force a giant
 *     client tree, hurting LCP and bundle size.
 *   - The HotPositions refactor in v2.13 already proved the pattern: parent
 *     owns the context read, children stay prop-driven and hook-lite.
 *   - One subscription per visible grid scales much better than one per
 *     card if a future page renders 100+ markets.
 *
 * `decorators` carries optional per-card overlay nodes (used by
 * `/narratives/[slug]` for the "% leg" chip). It's a plain `Record<id, node>`
 * rather than a render function so server pages can pass it without crossing
 * the serialization boundary.
 */

interface Props {
  markets: Market[];
  size?: 'sm' | 'md' | 'lg' | 'wide';
  /** Tailwind grid className. Defaults to a sensible 1/2/3/4-col responsive grid. */
  className?: string;
  /**
   * Map of `market.id → ReactNode` overlay. When present, the card is wrapped
   * in a `relative` div and the decorator is dropped on top — anchored by the
   * decorator's own absolute positioning classes.
   */
  decorators?: Record<string, ReactNode>;
}

const DEFAULT_GRID =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

export function LiveMarketGrid({
  markets,
  size,
  className,
  decorators,
}: Props) {
  // Subscribe to every visible market in one context read. `seeds` keeps the
  // first paint deterministic — the live ticker hasn't fired yet on hydrate.
  const ids = useMemo(() => markets.map((m) => m.id), [markets]);
  const seeds = useMemo(() => {
    const out: Record<string, number> = {};
    for (const m of markets) out[m.id] = m.yesProb;
    return out;
  }, [markets]);
  const live = useLivePrices(ids, seeds);

  // v2.16: Viewport-gated rendering. The provider keeps ticking globally,
  // but a grid that scrolled past the fold (or pages with multiple stacked
  // grids — /worlds-2026, /narratives) gets frozen to its last value while
  // off-screen. We can't conditionally call `useLivePrices`, so we *always*
  // read the context and just stop forwarding fresh values to children
  // (passing the same primitive prop is a free render skip). 200px
  // rootMargin keeps the grid "live" just before it scrolls into view, so
  // a fast scroll doesn't surface a stale tick for a frame.
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Default to true during SSR / before IO fires so the first paint matches
  // the live mark and there's no visible "freeze → unfreeze" flash.
  const [visible, setVisible] = useState(true);
  // The last live snapshot we observed while visible. When we go off-screen
  // we keep displaying it; when we come back the next tick replaces it.
  const frozenRef = useRef<Record<string, number>>(seeds);
  if (visible) frozenRef.current = live;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setVisible(e.isIntersecting);
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const display = visible ? live : frozenRef.current;

  // v2.16: A single grid-level live region replaces the per-card aria-live
  // we had in v2.15 (which announced every tick on every visible card —
  // a flood for screen reader users). We watch for any market whose
  // displayed pct moved ≥3pp from the last *announced* value, then emit
  // one polite message. Rate-limited to 8s so a thrashing tape doesn't
  // overwhelm the queue. Empty string by default so SR doesn't read
  // anything on first render.
  const lastAnnouncedRef = useRef<Record<string, number>>(seeds);
  const lastAnnouncedAtRef = useRef<number>(0);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (!visible) return;
    const now = Date.now();
    if (now - lastAnnouncedAtRef.current < 8000) return;
    let biggest:
      | { market: Market; from: number; to: number; delta: number }
      | null = null;
    for (const m of markets) {
      const to = Math.round((display[m.id] ?? m.yesProb) * 100);
      const from = Math.round(
        (lastAnnouncedRef.current[m.id] ?? m.yesProb) * 100
      );
      const delta = Math.abs(to - from);
      if (delta >= 3 && (!biggest || delta > biggest.delta)) {
        biggest = { market: m, from, to, delta };
      }
    }
    if (!biggest) return;
    setAnnouncement(
      `${biggest.market.title} moved ${biggest.from > biggest.to ? 'down' : 'up'} ${biggest.delta} cents to ${biggest.to} cents.`
    );
    // Update *all* baselines, not just the announced one — otherwise a
    // single big mover keeps stealing the queue while smaller drifts
    // accumulate silently.
    for (const m of markets) {
      lastAnnouncedRef.current[m.id] = display[m.id] ?? m.yesProb;
    }
    lastAnnouncedAtRef.current = now;
  }, [display, visible, markets]);

  return (
    <>
      <div ref={rootRef} className={clsx(className ?? DEFAULT_GRID)}>
        {markets.map((m) => {
          const card = (
            <MarketCard
              market={m}
              size={size}
              livePrice={display[m.id]}
            />
          );
          const decorator = decorators?.[m.id];
          if (decorator) {
            return (
              <div key={m.id} className="relative">
                {decorator}
                {card}
              </div>
            );
          }
          return <div key={m.id}>{card}</div>;
        })}
      </div>
      {/* sr-only live region. One per grid; debounced + threshold-gated
          (see the effect above) so screen readers get a useful summary
          rather than a per-tick price firehose. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </>
  );
}
