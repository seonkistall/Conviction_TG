'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useState } from 'react';
import type { Market, Outcome } from '@/lib/types';
import { MultiOutcomeSheet } from './MultiOutcomeSheet';

interface Props {
  market: Market;
  compact?: boolean;
  onPick?: (outcome: Outcome) => void;
  /**
   * v2.26: When true, tapping an outcome opens the inline
   * MultiOutcomeSheet (pick + stake + confirm, no navigation).
   * When false/undefined, keeps the v2.22-1 behavior of navigating
   * to `/markets/[slug]?pick=<id>` — preserved for surfaces (like
   * the market-detail OrderBook area) where the sheet would pile
   * on top of an already-present outcome picker.
   */
  useSheet?: boolean;
}

/**
 * v2.22-1 — Multi-outcome picks no longer call parlay.add (parlay
 * removed). Multi-outcome direct positions need a different entry
 * price per outcome; the OrderBook on market detail handles multi
 * with full context. From here (grid / feed), tapping an outcome
 * navigates into detail with the outcome pre-hinted.
 *
 * v2.26 — Added `useSheet` mode. Feed and markets-grid now open the
 * MultiOutcomeSheet inline (pick + stake + confirm) so the user
 * stays in context; the legacy navigate mode is kept for callers
 * that already live on the detail page.
 */
export function OutcomeBar({
  market,
  compact = false,
  onPick,
  useSheet = false,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialOutcomeId, setInitialOutcomeId] = useState<string | null>(null);

  if (market.kind !== 'multi' || !market.outcomes) return null;
  const total = market.outcomes.reduce((a, o) => a + o.prob, 0) || 1;
  const isResolved = market.status === 'resolved';

  return (
    <div className="space-y-2">
      {/* Stacked probability strip */}
      <div className="flex h-2 overflow-hidden rounded-full bg-ink-900">
        {market.outcomes.map((o, i) => (
          <div
            key={o.id}
            className="h-full"
            style={{
              width: `${(o.prob / total) * 100}%`,
              background: o.color ?? '#7C5CFF',
              opacity: 0.9 - i * 0.04,
            }}
            title={`${o.label} · ${Math.round((o.prob / total) * 100)}%`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div
        className={clsx(
          'grid gap-1.5',
          compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
        )}
      >
        {market.outcomes.slice(0, compact ? 4 : 6).map((o) => {
          // v2.22-1 / v2.26:
          // - resolved multi: still read-only with dim outcomes.
          // - live multi + useSheet: open the inline sheet pre-picked.
          // - live multi + legacy: navigate to /markets/[slug]?pick=id.
          const href = `/markets/${market.slug}?pick=${encodeURIComponent(o.id)}`;
          const label = (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: o.color ?? '#7C5CFF' }}
                />
                <span className="truncate text-[11px] font-medium text-bone">
                  {o.label}
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-bone-muted group-hover:text-bone">
                ¢{Math.round((o.prob / total) * 100)}
              </span>
            </>
          );
          const cls = clsx(
            'group flex items-center justify-between rounded-lg border border-white/10 bg-ink-900/70 px-2.5 py-1.5 text-left backdrop-blur transition',
            isResolved
              ? 'cursor-not-allowed opacity-60'
              : 'hover:border-white/30 hover:bg-ink-900'
          );
          if (isResolved) {
            return (
              <div key={o.id} className={cls}>
                {label}
              </div>
            );
          }
          if (useSheet) {
            return (
              <button
                key={o.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInitialOutcomeId(o.id);
                  setSheetOpen(true);
                  onPick?.(o);
                }}
                className={cls}
              >
                {label}
              </button>
            );
          }
          return (
            <Link
              key={o.id}
              href={href}
              onClick={(e) => {
                e.stopPropagation();
                onPick?.(o);
              }}
              className={cls}
            >
              {label}
            </Link>
          );
        })}
      </div>
      {/*
       * v2.26: The sheet lives inside OutcomeBar so any caller gets
       * the full pick + stake + confirm UI for free. Mounts the sheet
       * only when `useSheet` mode is requested; other callers (the
       * legacy navigate-to-detail flow) pay zero cost.
       */}
      {useSheet && (
        <MultiOutcomeSheet
          market={market}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          initialOutcomeId={initialOutcomeId ?? undefined}
        />
      )}
    </div>
  );
}
