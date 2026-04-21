'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  yesProb: number;
  onBuy?: (side: 'YES' | 'NO', shares: number, price: number) => void;
}

export function OrderBook({ yesProb }: Props) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [shares, setShares] = useState(100);

  const price = side === 'YES' ? yesProb : 1 - yesProb;
  const cost = shares * price;
  const maxReturn = shares; // 1:1 payout on resolve

  const yesCents = Math.round(yesProb * 100);
  const noCents = 100 - yesCents;

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
          >
            −
          </button>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(Math.max(1, +e.target.value || 1))}
            className="flex-1 bg-transparent py-3 text-center font-mono text-xl tabular-nums text-bone focus:outline-none"
          />
          <button
            onClick={() => setShares((x) => x + 10)}
            className="text-xl text-bone-muted hover:text-bone"
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

      <button
        className={clsx(
          'mt-5 w-full rounded-lg py-3.5 text-sm font-bold uppercase tracking-widest transition',
          side === 'YES'
            ? 'bg-yes text-ink-900 hover:bg-yes/90'
            : 'bg-no text-ink-900 hover:bg-no/90'
        )}
      >
        Buy {side} · ${cost.toFixed(2)}
      </button>

      <p className="mt-3 text-center text-[11px] text-bone-muted">
        Connect wallet to trade · KRW/JPY/USDT on-ramps live
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
