'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import type { Market, Outcome } from '@/lib/types';
import { formatUSD, timeUntil } from '@/lib/format';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';
import { STAKE_PRESETS, DEFAULT_STAKE_USD, type StakePreset } from '@/lib/constants';

/**
 * v2.26 — Multi-outcome order sheet.
 *
 * Mirrors FeedDetailSheet for binary markets, but for categorical
 * (N-outcome) markets like the Korean presidential election or
 * LoL Worlds winner. Users see:
 *   - Every outcome with its live implied probability.
 *   - A single selection (only one outcome at a time — multi-leg
 *     parlays were removed in v2.22).
 *   - Stake chooser ($5 / $10 / $25 / $100).
 *   - Confirm button that dispatches `positions.buy` with the
 *     outcome id as `side` and the outcome label denormalized for
 *     the portfolio renderer.
 *
 * v2.26 widened PortfolioPosition.side to `'YES' | 'NO' | string`
 * precisely so this sheet can write outcome ids as positions
 * without a schema fork. Merging rules (mergePosition in
 * lib/positions.tsx) still key on `(marketId, side)`, so buying
 * "Rebuild Korea" twice on the Korean election merges into a
 * single entry — exactly the binary behavior, extended.
 *
 * Open/close wiring is the parent's responsibility (OutcomeBar).
 */
interface Props {
  market: Market;
  open: boolean;
  onClose: () => void;
  /** Pre-selected outcome id when opened from a specific chip tap. */
  initialOutcomeId?: string;
}

export function MultiOutcomeSheet({
  market,
  open,
  onClose,
  initialOutcomeId,
}: Props) {
  const positions = usePositions();
  const toast = useToast();
  const [pickedId, setPickedId] = useState<string | null>(initialOutcomeId ?? null);
  const [stakeUsd, setStakeUsd] = useState<StakePreset>(DEFAULT_STAKE_USD);

  useEffect(() => {
    if (open) {
      setPickedId(initialOutcomeId ?? null);
      setStakeUsd(DEFAULT_STAKE_USD);
    }
  }, [open, initialOutcomeId]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  if (market.kind !== 'multi' || !market.outcomes) return null;

  const total = market.outcomes.reduce((a, o) => a + o.prob, 0) || 1;
  const picked: Outcome | null = pickedId
    ? market.outcomes.find((o) => o.id === pickedId) ?? null
    : null;
  const pickedPrice = picked ? picked.prob / total : 0;
  const shares = picked
    ? Math.max(1, Math.round(stakeUsd / Math.max(pickedPrice, 0.02)))
    : 0;

  const commit = () => {
    if (!picked) return;
    const price = pickedPrice;
    if (price <= 0 || price >= 1) return;
    positions.buy({
      marketId: market.id,
      side: picked.id,
      outcomeLabel: picked.label,
      shares,
      price,
    });
    toast.push({
      kind: 'trade',
      title: `${picked.label} · ${shares} shares placed`,
      body: market.title,
      amount: `-$${(shares * price).toFixed(2)}`,
      cta: { href: '/portfolio', label: 'View' },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`${market.title} — outcome picker`}
    >
      {/* Blur backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/55 backdrop-blur-md"
        aria-label="Close outcome picker"
        tabIndex={-1}
      />

      {/* Bottom sheet, centered on desktop */}
      <div
        className={clsx(
          'sheet-up absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-800 p-5 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] shadow-[0_-20px_60px_rgba(0,0,0,0.6)]',
          'md:left-1/2 md:right-auto md:bottom-6 md:w-[460px] md:max-h-[80dvh] md:-translate-x-1/2 md:rounded-3xl md:border'
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="rounded-full bg-conviction/20 px-2 py-0.5 font-semibold uppercase tracking-widest text-conviction">
                {market.outcomes.length}-way
              </span>
              <span className="text-bone-muted">{market.category}</span>
              <span className="text-bone-muted">·</span>
              <span className="text-bone-muted">{market.region}</span>
            </div>
            <h2 className="mt-2 font-display text-xl leading-tight text-bone">
              {market.title}
            </h2>
            <div className="mt-1 text-[11px] text-bone-muted">
              Closes {timeUntil(market.endsAt)} · {formatUSD(market.volume)} Vol
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-ink-900 text-bone-muted hover:text-bone"
            aria-label="Close outcome picker"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Outcome list — one selectable chip per outcome */}
        <ul className="mt-4 space-y-1.5">
          {market.outcomes.map((o) => {
            const prob = o.prob / total;
            const cents = Math.round(prob * 100);
            const selected = o.id === pickedId;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setPickedId(o.id)}
                  aria-pressed={selected}
                  className={clsx(
                    'group flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition',
                    selected
                      ? 'border-volt bg-volt/10 ring-2 ring-volt/40'
                      : 'border-white/10 bg-ink-900/70 hover:border-white/30 hover:bg-ink-900'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: o.color ?? '#7C5CFF' }}
                    />
                    <span className="truncate text-sm font-medium text-bone">
                      {o.label}
                    </span>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-bone">
                    ¢{cents}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Stake chooser + confirm */}
        <div className="mt-4 rounded-xl border border-white/10 bg-ink-900/60 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest">
            <span className="text-bone-muted">Stake</span>
            <span className="font-mono text-bone">
              ${stakeUsd}
              {picked && (
                <span className="ml-2 text-bone-muted">
                  → {shares} shares of {picked.label}
                </span>
              )}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {STAKE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setStakeUsd(p)}
                aria-pressed={stakeUsd === p}
                className={clsx(
                  'rounded-lg border px-2 py-2 text-sm font-semibold tabular-nums transition',
                  stakeUsd === p
                    ? 'border-volt bg-volt/15 text-volt'
                    : 'border-white/10 bg-ink-800 text-bone-muted hover:text-bone'
                )}
              >
                ${p}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              disabled={!picked}
              onClick={commit}
              className={clsx(
                'flex items-center justify-center rounded-full px-4 py-3 text-sm font-bold transition',
                picked
                  ? 'bg-volt text-ink-900 hover:bg-volt-dark active:scale-[0.98]'
                  : 'cursor-not-allowed bg-white/5 text-bone-muted'
              )}
            >
              {picked
                ? `Confirm ${picked.label} · $${stakeUsd}`
                : 'Pick an outcome'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-ink-800 px-4 py-3 text-sm font-semibold text-bone hover:bg-ink-700"
            >
              Cancel
            </button>
          </div>
        </div>

        <Link
          href={`/markets/${market.slug}`}
          className="mt-3 block rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-center text-sm font-semibold text-bone transition hover:bg-ink-700"
        >
          View full market →
        </Link>
      </div>
    </div>
  );
}
