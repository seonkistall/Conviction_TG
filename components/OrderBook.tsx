'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';

interface Props {
  yesProb: number;
  /** Passed by the market detail page so the toast can link back. */
  marketId?: string;
  marketTitle?: string;
  /** Market slug — required for the Share CTA post-trade. */
  marketSlug?: string;
  /** When true, the book collapses to a read-only "settled" notice. */
  resolved?: boolean;
  /** Fallback callback if a parent wants to override the buy handler. */
  onBuy?: (side: 'YES' | 'NO', shares: number, price: number) => void;
}

/**
 * v2.18-1 — Post-trade retention state.
 *
 * Through v2.17 the only post-trade feedback was a 2.8s toast. A new user
 * would buy, see the flash, then be left staring at the same trade form
 * with no clear "what's next?" — the drop-off point flagged in the UX
 * audit as "no post-bet momentum".
 *
 * We now latch a `justBought` snapshot in local state after a successful
 * buy and render a confirmation card *in-place* over the trade form:
 *   - Position summary (side · shares · avg price · max return).
 *   - Three next-step CTAs: Share this market, View portfolio,
 *     Find similar.
 *   - A "Place another" reset button that clears the latch and brings
 *     the trade form back.
 *
 * This is the demo story: evaluator clicks Buy, sees the confirmation,
 * has three clear next-steps in front of them instead of the trade form
 * they've just used.
 */
interface LastTrade {
  side: 'YES' | 'NO';
  shares: number;
  price: number;
  at: number;
}

export function OrderBook({
  yesProb,
  marketId,
  marketTitle,
  marketSlug,
  resolved = false,
  onBuy,
}: Props) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [shares, setShares] = useState(100);
  const [pulse, setPulse] = useState(false);
  const [justBought, setJustBought] = useState<LastTrade | null>(null);

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

  if (resolved) {
    return (
      <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-bone-muted">
            Market settled
          </h3>
          <div className="text-[11px] text-bone-muted">Trading closed</div>
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-ink-900 p-4 text-sm text-bone-muted">
          This market has resolved. See the resolution banner above for the
          winning outcome and payout. Any open positions can be closed from{' '}
          <a href="/portfolio" className="text-volt underline underline-offset-2">
            your portfolio
          </a>
          .
        </div>
      </div>
    );
  }

  // v2.18-1 — Post-trade confirmation card. Short-circuits the trade form
  // render path so the user sees exactly one piece of UI at a time: either
  // "place a trade" or "trade placed, here's what's next".
  if (justBought) {
    const jbMaxReturn = justBought.shares;
    return (
      <div className="rounded-2xl border border-yes/40 bg-gradient-to-br from-yes/10 via-ink-800 to-ink-800 p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-yes">
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-yes text-[10px] font-bold text-ink-900"
            >
              ✓
            </span>
            Position placed
          </h3>
          <div className="text-[11px] text-bone-muted">
            {justBought.side} · just now
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-ink-900 p-4 font-mono text-sm tabular-nums">
          <div className="flex items-baseline justify-between">
            <span className="text-bone-muted text-[11px] uppercase tracking-widest">
              Shares
            </span>
            <span className="text-bone">
              {justBought.shares.toLocaleString()} {justBought.side}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-bone-muted text-[11px] uppercase tracking-widest">
              Avg price
            </span>
            <span className="text-bone">
              ¢{Math.round(justBought.price * 100)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-bone-muted text-[11px] uppercase tracking-widest">
              Max return
            </span>
            <span className="text-yes">
              ${jbMaxReturn.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Three next-step CTAs — the heart of the retention loop. */}
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={handleSharePostTrade}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-ink-900 py-2.5 text-sm font-semibold text-bone hover:bg-ink-700"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share your pick
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/portfolio"
              className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-ink-900 py-2.5 text-sm font-semibold text-bone hover:bg-ink-700"
            >
              View portfolio →
            </Link>
            <a
              href="#related"
              className="flex items-center justify-center gap-1 rounded-lg border border-conviction/40 bg-conviction/10 py-2.5 text-sm font-semibold text-conviction hover:bg-conviction/20"
            >
              Find similar ↓
            </a>
          </div>
          <button
            type="button"
            onClick={() => setJustBought(null)}
            className="mt-1 text-center text-[11px] font-semibold uppercase tracking-widest text-bone-muted hover:text-bone"
          >
            Place another trade
          </button>
        </div>
      </div>
    );
  }

  function handleBuy() {
    if (onBuy) onBuy(side, shares, price);
    if (marketId) {
      positions.buy({ marketId, side, shares, price });
      // v2.19-1: Trimmed. The PostTradeCard that renders in place right
      // after this dispatch already owns "View position" / "Share" /
      // "Find similar" CTAs — having the same CTA on a 2.8s-flash toast
      // duplicated the nudge and made the confirmation card feel
      // redundant. Toast is now a compact "Placed" ack; the card does
      // the actual next-step work.
      push({
        kind: 'trade',
        title: `${side} · ${shares.toLocaleString()} placed`,
        body: `Filled @ ¢${Math.round(price * 100)}`,
        amount: `-$${cost.toFixed(2)}`,
      });
      setPulse(true);
      window.setTimeout(() => setPulse(false), 400);
      setJustBought({ side, shares, price, at: Date.now() });
    }
  }

  // v2.18-1: post-trade shareable URL. Defaults to current path so the
  // Share button works even when marketSlug prop wasn't threaded in.
  const shareUrl =
    typeof window !== 'undefined'
      ? marketSlug
        ? `${window.location.origin}/markets/${marketSlug}`
        : window.location.href
      : marketSlug
        ? `/markets/${marketSlug}`
        : '';

  async function handleSharePostTrade() {
    const data = {
      title: marketTitle ?? 'Conviction',
      text: marketTitle
        ? `Just took ${justBought?.side} on "${marketTitle}" @ ¢${Math.round((justBought?.price ?? 0) * 100)}`
        : 'Conviction',
      url: shareUrl,
    };
    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        (!navigator.canShare || navigator.canShare(data))
      ) {
        await navigator.share(data);
        push({ kind: 'trade', title: 'Shared', body: shareUrl });
        return;
      }
    } catch {
      /* user dismissed native share sheet — fall through */
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        push({ kind: 'trade', title: 'Link copied', body: shareUrl });
      }
    } catch {
      /* clipboard unavailable — silently no-op; the toast is nice-to-have */
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
