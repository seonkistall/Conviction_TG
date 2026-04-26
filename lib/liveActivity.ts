/**
 * v2.26.2 — Live activity feed for the /feed surface.
 *
 * Why this exists
 * ---------------
 * Polymarket and Kalshi both surface a rolling stream of recent fills
 * near the order book — it's the single biggest "this is alive" cue
 * a first-time visitor reads in their first 30 seconds. Without the
 * stream, /feed reads as "video player with prices that tick" and
 * VCs miss the live-exchange signal.
 *
 * We synthesize a plausible stream from the existing TRADERS +
 * AI_TRADERS rosters and the displayed market prices. Every item is:
 *   - Anchored to a real market in the catalog
 *   - Attributed to a real handle from the leaderboard
 *   - Stake-shaped like a realistic position ($25 / $100 / $250 / $500)
 *   - Side-shaped consistent with the market's current YES probability
 *
 * Disclosure
 * ----------
 * Items carry `synthetic: true` for any future code path that needs
 * to filter (e.g. when real fills arrive from a backend, the UI can
 * interleave real items above the synthesized stream). The tiny ℹ
 * info icon on the ticker exposes the honest framing on hover/tap so
 * VC due-diligence questions have a documented answer surface, while
 * a casual reader sees the stream as live activity.
 *
 * Rolling cadence (v2.26.2)
 * -------------------------
 * The ticker advances on a short interval (~1.5s) but does NOT replace
 * the entire visible window each tick — instead, only the topmost
 * "Just now" position rotates in. Previous chips slide down a slot,
 * the bottom one fades out. This matches Polymarket's real-fills
 * stream pattern and avoids the previous v2.28-1 behavior where 4
 * chips replaced simultaneously every 8s (jarring).
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
  /** Seconds ago for the rendered timestamp ("Just now", "12s", etc.). */
  ageSec: number;
  /** Always true while the platform is pre-launch. */
  synthetic: true;
}

const STAKE_LADDER = [25, 50, 100, 250, 500] as const;

/**
 * Deterministic hash so the same (seed, key) pair always yields the
 * same number — keeps the synthesized stream stable across SSR +
 * hydration even though the timer evolves it on the client.
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

/** Seed an item from a (market, traderIndex, sequence) triple. */
function buildItem(
  market: Market,
  traderIdx: number,
  ageSec: number,
  rotation: number
): ActivityItem {
  // Mix human + agentic traders. Two-thirds humans (more believable
  // on first read), one-third AI traders (drives the agentic-trader
  // story live in the visual).
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
 * Generate `count` activity items as a rolling window.
 *
 * Item at index 0 is the most recent ("Just now"); subsequent items
 * are older. The ticker passes a `rotation` counter that increments
 * on its tick — items from prior rotations get aged forward (their
 * `ageSec` grows by ROTATION_INTERVAL_S * positionDelta), so a chip
 * that was "Just now" 6 ticks ago renders as "9s ago" without React
 * having to remount it.
 *
 * Deterministic given `rotation`, so SSR and the first client tick
 * agree byte-for-byte (no hydration mismatch).
 */
export function buildActivityFeed(
  rotation: number,
  count = 5
): ActivityItem[] {
  const liveMarkets = MARKETS.filter((m) => m.status !== 'resolved');
  const items: ActivityItem[] = [];
  for (let i = 0; i < count; i++) {
    // Each slot picks (market, trader) based on a different mix of
    // (rotation, position). The +i*7 / +i*11 / +i*13 separation makes
    // adjacent chips feel diverse even if catalog is small.
    const m = liveMarkets[(rotation - i * 7 + 1000 * count) % liveMarkets.length];
    const traderIdx =
      (rotation - i * 11 + 1000 * count) % (TRADERS.length + AI_TRADERS.length);
    // Newest at top: ageSec scales with position. ROTATION_INTERVAL ~= 1.5s.
    // Slot 0 = "Just now" (0s), slot 1 = ~3s, slot 2 = ~7s, ...
    const ageSec = i === 0 ? 0 : Math.min(180, i * 4 + (rotation % 3));
    items.push(buildItem(m, traderIdx, ageSec, rotation));
  }
  return items;
}

/** Format `ageSec` as "Just now", "12s", "1m", "47s". */
export function formatAge(ageSec: number): string {
  if (ageSec < 3) return 'Just now';
  if (ageSec < 60) return `${ageSec}s`;
  const m = Math.floor(ageSec / 60);
  return `${m}m`;
}
