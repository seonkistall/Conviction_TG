'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { MARKETS } from '@/lib/markets';
import { useWatchlist } from '@/lib/watchlist';
import { pct, timeUntil } from '@/lib/format';
import { LivePrice } from './LivePrice';

/**
 * v2.25 — Watchlist column module for the Portfolio page.
 *
 * Reads `cv_feed_likes_v1` via `useWatchlist()` — the same store the
 * Feed heart button writes to. Renders a compact list of the user's
 * hearted markets with live price + time-to-close. Empty state points
 * back to /feed so users know where to accumulate the list.
 *
 * Why this lives on /portfolio:
 *   - "Stuff I want to trade" belongs next to "stuff I'm already
 *     trading" (positions). Same mental model.
 *   - The Feed heart was previously a dead-end storage write — this
 *     module is the first read-surface, unlocking the retention loop
 *     (come back to /portfolio → see your watchlist → trade it).
 */
export function Watchlist() {
  const { ids, hydrated } = useWatchlist();

  // Resolve ids → full Market objects once. MARKETS.find is O(N) per id;
  // with ~37 markets and typical watchlists of 1–10 items this costs
  // ~350 string compares, well below any perceptible threshold.
  const items = useMemo(
    () => ids.map((id) => MARKETS.find((m) => m.id === id)).filter(Boolean),
    [ids]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-3xl text-bone">Watchlist</h3>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
          {hydrated ? `${items.length} liked` : '—'}
        </span>
      </div>

      {hydrated && items.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-ink-800 px-4 py-6 text-center">
          <div className="text-3xl" aria-hidden="true">♡</div>
          <p className="mt-2 text-sm text-bone">Nothing saved yet.</p>
          <p className="mt-1 text-xs text-bone-muted">
            Tap the heart on any Feed card to save it here for later.
          </p>
          <Link
            href="/feed"
            className="mt-4 inline-block rounded-full bg-volt px-4 py-2 text-xs font-bold text-ink-900 hover:bg-volt-dark"
          >
            Open Feed →
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {items.map((m) => {
            if (!m) return null;
            return (
              <li
                key={m.id}
                className="rounded-xl border border-white/5 bg-ink-800 transition hover:border-white/20"
              >
                <Link
                  href={`/markets/${m.slug}`}
                  className="block px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="line-clamp-1 text-sm font-medium text-bone">
                      {m.title}
                    </span>
                    <LivePrice
                      marketId={m.id}
                      seed={m.yesProb}
                      format="cents"
                      showDirection
                      className="shrink-0 text-sm text-bone"
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-bone-muted">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 uppercase tracking-widest">
                      {m.category}
                    </span>
                    <span>·</span>
                    <span>{m.region}</span>
                    <span>·</span>
                    <span>{timeUntil(m.endsAt)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-[10px] text-bone-muted/70">
        Saved locally in your browser. Syncs across devices when sign-in ships.
      </p>
    </div>
  );
}

// v2.25: Keep a default export for symmetry with other portfolio-column
// modules like `<HotPositions />`, even though only the named export
// is currently imported.
export default Watchlist;
