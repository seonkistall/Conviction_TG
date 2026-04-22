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
    </span>
  );
}
