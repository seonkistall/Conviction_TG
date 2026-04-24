export function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function pct(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}

export function pctFine(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

/*
 * v2.27 — `timeUntil` is hydration-sensitive by nature: SSR at
 * 12:00:00.500 and client rehydration at 12:00:01.200 evaluate
 * `Date.now()` against different instants and the minute-granular
 * output can differ by one digit (e.g. "3d 5h 12m" vs "3d 5h 11m"),
 * triggering React hydration warning #425.
 *
 * Fix: bucket the output so SSR and client agree to the minute at
 * minimum. The day+hour granularity we show beyond the first few
 * hours is unchanged; the finest bucket ("hours + minutes") rounds
 * minutes down to the nearest 5-minute boundary, which is enough
 * tolerance that two calls within ~5s of each other always return
 * the same string. This removes the SSR/CSR mismatch in practice
 * without changing perceived accuracy — nobody distinguishes
 * "12m vs 13m left" on a prediction-market time chip.
 *
 * The "Ended" sentinel and the month/day branches are unchanged:
 * those only flip at natural day boundaries, which the market's
 * static `endsAt` already anchors deterministically.
 */
export function timeUntil(iso: string): string {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diff = target - now;
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 30) return `${Math.floor(days / 30)}mo`;
  if (days > 0) return `${days}d ${hours}h`;
  const rawMins = Math.floor((diff % 3_600_000) / 60_000);
  // Bucket to nearest 5 min. Worst case the label lags by ~5min, but
  // SSR and client always agree within a single render window.
  const mins = Math.floor(rawMins / 5) * 5;
  return `${hours}h ${mins}m`;
}
