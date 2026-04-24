'use client';

import clsx from 'clsx';
import { useLivePrice } from '@/lib/livePrices';
import { usePriceFlicker } from '@/lib/usePriceFlicker';

interface Props {
  marketId: string;
  /** SSR-safe seed. Used until the provider's first tick hydrates. */
  seed: number;
  /**
   * Render format. 'percent' → "58%", 'cents' → "¢58", 'raw' → 0.58.
   */
  format?: 'percent' | 'cents' | 'raw';
  className?: string;
  /** Precision for 'raw' mode; ignored otherwise. */
  precision?: number;
  /**
   * v2.25: When true, render a tiny ▲/▼ glyph after the number that
   * appears for ~600ms whenever the price ticks. Polymarket-/Kalshi-
   * style direction indicator — at-a-glance "this market moves"
   * signal without needing to stare at the digits. Off by default
   * to preserve the quiet single-tick behavior on cards where the
   * number change itself is the signal.
   */
  showDirection?: boolean;
}

/**
 * Displays a market's live yesProb with a brief green/red flicker each
 * time it ticks. Server-renders the seed so there's no hydration mismatch.
 *
 * Pair with <LivePricesProvider /> at the app root.
 */
export function LivePrice({
  marketId,
  seed,
  format = 'percent',
  className,
  precision = 2,
  showDirection = false,
}: Props) {
  const value = useLivePrice(marketId, seed);
  const dir = usePriceFlicker(value);

  let text: string;
  if (format === 'percent') text = `${Math.round(value * 100)}%`;
  else if (format === 'cents') text = `¢${Math.round(value * 100)}`;
  else text = value.toFixed(precision);

  return (
    <span
      className={clsx(
        'font-mono tabular-nums transition-colors duration-500',
        dir === 'up' && 'text-yes',
        dir === 'down' && 'text-no',
        className
      )}
      data-dir={dir ?? 'flat'}
      aria-live="off"
    >
      {text}
      {showDirection && dir && (
        <span
          aria-hidden="true"
          className={clsx(
            'ml-1 inline-block text-[0.6em] align-middle transition-opacity duration-500',
            dir === 'up' ? 'text-yes' : 'text-no'
          )}
          // The flicker hook nulls `dir` after a beat, so the glyph
          // fades out alongside the digits' color flash without
          // needing its own timer. Inline-block + align-middle keeps
          // the baseline aligned with the digits regardless of font.
        >
          {dir === 'up' ? '▲' : '▼'}
        </span>
      )}
    </span>
  );
}
