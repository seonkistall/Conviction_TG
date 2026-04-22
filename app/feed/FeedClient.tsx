'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Market } from '@/lib/types';
import { FeedCard } from '@/components/FeedCard';
import { useT } from '@/lib/i18n';

interface Props {
  markets: Market[];
}

export function FeedClient({ markets }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const t = useT();

  // IntersectionObserver on children to track currently-visible card
  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;
    const cards = Array.from(scroller.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.5) {
            const i = cards.indexOf(e.target as HTMLElement);
            if (i !== -1) setIdx(i);
          }
        }
      },
      { root: scroller, threshold: [0.5, 0.75] }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [markets.length]);

  return (
    // `relative` is load-bearing: the top overlay + progress rail use
    // `absolute` and must anchor to this wrapper rather than the nearest
    // positioned ancestor (which, without this, would be the fixed Header's
    // initial containing block — causing the back-button chip to float over
    // the site Header on mobile).
    <div className="relative -mt-16 h-[100dvh] w-full">
      {/* Top overlay — back to grid */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-ink-900/70 px-3 py-1.5 text-[11px] font-semibold text-bone backdrop-blur"
        >
          ← {t('nav.markets')}
        </Link>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/70 px-2 py-1 text-[10px] text-bone-muted backdrop-blur">
          <span className="font-mono tabular-nums text-bone">{idx + 1}</span>
          <span>/</span>
          <span className="font-mono tabular-nums">{markets.length}</span>
        </div>
      </div>

      {/* Progress dots — right side, desktop */}
      <div className="pointer-events-none absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-1 md:flex">
        {markets.map((_, i) => (
          <span
            key={i}
            className={`block h-5 w-0.5 rounded-full transition ${
              i === idx ? 'bg-volt' : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      <div
        ref={ref}
        className="snap-feed no-scrollbar h-full overflow-y-scroll"
      >
        {markets.map((m) => (
          <FeedCard key={m.id} market={m} />
        ))}
      </div>
    </div>
  );
}
