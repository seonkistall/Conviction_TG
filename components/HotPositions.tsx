'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePositions } from '@/lib/positions';
import { useLivePrices } from '@/lib/livePrices';
import { getMarket, priceHistory } from '@/lib/markets';
import { Sparkline } from './Sparkline';

/**
 * Hot Positions widget.
 *
 * Compact "top movers" list for the portfolio sidebar. Ranks OPEN
 * positions by |live P&L| and shows the top 5. Each row shows poster
 * thumb, market title, YES/NO side pill, avg→mark cents, delta in pp,
 * a mini sparkline with a dashed baseline at avgPrice, and live $ P&L.
 *
 * Subscription model (v2.13):
 * ---------------------------
 * The parent calls `useLivePrices([ids])` ONCE and passes each row's
 * mark as a plain prop. HotRow is now hook-lite (only the memoized
 * sparkline series), which sidesteps any rules-of-hooks concern if the
 * sorted/sliced list length changes as prices tick.
 */
export function HotPositions() {
  const { positions, hydrated } = usePositions();

  const marketIds = useMemo(
    () => positions.map((p) => p.marketId),
    [positions]
  );
  const seeds = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of positions) {
      const m = getMarket(p.marketId);
      if (m) map[p.marketId] = m.yesProb;
    }
    return map;
  }, [positions]);

  const liveMap = useLivePrices(marketIds, seeds);

  // Rank + render data computed once so ordering and P&L can't drift
  // between sort() and the JSX mapping.
  const ranked = useMemo(() => {
    return positions
      .map((p) => {
        const mk = getMarket(p.marketId);
        if (!mk) return null;
        const liveYes = liveMap[p.marketId] ?? mk.yesProb;
        const mark = p.side === 'YES' ? liveYes : 1 - liveYes;
        const livePnl = p.shares * (mark - p.avgPrice);
        return { p, mk, mark, livePnl };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => Math.abs(b.livePnl) - Math.abs(a.livePnl))
      .slice(0, 5);
  }, [positions, liveMap]);

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
        <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!positions.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-bone">Hot positions</h3>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
          Live · top movers
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {ranked.map(({ p, mk, mark, livePnl }) => (
          <HotRow
            key={`${p.marketId}-${p.side}`}
            slug={mk.slug}
            title={mk.title}
            poster={mk.media.poster}
            side={p.side}
            avgPrice={p.avgPrice}
            mark={mark}
            livePnl={livePnl}
            yesProb={mk.yesProb}
          />
        ))}
      </ul>
    </div>
  );
}

function HotRow({
  slug,
  title,
  poster,
  side,
  avgPrice,
  mark,
  livePnl,
  yesProb,
}: {
  slug: string;
  title: string;
  poster: string;
  side: 'YES' | 'NO';
  avgPrice: number;
  mark: number;
  livePnl: number;
  yesProb: number;
}) {
  const series = useMemo(() => {
    const base = priceHistory(yesProb * 100, 14);
    return side === 'NO' ? base.map((v) => 1 - v) : base;
  }, [yesProb, side]);

  const deltaPP = (mark - avgPrice) * 100;
  const dir: 'up' | 'down' | 'flat' =
    Math.abs(deltaPP) < 0.1 ? 'flat' : deltaPP > 0 ? 'up' : 'down';

  return (
    <li>
      <Link
        href={`/markets/${slug}`}
        className="group flex items-center gap-3 rounded-lg border border-transparent p-1.5 transition hover:border-white/10 hover:bg-white/[0.03]"
      >
        <img
          src={poster}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="line-clamp-1 text-sm text-bone">{title}</div>
            <div
              className={`font-mono text-xs tabular-nums ${
                livePnl >= 0 ? 'text-yes' : 'text-no'
              }`}
            >
              {livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-bone-muted">
              <span
                className={`rounded px-1 py-0.5 font-bold uppercase tracking-widest ${
                  side === 'YES' ? 'bg-yes-soft text-yes' : 'bg-no-soft text-no'
                }`}
              >
                {side}
              </span>
              <span className="font-mono tabular-nums">
                ¢{Math.round(avgPrice * 100)} → ¢{Math.round(mark * 100)}
              </span>
              <span
                className={`font-mono tabular-nums ${
                  dir === 'up'
                    ? 'text-yes'
                    : dir === 'down'
                    ? 'text-no'
                    : 'text-bone-muted'
                }`}
              >
                {deltaPP >= 0 ? '+' : ''}
                {deltaPP.toFixed(1)}pp
              </span>
            </div>
            <Sparkline
              data={series}
              baseline={avgPrice}
              direction={dir}
              width={72}
              height={22}
              className="flex-shrink-0 opacity-80 group-hover:opacity-100"
            />
          </div>
        </div>
      </Link>
    </li>
  );
}
