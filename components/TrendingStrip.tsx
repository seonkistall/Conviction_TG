import Link from 'next/link';
import type { Market } from '@/lib/types';
import { pct, formatUSD, timeUntil } from '@/lib/format';

export function TrendingStrip({ markets }: { markets: Market[] }) {
  // duplicate for seamless marquee
  const doubled = [...markets, ...markets];
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
