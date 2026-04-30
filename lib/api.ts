/**
 * v2.28.2 — Conviction API client (P2 baby step).
 *
 * Today the entire app reads markets directly from `lib/markets.ts`
 * (60 KB of fixture data). When backend lands in Sprint-2 we want to
 * swap to a real REST/edge endpoint without touching every consumer.
 *
 * This module is the swap point. Callers do:
 *
 *   import { listMarkets, getMarketDetail } from '@/lib/api';
 *   const markets = await listMarkets({ region: 'kr', limit: 12 });
 *
 * Implementation today: returns the fixture in a Promise so the
 * call-site is already async, which is the only behavioural change
 * the future swap will require. SSR / RSC consumers that read at
 * render time use the synchronous fixture re-exports unchanged
 * (those will move when the backend is ready).
 *
 * Implementation tomorrow:
 *   - When NEXT_PUBLIC_API_BASE_URL is set, fetch() it. Otherwise
 *     fall through to the fixture (so dev / preview / VC demo
 *     continue working without a backend).
 *   - HTTP errors map to thrown ApiError with status + body.
 *   - 30s edge cache via Next's `fetch(..., { next: { revalidate: 30 } })`.
 *
 * Why a baby step now: every component we touch in Sprint-1.x to
 * fetch from this module instead of importing `MARKETS` saves a
 * future migration sweep. We migrate one consumer in this PR
 * (`TrendingStrip`) as the proof.
 */

import {
  MARKETS,
  TRENDING_MARKETS,
  LIVE_MARKETS,
  RESOLVED_MARKETS,
  getMarket,
  regionPreferred,
  type RegionKey,
} from './markets';
import type { Market } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(public status: number, public body: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Wrap a fetch call with the standard headers + edge revalidate.
 * Returns parsed JSON or throws ApiError.
 *
 * Today this is unused — when API_BASE is empty we fall through to
 * fixture in each function below. When backend is wired this becomes
 * the only network path.
 */
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    // Next 14: 30-second edge cache when API_BASE is on the same
    // hostname; bypassed via cache: 'no-store' for live trade routes.
    next: init?.cache === 'no-store' ? undefined : { revalidate: 30 },
  });
  if (!r.ok) {
    const body = await r.text();
    throw new ApiError(r.status, body, `${r.status} ${url}`);
  }
  return (await r.json()) as T;
}

// -- Public API ---------------------------------------------------------

export interface ListMarketsOptions {
  /** Cap returned items. Defaults to all. */
  limit?: number;
  /** Filter to one of the live status values. */
  status?: 'live' | 'closing-soon' | 'resolving' | 'resolved' | 'all';
  /** Optional category filter. */
  category?: string;
  /** When set, regionally reorder using regionPreferred() before slicing. */
  region?: RegionKey;
  /** When true, show only the curated trending subset. */
  trendingOnly?: boolean;
}

export async function listMarkets(opts: ListMarketsOptions = {}): Promise<Market[]> {
  if (API_BASE) {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.status) qs.set('status', opts.status);
    if (opts.category) qs.set('category', opts.category);
    if (opts.region) qs.set('region', opts.region);
    if (opts.trendingOnly) qs.set('trending', '1');
    return api<Market[]>(`/markets?${qs.toString()}`);
  }

  // Fixture path — exercise the same filter shape locally.
  let pool: Market[] = opts.trendingOnly ? TRENDING_MARKETS : MARKETS;
  if (opts.status === 'resolved') pool = RESOLVED_MARKETS;
  else if (opts.status && opts.status !== 'all') pool = pool.filter((m) => m.status === opts.status);
  else if (!opts.status) pool = pool.filter((m) => m.status !== 'resolved');
  if (opts.category) pool = pool.filter((m) => m.category === opts.category);
  if (opts.region) pool = regionPreferred(pool, opts.region);
  if (opts.limit) pool = pool.slice(0, opts.limit);
  return Promise.resolve(pool);
}

export async function getMarketDetail(slug: string): Promise<Market | null> {
  if (API_BASE) {
    try {
      return await api<Market>(`/markets/${encodeURIComponent(slug)}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
  return Promise.resolve(getMarket(slug) ?? null);
}

/**
 * Live aggregate metrics for the home hero counters. Fixture path
 * derives from MARKETS; backend path will hit a /metrics route that
 * is computed at the edge from a 1-minute volume rollup.
 */
export interface MarketsSummary {
  marketsLive: number;
  volume24h: number;
  aiAccuracy: number;
}

export async function getMarketsSummary(): Promise<MarketsSummary> {
  if (API_BASE) return api<MarketsSummary>('/metrics/summary');
  const live = LIVE_MARKETS.length;
  // Sum a 24h slice of fixture volume — enough for a non-zero deck stat
  // without claiming we have real flow yet.
  const volume24h = LIVE_MARKETS.reduce((a, m) => a + (m.volume ?? 0) * 0.18, 0);
  return Promise.resolve({
    marketsLive: live,
    volume24h: Math.round(volume24h),
    aiAccuracy: 0.998,
  });
}
