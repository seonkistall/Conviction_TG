'use client';

/**
 * v2.28.2 — Live trade feed abstraction (P2 baby step).
 *
 * Today the market detail page renders fake "Recent trades" with
 * `mockTrades(yesProb)` — a row of made-up handles + share counts.
 * Functional but not actually live; if a VC pokes at it for >30s
 * they will spot the same trades repeating.
 *
 * This module is the swap point for a real WebSocket source. It
 * exposes a `useLiveTrades(marketId)` hook that components subscribe
 * to. Today the hook ticks an in-memory mock at 4s intervals; when
 * NEXT_PUBLIC_LIVE_TRADES_WS_URL is set, the same hook opens a real
 * WebSocket and emits per-message updates. Either way the consumer
 * sees the exact same `LiveTrade[]` shape, so the swap is one env
 * var with no component-side rewrite.
 *
 * Reconnect strategy on the future WS path:
 *   - 1s exponential backoff, capped at 30s
 *   - Stale-while-revalidate: keep last snapshot visible during reconnect
 *   - Reduce-motion / tab-hidden pause
 */

import { useEffect, useRef, useState } from 'react';

export interface LiveTrade {
  id: string;
  side: 'YES' | 'NO';
  shares: number;
  /** Cents, integer 1-99. */
  price: number;
  /** Trader handle (e.g. `oracle.seoul`). */
  handle: string;
  /** Avatar emoji or url. */
  avatar: string;
  /** ms epoch when the trade landed. */
  at: number;
}

const HANDLES = [
  'oracle.seoul', 'bias.jp', 'whale.apac', 'faker.fanboy',
  'idol.scout', 'btc.maxi.hk', 'drama.nerd', 'tokyo.takes',
  'kbo.quant',
];
const AVATARS = ['🧠', '🎌', '🐋', '🎮', '💜', '🟧', '📺', '🗼', '⚾'];
const WS_URL = process.env.NEXT_PUBLIC_LIVE_TRADES_WS_URL ?? '';

function fakeTrade(yesProb: number, marketId: string): LiveTrade {
  const i = Math.floor(Math.random() * HANDLES.length);
  const side: 'YES' | 'NO' = Math.random() > 0.45 ? 'YES' : 'NO';
  const base = side === 'YES' ? yesProb : 1 - yesProb;
  const price = Math.max(1, Math.min(99, Math.round(base * 100 + (Math.random() - 0.5) * 6)));
  return {
    id: `${marketId}-${Date.now()}-${i}`,
    side,
    shares: Math.round(50 + Math.random() * 900),
    price,
    handle: HANDLES[i],
    avatar: AVATARS[i],
    at: Date.now(),
  };
}

/**
 * Subscribe to the live trade feed for a market. Returns the most
 * recent N trades (default 8) with newest first.
 *
 * Today: ticks a mock every 4s.
 * Tomorrow (NEXT_PUBLIC_LIVE_TRADES_WS_URL set): subscribes to
 *   `<WS_URL>/markets/<id>/trades` and pushes each message.
 */
export function useLiveTrades(
  marketId: string,
  yesProb: number,
  max: number = 8
): LiveTrade[] {
  const [trades, setTrades] = useState<LiveTrade[]>(() =>
    Array.from({ length: max }, () => fakeTrade(yesProb, marketId))
  );
  // Refs so the effect's deps stay stable — re-running the WS open
  // is expensive and we don't want to thrash on `yesProb` ticks.
  const yesRef = useRef(yesProb);
  yesRef.current = yesProb;
  const maxRef = useRef(max);
  maxRef.current = max;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ---- Future WS path -------------------------------------------------
    if (WS_URL) {
      let socket: WebSocket | null = null;
      let backoff = 1000;
      let cancelled = false;
      const open = () => {
        if (cancelled) return;
        socket = new WebSocket(`${WS_URL}/markets/${encodeURIComponent(marketId)}/trades`);
        socket.onopen = () => {
          backoff = 1000;
        };
        socket.onmessage = (ev) => {
          try {
            const t = JSON.parse(ev.data) as LiveTrade;
            setTrades((cur) => [t, ...cur].slice(0, maxRef.current));
          } catch {
            /* drop malformed message */
          }
        };
        socket.onclose = () => {
          if (cancelled) return;
          window.setTimeout(open, backoff);
          backoff = Math.min(backoff * 2, 30_000);
        };
      };
      open();
      return () => {
        cancelled = true;
        socket?.close();
      };
    }

    // ---- Mock path ------------------------------------------------------
    const interval = window.setInterval(() => {
      // Pause when tab is hidden — TG's recent-trades panel scrolling
      // a fake feed with the user looking elsewhere wastes cycles + would
      // spam Sentry breadcrumbs.
      if (document.visibilityState !== 'visible') return;
      setTrades((cur) =>
        [fakeTrade(yesRef.current, marketId), ...cur].slice(0, maxRef.current)
      );
    }, 4_000);
    return () => window.clearInterval(interval);
  }, [marketId]);

  return trades;
}
