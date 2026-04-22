'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePositions } from '@/lib/positions';
import { useLivePrice } from '@/lib/livePrices';
import { getMarket, priceHistory } from '@/lib/markets';
import { Sparkline } from './Sparkline';

/**
 * Hot Positions widget.
 *
 * A compact "top movers" list for the portfolio sidebar. We rank all OPEN
 * positions by |live P&L| and show the top 5. Each row gets:
 *   - Poster thumb + shortened market title
 *   - Mini sparkline (last 14 days of the underlying YES price, flipped if
 *     the user is on NO side) with a dashed baseline at the user's avg.
 *   - Live delta vs. avg in pp (percentage points).
 *   - Colored P&L in dollars.
 *
 * The live mark comes from the global livePrices ticker so this widget
 * visibly moves every ~4s — which does the emotional job you'd want from
 * a "hot positions" strip on a trading app demo.
 */
export function HotPositions() {
  const { positions, hydrated } = usePositions();

  // Render nothing until hydrated so we don't flash the seed values for
  // a returning user whose real positions are still loading from storage.
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
        {positions
          .slice()
          .map((p) => ({ p, absPnl: Math.abs(p.pnl) }))
          .sort((a, b) => b.absPnl - a.absPnl)
          .slice(0, 5)
          .map(({ p }) => (
            <HotRow key={`${p.marketId}-${p.side}`} marketId={p.marketId} side={p.side} shares={p.shares} avgPrice={p.avgPrice} />
          ))}
      </ul>
    </div>
  );
}

/**
 * One row. Split out so we can call `useLivePrice` for each position
 * without breaking rules-of-hooks — the parent sorts & slices before
 * mounting any of these, so the hook count per row is stable.
 */
function HotRow({
  marketId,
  side,
  shares,
  avgPrice,
}: {
  marketId: string;
  side: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
}) {
  const mk = getMarket(marketId);
  const liveYes = useLivePrice(marketId, mk?.yesProb ?? 0.5);

  // History is derived from the market's yesProb. If the position is NO,
  // flip the series so "up" visually aligns with "user is winning".
  const series = useMemo(() => {
    const base = priceHistory(mk?.yesProb ? mk.yesProb * 100 : 50, 14);
    return side === 'NO' ? base.map((v) => 1 - v) : base;
  }, [mk?.yesProb, side]);

  if (!mk) return null;

  const mark = side === 'YES' ? liveYes : 1 - liveYes;
  const livePnl = shares * (mark - avgPrice);
  const deltaPP = (mark - avgPrice) * 100;
  const dir: 'up' | 'down' | 'flat' =
    Math.abs(deltaPP) < 0.1 ? 'flat' : deltaPP > 0 ? 'up' : 'down';

  return (
    <li>
      <Link
        href={`/markets/${mk.slug}`}
        className="group flex items-center gap-3 rounded-lg border border-transparent p-1.5 transition hover:border-white/10 hover:bg-white/[0.03]"
      >
        <img
          src={mk.media.poster}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="line-clamp-1 text-sm text-bone">{mk.title}</div>
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
