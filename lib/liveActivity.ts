/**
 * v2.28-1 — Live activity feed for the Feed surface.
 *
 * Why this exists
 * ---------------
 * The /feed page has visible markets with prices that tick, but the
 * social-proof signal "are people actually trading right now?" is
 * silent. Polymarket and Kalshi both surface a rolling feed of recent
 * fills near the order book — it's the single biggest "this is alive"
 * cue a first-time visitor reads in the first 30 seconds.
 *
 * We don't have real fills (pre-launch), so we synthesize a plausible
 * stream from the existing TRADERS + AI_TRADERS rosters and the
 * displayed market price. Every activity item is:
 *   - Anchored to a real market in the catalog
 *   - Attributed to a real handle from the leaderboard
 *   - Stake-shaped like a realistic position ($25 / $100 / $250 / $500)
 *   - Side-shaped consistent with the market's current YES probability
 *
 * Honest disclosure
 * -----------------
 * Items are explicitly tagged `synthetic: true` so any future live-
 * fills feed can interleave real items above the demo stream and the
 * UI can render a "demo" subtag. Pre-launch we render them without the
 * subtag because every market on the page is also pre-launch — the
 * stream's job is to communicate the product's *shape*, not the
 * book.
 */

import type { Market } from './types';
import { TRADERS, AI_TRADERS, MARKETS } from './markets';

export interface ActivityItem {
  /** Stable id so React keys don't churn during streaming. */
  id: string;
  /** Trader handle (no leading @). */
  handle: string;
  /** Avatar emoji or single-char symbol. */
  avatar: string;
  /** Market id pointed to. */
  marketId: string;
  /** Market title for inline display. */
  marketTitle: string;
  /** Market slug for hyperlinks. */
  marketSlug: string;
  /** Side of the trade. */
  side: 'YES' | 'NO';
  /** Approximate stake in dollars. */
  stake: number;
  /** Approximate fill price as cents (e.g. 62 = ¢62). */
  cents: number;
  /** Seconds ago for the rendered timestamp ("Just now", "2m ago", etc.). */
  ageSec: number;
  /** Always true while the platform is pre-launch. */
  synthetic: true;
}

const STAKE_LADDER = [25, 50, 100, 250, 500] as const;

/**
 * Deterministic hash so the same (seed, key) pair always yields the
 * same number — used to keep the synthesized stream stable across
 * SSR + hydration even though it later evolves on the client tick.
 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickStake(seed: number): number {
  return STAKE_LADDER[seed % STAKE_LADDER.length];
}

/** Seed an item from a (market, traderIndex) pair. */
function buildItem(
  market: Market,
  traderIdx: number,
  ageSec: number,
  rotation: number
): ActivityItem {
  // Mix human + agentic traders. Two-thirds humans (more believable
  // on first read), one-third AI traders (drives the agentic-trader
  // story).
  const useAI = traderIdx % 3 === 0;
  const pool = useAI ? AI_TRADERS : TRADERS;
  const t = pool[traderIdx % pool.length];
  const seed = hash(`${market.id}:${t.handle}:${rotation}`);
  // Side biases toward YES on markets the AI confidence agrees with.
  // For a market priced 0.62 YES, ~62% of synthetic fills go YES.
  const sideRoll = (seed % 100) / 100;
  const side: 'YES' | 'NO' = sideRoll < market.yesProb ? 'YES' : 'NO';
  const cents = Math.round(
    (side === 'YES' ? market.yesProb : 1 - market.yesProb) * 100
  );
  return {
    id: `${market.id}-${t.handle}-${rotation}`,
    handle: t.handle,
    avatar: t.avatar,
    marketId: market.id,
    marketTitle: market.title,
    marketSlug: market.slug,
    side,
    stake: pickStake(seed),
    cents,
    ageSec,
    synthetic: true,
  };
}

/**
 * Generate a snapshot of `count` recent activity items spread across
 * the catalog. Older items have larger `ageSec`. Deterministic given a
 * `rotation` integer — the ticker bumps `rotation` every few seconds
 * to "stream" new items in.
 *
 * Items rendered in newest-first order.
 */
export function buildActivityFeed(
  rotation: number,
  count = 12
): ActivityItem[] {
  // Pick `count` (market, trader) pairs with deterministic spread.
  const liveMarkets = MARKETS.filter((m) => m.status !== 'resolved');
  const items: ActivityItem[] = [];
  for (let i = 0; i < count; i++) {
    const m = liveMarkets[(rotation + i * 7) % liveMarkets.length];
    const traderIdx = (rotation + i * 11) % (TRADERS.length + AI_TRADERS.length);
    // Older items are evenly spread to ~3 minutes back.
    const ageSec = i === 0 ? 0 : Math.min(180, i * 14 + (rotation % 7));
    items.push(buildItem(m, traderIdx, ageSec, rotation));
  }
  return items;
}

/** Format `ageSec` as "Just now", "12s", "1m", "2m", "47s". */
export function formatAge(ageSec: number): string {
  if (ageSec < 5) return 'Just now';
  if (ageSec < 60) return `${ageSec}s`;
  const m = Math.floor(ageSec / 60);
  return `${m}m`;
}
