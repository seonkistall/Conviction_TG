/**
 * v2.28.1 — Custom performance marks for the 30-second wow funnel.
 *
 * Vercel SpeedInsights captures generic Web Vitals (LCP, FID, CLS,
 * TTFB) but those are page-level. The metrics that matter for the VC
 * pitch deck are funnel-level:
 *
 *   tg-app-ready    — TG WebApp.ready() returned (Adapter mounted)
 *   first-market    — first MarketCard / featured slot visible
 *   buy-modal-open  — TG Mini App user opened the buy sheet
 *   bet-placed      — confirm clicked, position recorded
 *
 * These marks land in window.performance and are queryable via
 *   performance.getEntriesByType('mark')
 *
 * The Sentry SpanContext export below means a future Sentry/Datadog
 * RUM integration can pull these into a single trace per session
 * with no further code changes.
 */

const MARKED = new Set<string>();

export function mark(name: string): number | null {
  if (typeof performance === 'undefined') return null;
  if (MARKED.has(name)) return null; // first occurrence wins
  MARKED.add(name);
  try {
    performance.mark(name);
    const entry = performance.getEntriesByName(name).pop();
    return entry ? entry.startTime : null;
  } catch {
    return null;
  }
}

/**
 * Time elapsed (ms) between two marks. Useful for client-side
 * dashboard rendering ("First bet in 28.4s").
 */
export function elapsed(from: string, to: string): number | null {
  if (typeof performance === 'undefined') return null;
  const f = performance.getEntriesByName(from).pop();
  const t = performance.getEntriesByName(to).pop();
  if (!f || !t) return null;
  return Math.max(0, t.startTime - f.startTime);
}

/** Conviction-specific named marks. Keep this list in sync with the funnel. */
export const PERF_MARKS = {
  tgReady:       'cv:tg-app-ready',
  firstMarket:   'cv:first-market',
  buyModalOpen:  'cv:buy-modal-open',
  betPlaced:     'cv:bet-placed',
} as const;

/**
 * Convenience: the canonical "time-to-first-bet" the deck quotes.
 * Returns null if the user hasn't reached betPlaced yet.
 */
export function timeToFirstBet(): number | null {
  return elapsed(PERF_MARKS.tgReady, PERF_MARKS.betPlaced);
}
