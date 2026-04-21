'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { CATEGORIES } from '@/lib/markets';
import { MarketCard } from './MarketCard';
import type { Market } from '@/lib/types';

export function CategoryTabs({ markets }: { markets: Market[] }) {
  const [active, setActive] = useState('all');
  const [sort, setSort] = useState<'trending' | 'volume' | 'closing'>('trending');

  const filtered = markets
    .filter((m) => active === 'all' || m.category === active)
    .sort((a, b) => {
      if (sort === 'volume') return b.volume - a.volume;
      if (sort === 'closing')
        return +new Date(a.endsAt) - +new Date(b.endsAt);
      return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) + (b.volume - a.volume) * 0.0001;
    });

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setActive(c.value)}
              className={clsx(
                'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition',
                active === c.value
                  ? 'border-volt bg-volt text-ink-900'
                  : 'border-white/10 bg-ink-800 text-bone-muted hover:border-white/20 hover:text-bone'
              )}
            >
              {c.label}
              <span className="ml-2 text-[11px] opacity-70">
                {c.value === 'all'
                  ? markets.length
                  : markets.filter((m) => m.category === c.value).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-800 p-1 text-xs">
          {[
            { k: 'trending' as const, l: '🔥 Trending' },
            { k: 'volume' as const, l: '$ Volume' },
            { k: 'closing' as const, l: '⏱ Closing' },
          ].map((s) => (
            <button
              key={s.k}
              onClick={() => setSort(s.k)}
              className={clsx(
                'rounded-full px-3 py-1 font-medium transition',
                sort === s.k
                  ? 'bg-white/10 text-bone'
                  : 'text-bone-muted hover:text-bone'
              )}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-bone-muted">
          No markets in this category yet — propose one.
        </div>
      )}
    </section>
  );
}
