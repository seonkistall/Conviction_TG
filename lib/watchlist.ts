/**
 * v2.25 — Shared Watchlist hook.
 *
 * The Feed Heart button writes liked market ids to `cv_feed_likes_v1`
 * in localStorage. Pre-v2.25 that data was private to FeedCard. This
 * module promotes it to a first-class "Watchlist" concept so other
 * surfaces (the Portfolio page, for one) can read the same set
 * without duplicating the storage key + serialization logic.
 *
 * Notes:
 *   - Single source of truth for the storage key is `LIKE_STORAGE_KEY`
 *     below. FeedCard now imports from here too.
 *   - All reads/writes are JSON.parse/stringify of a `string[]` — NOT
 *     a `Set` — because Set doesn't round-trip through JSON.
 *   - SSR-safe: returns an empty list during server render. The client
 *     effect re-hydrates on mount. Don't read on server.
 */

import { useEffect, useState, useCallback } from 'react';

export const LIKE_STORAGE_KEY = 'cv_feed_likes_v1';

function readLikesRaw(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LIKE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLikesRaw(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* private-mode Safari / quota — best effort */
  }
}

/**
 * React hook exposing the current watchlist + a toggle helper.
 *
 * Subscribes to `storage` events so changes from other tabs propagate
 * instantly. Also hydrates from localStorage on mount (SSR returns an
 * empty set to avoid a hydration mismatch).
 */
export function useWatchlist() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(readLikesRaw());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LIKE_STORAGE_KEY) return;
      setIds(readLikesRaw());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((marketId: string) => {
    setIds((prev) => {
      const set = new Set(prev);
      if (set.has(marketId)) set.delete(marketId);
      else set.add(marketId);
      const next = Array.from(set);
      writeLikesRaw(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (marketId: string) => ids.includes(marketId),
    [ids]
  );

  return { ids, has, toggle, hydrated };
}
