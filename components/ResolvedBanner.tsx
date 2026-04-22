import clsx from 'clsx';
import type { Market } from '@/lib/types';

/**
 * <ResolvedBanner /> — shown at the top of a market detail page once
 * `status === 'resolved'`. Also drives the dimmed-card treatment on
 * list views via a small pill variant.
 *
 * Color rules: YES resolutions use the yes green, NO resolutions use
 * the no red. Multi-outcome resolutions use conviction purple because
 * the winning outcome is the label itself, not a green/red binary.
 */
interface Props {
  market: Market;
  /** Compact chip for card overlays; default is the full page banner. */
  variant?: 'banner' | 'chip';
}

export function ResolvedBanner({ market, variant = 'banner' }: Props) {
  if (market.status !== 'resolved' || !market.resolvedOutcome) return null;

  const outcomeLabel =
    market.resolvedOutcome === 'YES' || market.resolvedOutcome === 'NO'
      ? market.resolvedOutcome
      : market.outcomes?.find((o) => o.id === market.resolvedOutcome)?.label ??
        market.resolvedOutcome;

  const kind =
    market.resolvedOutcome === 'YES'
      ? 'yes'
      : market.resolvedOutcome === 'NO'
      ? 'no'
      : 'multi';

  if (variant === 'chip') {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur',
          kind === 'yes'
            ? 'bg-yes-soft text-yes'
            : kind === 'no'
            ? 'bg-no-soft text-no'
            : 'bg-conviction/20 text-conviction'
        )}
      >
        <span>✓</span>
        <span>Resolved · {outcomeLabel}</span>
      </span>
    );
  }

  const d = market.resolvedAt ? new Date(market.resolvedAt) : null;

  return (
    <div
      role="status"
      className={clsx(
        'mb-6 flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between md:gap-6 md:p-5',
        kind === 'yes'
          ? 'border-yes/30 bg-yes-soft'
          : kind === 'no'
          ? 'border-no/30 bg-no-soft'
          : 'border-conviction/30 bg-conviction/10'
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={clsx(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold',
            kind === 'yes'
              ? 'bg-yes text-ink-900'
              : kind === 'no'
              ? 'bg-no text-ink-900'
              : 'bg-conviction text-bone'
          )}
        >
          ✓
        </span>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            Market resolved
          </div>
          <div className="font-display text-2xl text-bone md:text-3xl">
            {outcomeLabel}
            <span className="ml-2 font-mono text-lg text-bone-muted">
              ¢{Math.round((market.closePrice ?? 0) * 100)}
            </span>
          </div>
          {market.resolutionNote && (
            <p className="mt-1 max-w-xl text-sm leading-snug text-bone-muted">
              {market.resolutionNote}
            </p>
          )}
        </div>
      </div>
      {d && (
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            Settled at
          </div>
          <div className="font-mono text-sm tabular-nums text-bone">
            {d.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
