'use client';

import clsx from 'clsx';

interface Props {
  pp: number; // percentage-point delta between AI confidence and market price
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Shown when Conviction AI thinks the market is mispriced by ≥ `threshold` pp.
 * This is the visible symbol of Conviction's AI alpha — it's what makes
 * culture markets feel like a real quant edge.
 */
export function EdgeBadge({ pp, className = '', size = 'sm' }: Props) {
  if (pp < 5) return null;
  const sign = pp >= 0 ? '+' : '';
  return (
    <span
      className={clsx(
        'edge-glow inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-widest',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
      title={`Conviction AI sees ${sign}${pp}pp mispricing`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      {sign}
      {pp}
      pp
    </span>
  );
}
