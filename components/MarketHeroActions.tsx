'use client';

import { useState } from 'react';
import { useToast } from '@/lib/toast';

/**
 * v2.21-7 — Market-detail hero Share button, wired.
 *
 * Previously the Share button on the market-detail hero was a pure
 * <button> with no onClick — dead CTA on the single page VC
 * evaluators spend the most time on. Now:
 *   - Web Share API when available (native iOS / Android sheet).
 *   - Clipboard fallback with toast.
 *   - X.com intent as last resort.
 *
 * Matches the share tier pattern used by FeedDetailSheet (v2.12) so
 * behavior is consistent across every "Share" surface in the app.
 */
export function MarketHeroShare({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const { push } = useToast();
  const [label, setLabel] = useState<'default' | 'copied' | 'shared'>(
    'default'
  );

  const reset = () =>
    window.setTimeout(() => setLabel('default'), 2800);

  const onShare = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/markets/${slug}`
        : `/markets/${slug}`;
    const payload = {
      title,
      text: title,
      url,
    };
    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        (!navigator.canShare || navigator.canShare(payload))
      ) {
        await navigator.share(payload);
        setLabel('shared');
        reset();
        return;
      }
    } catch {
      /* user dismissed — fall through */
    }
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(url);
        setLabel('copied');
        push({ kind: 'trade', title: 'Link copied', body: url });
        reset();
        return;
      }
    } catch {
      /* clipboard unavailable */
    }
    if (typeof window !== 'undefined') {
      const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(
        title
      )}&url=${encodeURIComponent(url)}`;
      window.open(xHref, '_blank', 'noopener,noreferrer');
    }
  };

  const displayLabel =
    label === 'copied' ? 'Copied' : label === 'shared' ? 'Shared' : 'Share';

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label={`Share market: ${title}`}
      className="press rounded-full border border-white/10 bg-ink-900/80 px-3 py-1.5 text-xs font-semibold text-bone backdrop-blur hover:bg-ink-900"
    >
      {displayLabel}
    </button>
  );
}

/**
 * v2.21-7 — Market-detail price-history range selector, wired.
 *
 * Pre-v2.21 the 1D / 1W / 1M / ALL buttons toggled className only
 * — the underlying PriceChart always rendered 30 days. Now each
 * range dispatches a days count to the chart.
 */
const RANGE_DAYS: Record<string, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  ALL: 180,
};
const RANGE_ORDER = ['1D', '1W', '1M', 'ALL'] as const;

export function PriceRangeTabs({
  days,
  onChange,
}: {
  days: number;
  onChange: (d: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900 p-1 text-[11px]">
      {RANGE_ORDER.map((r) => {
        const active = RANGE_DAYS[r] === days;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(RANGE_DAYS[r])}
            aria-pressed={active}
            className={
              active
                ? 'press rounded-full bg-white/10 px-3 py-1 font-semibold text-bone'
                : 'press rounded-full px-3 py-1 font-semibold text-bone-muted hover:text-bone'
            }
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

export function PriceChartWithRange({
  seed,
  Chart,
  heading,
}: {
  seed: number;
  Chart: React.ComponentType<{ seed: number; days: number; stroke?: string }>;
  /**
   * Optional headline element rendered to the left of the range tabs.
   * Passed from the server component so `<h3>` stays part of the
   * static SSR markup + the chart-range state stays client.
   */
  heading?: React.ReactNode;
}) {
  const [days, setDays] = useState(30);
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        {heading ?? <span />}
        <PriceRangeTabs days={days} onChange={setDays} />
      </div>
      <div className="h-64 chart-grid-bg">
        <Chart seed={seed} days={days} />
      </div>
    </>
  );
}
