'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import type { Market } from '@/lib/types';

/**
 * <LiveTicker /> — a horizontally scrolling tape of "live" market price
 * moves shown across the top of the homepage. The values themselves are
 * deterministic from the seed `yesProb`, but every ~3.5s a single random
 * market gets a small price drift (±0.5pp) to simulate live order flow.
 * This is purely cosmetic — it makes the page feel alive without any
 * websocket plumbing or real volatility model.
 *
 * Pairs with .ticker-track in globals.css. The track is duplicated so the
 * loop can scroll without a visible seam.
 */
interface Props {
  markets: Market[];
  /** How many markets to show in the tape. Default 16. */
  limit?: number;
}

export function LiveTicker({ markets, limit = 16 }: Props) {
  const seed = useMemo(
    () => markets.filter((m) => m.status !== 'resolved').slice(0, limit),
    [markets, limit]
  );
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(seed.map((m) => [m.id, m.yesProb]))
  );
  const [deltas, setDeltas] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
    if (seed.length === 0) return;
    const t = window.setInterval(() => {
      const target = seed[Math.floor(Math.random() * seed.length)];
      const drift = (Math.random() - 0.5) * 0.01; // ±0.5pp
      setPrices((p) => {
        const next = Math.min(0.99, Math.max(0.01, (p[target.id] ?? target.yesProb) + drift));
        return { ...p, [target.id]: next };
      });
      setDeltas((d) => ({ ...d, [target.id]: drift > 0 ? 'up' : 'down' }));
      window.setTimeout(() => {
        setDeltas((d) => ({ ...d, [target.id]: null }));
      }, 700);
    }, 3500);
    return () => window.clearInterval(t);
  }, [seed]);

  if (seed.length === 0) return null;

  // Duplicate the row so the scroll loops seamlessly.
  const row = [...seed, ...seed];

  return (
    <div
      className="border-y border-white/5 bg-ink-900/60 py-2.5 backdrop-blur"
      role="marquee"
      aria-label="Live market tape"
    >
      <div className="ticker-track">
        {row.map((m, i) => {
          const p = prices[m.id] ?? m.yesProb;
          const dir = deltas[m.id] ?? null;
          return (
            <Link
              key={`${m.id}-${i}`}
              href={`/markets/${m.slug}`}
              className="group inline-flex items-center gap-2 whitespace-nowrap text-[12px] tabular-nums"
            >
              <span className="text-bone-muted">{m.category}</span>
              <span className="max-w-[28ch] truncate text-bone group-hover:text-volt">
                {m.title}
              </span>
              <span
                className={clsx(
                  'font-mono font-bold',
                  dir === 'up' && 'text-yes flicker-up',
                  dir === 'down' && 'text-no flicker-down',
                  !dir && 'text-bone'
                )}
              >
                ¢{Math.round(p * 100)}
              </span>
              <span
                className={clsx(
                  'text-[10px]',
                  dir === 'up' ? 'text-yes' : dir === 'down' ? 'text-no' : 'text-bone-muted'
                )}
              >
                {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '·'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
