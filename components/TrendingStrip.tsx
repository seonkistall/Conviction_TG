'use client';

/**
 * v2.28.1 (F-06) — Region-aware trending marquee.
 *
 * Pre-v2.28.1 the strip showed TRENDING_MARKETS in fixture order,
 * meaning a Korean user opening the Mini App from Seoul saw a
 * Bitcoin-eoy market in slot 0 and the NewJeans comeback market
 * scrolled past in slot 8 — exactly the wrong order for the 30-
 * second wow path. The Smoketest report flagged this as F-06.
 *
 * What changes:
 *   - Component is now 'use client' so it can read the TG SDK.
 *   - On mount inside Telegram, getTgRegion() is consulted and the
 *     incoming markets are reordered by regionPreferred() — KR
 *     surfaces K-pop / LCK / KBO first, JP surfaces e-sport /
 *     anime, IN surfaces cricket / Bollywood, default 'apac' is
 *     unchanged.
 *
 * Hydration safety:
 *   - First paint matches the server-rendered (region='apac') order.
 *   - The reorder is committed inside useEffect AFTER hydration, so
 *     React doesn't see a server/client markup mismatch.
 *   - On a regular browser the effect is a no-op (getTgRegion
 *     returns 'apac' → regionPreferred is identity).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Market } from '@/lib/types';
import { pct, formatUSD, timeUntil } from '@/lib/format';
import { regionPreferred } from '@/lib/markets';
import { getTgRegion } from '@/lib/tgWebApp';

export function TrendingStrip({ markets }: { markets: Market[] }) {
  const [ordered, setOrdered] = useState<Market[]>(markets);

  useEffect(() => {
    const region = getTgRegion();
    if (region === 'apac') return; // identity reorder; skip the work
    setOrdered(regionPreferred(markets, region));
  }, [markets]);

  // duplicate for seamless marquee
  const doubled = [...ordered, ...ordered];

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-ink-900/70 py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-900 to-transparent" />
      <div className="flex w-[200%] animate-marquee items-center gap-10 px-6">
        {doubled.map((m, i) => (
          <Link
            key={`${m.id}-${i}`}
            href={`/markets/${m.slug}`}
            className="flex shrink-0 items-center gap-3 text-sm"
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
              {m.category}
            </span>
            <span className="max-w-xs truncate text-bone">{m.title}</span>
            <span className="font-mono font-bold text-volt">{pct(m.yesProb)}</span>
            <span className="font-mono text-bone-muted">{formatUSD(m.volume)}</span>
            <span className="text-bone-muted">{timeUntil(m.endsAt)}</span>
            <span className="h-1 w-1 rounded-full bg-volt/60" />
          </Link>
        ))}
      </div>
    </div>
  );
}
