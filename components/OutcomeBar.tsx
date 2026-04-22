'use client';

import clsx from 'clsx';
import type { Market, Outcome } from '@/lib/types';
import { useParlay } from '@/lib/parlay';

interface Props {
  market: Market;
  compact?: boolean;
  onPick?: (outcome: Outcome) => void;
}

export function OutcomeBar({ market, compact = false, onPick }: Props) {
  const parlay = useParlay();
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
        {market.outcomes.slice(0, compact ? 4 : 6).map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={isResolved}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isResolved) return;
              onPick?.(o);
              parlay.add({
                marketId: market.id,
                pick: o.id,
                price: o.prob / total,
              });
            }}
            className={clsx(
              'group flex items-center justify-between rounded-lg border border-white/10 bg-ink-900/70 px-2.5 py-1.5 text-left backdrop-blur transition',
              isResolved
                ? 'cursor-not-allowed opacity-60'
                : 'hover:border-white/30 hover:bg-ink-900'
            )}
          >
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
          </button>
        ))}
      </div>
    </div>
  );
}
