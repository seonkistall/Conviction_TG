'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';

/**
 * v2.22-1 — Direct-buy quick-trade buttons.
 *
 * Through v2.21 these dispatched `parlay.add()` into the parlay store.
 * Parlay was confusing users in discovery and diluting the product's
 * direct-trade positioning, so the whole surface was removed in v2.22.
 *
 * Tap YES/NO now places a small direct position — a $10 stake worth
 * of shares at the current price, filled immediately into the
 * PositionsProvider. Toast acks the fill; heavier customization
 * (shares, stake size) stays on the market detail OrderBook.
 *
 * Keeps the preventDefault+stopPropagation pattern so the parent
 * <Link> to /markets/[slug] on MarketCard doesn't navigate mid-tap.
 *
 * Layout/class list unchanged so existing visual regression baselines
 * and the card's Y/N color semantics stay stable.
 */
const QUICK_STAKE_USD = 10;

interface Props {
  marketId: string;
  yesProb: number;
  /** Present on MarketCard — lets us include title in the toast. */
  marketTitle?: string;
}

export function QuickBetActions({ marketId, yesProb, marketTitle }: Props) {
  const positions = usePositions();
  const toast = useToast();
  const [pulse, setPulse] = useState<'YES' | 'NO' | null>(null);

  const handle = (pick: 'YES' | 'NO', price: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPulse(null);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPulse(pick))
    );
    window.setTimeout(() => setPulse((p) => (p === pick ? null : p)), 420);

    // Derive share count from the $10 quick stake. positions.buy
    // validates shares > 0 and price in (0, 1), so guard the edge
    // cases here before dispatching.
    if (price <= 0 || price >= 1) return;
    const shares = Math.max(1, Math.round(QUICK_STAKE_USD / price));
    positions.buy({ marketId, side: pick, shares, price });
    toast.push({
      kind: 'trade',
      title: `${pick} · ${shares} shares placed`,
      body: marketTitle ?? 'Position opened',
      amount: `-$${(shares * price).toFixed(2)}`,
      cta: { href: '/portfolio', label: 'View' },
    });
  };

  const hasPosition = positions.hasPosition(marketId);

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={handle('YES', yesProb)}
        className={clsx(
          'flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-bold uppercase tracking-widest backdrop-blur transition active:scale-[0.97]',
          'border-yes/40 bg-yes-soft text-yes hover:bg-yes/20',
          hasPosition && 'ring-1 ring-yes/60',
          pulse === 'YES' && 'animate-bet-pulse'
        )}
        aria-label={`Buy YES at ${Math.round(yesProb * 100)} cents`}
        title={`$${QUICK_STAKE_USD} stake → ${Math.max(1, Math.round(QUICK_STAKE_USD / yesProb))} YES shares`}
      >
        <span>YES</span>
        <span className="font-mono tabular-nums">¢{Math.round(yesProb * 100)}</span>
      </button>
      <button
        type="button"
        onClick={handle('NO', 1 - yesProb)}
        className={clsx(
          'flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-bold uppercase tracking-widest backdrop-blur transition active:scale-[0.97]',
          'border-no/40 bg-no-soft text-no hover:bg-no/20',
          pulse === 'NO' && 'animate-bet-pulse'
        )}
        aria-label={`Buy NO at ${Math.round((1 - yesProb) * 100)} cents`}
        title={`$${QUICK_STAKE_USD} stake → ${Math.max(1, Math.round(QUICK_STAKE_USD / (1 - yesProb)))} NO shares`}
      >
        <span>NO</span>
        <span className="font-mono tabular-nums">¢{Math.round((1 - yesProb) * 100)}</span>
      </button>
    </div>
  );
}
