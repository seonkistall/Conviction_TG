'use client';

import { useMemo, type ReactNode } from 'react';
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

  return (
    <div className={clsx(className ?? DEFAULT_GRID)}>
      {markets.map((m) => {
        const card = (
          <MarketCard
            market={m}
            size={size}
            livePrice={live[m.id]}
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
  );
}
