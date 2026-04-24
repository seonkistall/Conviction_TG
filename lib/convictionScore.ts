/**
 * v2.25 — Conviction Score.
 *
 * Rolls up a user's closed + open positions into a single
 * "you've been right X% of the time" number plus per-category
 * breakdowns. Pulls from the positions store (both `positions`
 * and `closed`) so any trade placed via the YES/NO quick bet,
 * feed double-tap, or OrderBook feeds into the same number.
 *
 * Scoring rules (v2.25 — simple, easy to explain):
 *   - CLOSED positions: count as "right" if realized pnl > 0
 *   - OPEN positions: count as "right" if mark-to-market pnl > 0
 *     (optimistic — a mid-position user can still see progress)
 *   - Markets with zero shares on your side: excluded
 *   - No time decay — a 6-month-old win still counts
 *
 * Intentionally NOT weighted by stake size. A trader who went
 * 9/10 small should read as better than one who went 1/1 huge
 * — the latter is survivorship bias, the former is a signal.
 *
 * Returns `null` when the user has fewer than 3 settled+open
 * positions combined: score below that sample size is noise,
 * and showing a "100% accurate (1 of 1)" badge on a brand-new
 * user misrepresents their skill. The UI can fall back to a
 * "trade more to see your score" state.
 */

import { useMemo } from 'react';
import { usePositions } from './positions';
import { getMarket } from './markets';

export interface ConvictionScore {
  overall: number; // 0..1
  wins: number;
  total: number;
  byCategory: Array<{
    category: string;
    wins: number;
    total: number;
    score: number;
  }>;
  // Longest current streak of consecutive right-side positions.
  streak: number;
}

const MIN_SAMPLE = 3;

export function useConvictionScore(): ConvictionScore | null {
  const { positions, closed, hydrated } = usePositions();

  return useMemo(() => {
    if (!hydrated) return null;

    type Tally = { wins: number; total: number };
    const overall: Tally = { wins: 0, total: 0 };
    const byCat = new Map<string, Tally>();
    const recentOutcomes: boolean[] = []; // most-recent first — for streak

    // Closed fills — sorted newest first. The localStorage store pushes
    // onto the front of the array on CLOSE, so it's already ordered.
    for (const fill of closed) {
      const mk = getMarket(fill.marketId);
      if (!mk) continue;
      const win = fill.pnl > 0;
      overall.total += 1;
      if (win) overall.wins += 1;
      const cat = byCat.get(mk.category) ?? { wins: 0, total: 0 };
      cat.total += 1;
      if (win) cat.wins += 1;
      byCat.set(mk.category, cat);
      recentOutcomes.push(win);
    }
    // Open positions — mark-to-market. Newest first as the positions
    // reducer puts the latest buy at the head of the list.
    for (const p of positions) {
      if (p.shares <= 0) continue;
      const mk = getMarket(p.marketId);
      if (!mk) continue;
      const win = p.pnl > 0;
      overall.total += 1;
      if (win) overall.wins += 1;
      const cat = byCat.get(mk.category) ?? { wins: 0, total: 0 };
      cat.total += 1;
      if (win) cat.wins += 1;
      byCat.set(mk.category, cat);
      recentOutcomes.push(win);
    }

    if (overall.total < MIN_SAMPLE) return null;

    let streak = 0;
    for (const w of recentOutcomes) {
      if (!w) break;
      streak += 1;
    }

    return {
      overall: overall.wins / overall.total,
      wins: overall.wins,
      total: overall.total,
      byCategory: Array.from(byCat.entries())
        .map(([category, t]) => ({
          category,
          wins: t.wins,
          total: t.total,
          score: t.wins / t.total,
        }))
        .sort((a, b) => b.total - a.total),
      streak,
    };
  }, [positions, closed, hydrated]);
}
