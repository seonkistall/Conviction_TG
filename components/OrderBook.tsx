'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';

interface Props {
  yesProb: number;
  /** Passed by the market detail page so the toast can link back. */
  marketId?: string;
  marketTitle?: string;
  /** Fallback callback if a parent wants to override the buy handler. */
  onBuy?: (side: 'YES' | 'NO', shares: number, price: number) => void;
}

export function OrderBook({ yesProb, marketId, marketTitle, onBuy }: Props) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [shares, setShares] = useState(100);
  const [pulse, setPulse] = useState(false);

  const positions = usePositions();
  const { push } = useToast();

  const price = side === 'YES' ? yesProb : 1 - yesProb;
  const cost = shares * price;
  const maxReturn = shares; // 1:1 payout on resolve

  const yesCents = Math.round(yesProb * 100);
  const noCents = 100 - yesCents;

  // User's existing position on the selected side (if any) — used for the
  // "You hold N shares @ ¢X" hint that nudges averaging-down/up behavior.
  const existing = marketId ? positions.positionOn(marketId, side) : null;

  function handleBuy() {
    if (onBuy) onBuy(side, shares, price);
    if (marketId) {
      positions.buy({ marketId, side, shares, price });
      push({
        kind: 'trade',
        title: `Bought ${side} · ${shares.toLocaleString()} shares${
          marketTitle ? ` · ${marketTitle}` : ''
        }`,
        body: `Filled @ ¢${Math.round(price * 100)} · Max return $${maxReturn.toFixed(2)}`,
        amount: `-$${cost.toFixed(2)}`,
        cta: { href: '/portfolio', label: 'View position' },
      });
      setPulse(true);
      window.setTimeout(() => setPulse(false), 400);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-bone-muted">
          Place trade
        </h3>
        <div className="text-[11px] text-bone-muted">
          Fee 1.5% · Resolves on-chain
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide('YES')}
          className={clsx(
            'rounded-lg border py-4 text-center transition',
            side === 'YES'
              ? 'border-yes bg-yes-soft'
              : 'border-white/10 hover:border-yes/60'
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            Yes
          </div>
          <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-yes">
            ¢{yesCents}
          </div>
        </button>
        <button
          onClick={() => setSide('NO')}
          className={clsx(
            'rounded-lg border py-4 text-center transition',
            side === 'NO'
              ? 'border-no bg-no-soft'
              : 'border-white/10 hover:border-no/60'
          )}
        >
          <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            No
          </div>
          <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-no">
            ¢{noCents}
          </div>
        </button>
      </div>

      <div className="mt-5">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
          Shares
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900 px-3">
          <button
            onClick={() => setShares((x) => Math.max(1, x - 10))}
            className="text-xl text-bone-muted hover:text-bone"
            aria-label="Decrease shares by 10"
          >
            −
          </button>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(Math.max(1, +e.target.value || 1))}
            className="flex-1 bg-transparent py-3 text-center font-mono text-xl tabular-nums text-bone focus:outline-none"
            aria-label="Number of shares"
          />
          <button
            onClick={() => setShares((x) => x + 10)}
            className="text-xl text-bone-muted hover:text-bone"
            aria-label="Increase shares by 10"
          >
            +
          </button>
        </div>
        <div className="mt-2 flex gap-1">
          {[10, 50, 100, 500, 1000].map((q) => (
            <button
              key={q}
              onClick={() => setShares(q)}
              className="flex-1 rounded-md border border-white/10 bg-ink-900 py-1 text-[11px] text-bone-muted hover:border-white/20 hover:text-bone"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2 rounded-lg border border-white/10 bg-ink-900 p-3 font-mono text-[13px] tabular-nums">
        <Row k="Cost" v={`$${cost.toFixed(2)}`} />
        <Row k="Avg price" v={`¢${Math.round(price * 100)}`} />
        <Row
          k="Max return"
          v={`$${maxReturn.toFixed(2)}`}
          accent="text-yes"
        />
        <Row
          k="Potential profit"
          v={`+$${(maxReturn - cost).toFixed(2)}`}
          accent="text-volt"
        />
      </div>

      {existing && (
        <div className="mt-3 rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-[11px] text-bone-muted">
          You already hold{' '}
          <span className="font-mono text-bone">
            {existing.shares.toLocaleString()}
          </span>{' '}
          {side} shares @ ¢{Math.round(existing.avgPrice * 100)}. New buy will
          average in.
        </div>
      )}

      <button
        type="button"
        onClick={handleBuy}
        className={clsx(
          'mt-5 w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition',
          side === 'YES'
            ? 'bg-yes text-ink-900 hover:bg-yes/90'
            : 'bg-no text-ink-900 hover:bg-no/90',
          pulse && 'scale-[0.98]'
        )}
      >
        Buy {side} · ${cost.toFixed(2)}
      </button>

      <p className="mt-3 text-center text-[11px] text-bone-muted">
        Mock fills · positions persist locally · on-chain settlement post-MVP
      </p>
    </div>
  );
}

function Row({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-bone-muted">{k}</span>
      <span className={accent || 'text-bone'}>{v}</span>
    </div>
  );
}
