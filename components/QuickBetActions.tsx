'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { useParlay } from '@/lib/parlay';

/**
 * v2.11 — Inline one-tap YES/NO buttons for MarketCard on the markets grid.
 *
 * Prior to v2.11 the card's YES/NO strip was a decorative <div> nested
 * inside the surrounding <Link> to `/markets/[slug]`. Clicking any part of
 * the card — including the price chip — navigated to detail, which forced a
 * full-page transition before the user could place a trade. Dev feedback
 * #1 called this out: phone users decide in 10–20s and expect to act from
 * the first screen.
 *
 * This component replaces those decorative chips with real <button>s that:
 *   1. preventDefault + stopPropagation so the parent <Link> doesn't
 *      navigate when YES/NO is tapped.
 *   2. Call parlay.add() directly — the Parlay Slip drawer then auto-opens
 *      via the reducer's `open: true` side-effect in ADD.
 *
 * We keep the price/side chip layout identical to the old QuickAction so
 * existing visual regression baselines don't flap. The only behavioral
 * change is that the buttons now actually do something.
 *
 * Note: <button> nested inside <Link> is not strictly valid HTML, but every
 * browser in use handles it correctly when the inner button calls
 * preventDefault. React/Next.js explicitly support this pattern.
 */
interface Props {
  marketId: string;
  yesProb: number;
}

export function QuickBetActions({ marketId, yesProb }: Props) {
  const parlay = useParlay();
  const inParlay = parlay.hasLeg(marketId);
  // v2.12 — pulse micro-interaction. Tracked per-side so tapping YES
  // doesn't briefly light NO. Double-rAF is how we retrigger a CSS
  // keyframe on rapid repeat taps without unmounting the button.
  const [pulse, setPulse] = useState<'YES' | 'NO' | null>(null);

  const handle = (pick: 'YES' | 'NO', price: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPulse(null);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setPulse(pick))
    );
    window.setTimeout(() => setPulse((p) => (p === pick ? null : p)), 420);
    parlay.add({ marketId, pick, price });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={handle('YES', yesProb)}
        className={clsx(
          'flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-bold uppercase tracking-widest backdrop-blur transition active:scale-[0.97]',
          'border-yes/40 bg-yes-soft text-yes hover:bg-yes/20',
          inParlay && 'ring-1 ring-yes/60',
          pulse === 'YES' && 'animate-bet-pulse'
        )}
        aria-label={`Buy YES at ${Math.round(yesProb * 100)} cents`}
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
      >
        <span>NO</span>
        <span className="font-mono tabular-nums">¢{Math.round((1 - yesProb) * 100)}</span>
      </button>
    </div>
  );
}
