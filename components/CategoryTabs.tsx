'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CATEGORIES } from '@/lib/markets';
import { MarketCard } from './MarketCard';
import type { Market } from '@/lib/types';

type SortKey = 'trending' | 'volume' | 'closing' | 'edge' | 'ai';
type StatusFilter = 'live' | 'resolved' | 'all';

/**
 * <CategoryTabs /> is the catalog grid on the landing page. v2.6 Phase C
 * upgrades it from "category + sort" into a proper discovery surface:
 *
 *   - SearchBar (text query against title + tags + category)
 *   - Category chips (existing)
 *   - Tag chips derived from the top tags across the visible set
 *   - Extended sort (trending / volume / closing / edge / AI confidence)
 *   - Status switch (Live · Settled · All)
 *
 * Filters compose: text → category → tag → status → sort. The empty-state
 * keeps a "clear filters" affordance so users never get stuck.
 */
export function CategoryTabs({ markets }: { markets: Market[] }) {
  const [active, setActive] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('trending');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('live');

  const tags = useMemo(() => topTags(markets, 16), [markets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets
      .filter((m) => (active === 'all' ? true : m.category === active))
      .filter((m) => {
        if (status === 'all') return true;
        if (status === 'resolved') return m.status === 'resolved';
        return m.status !== 'resolved';
      })
      .filter((m) => (tag ? m.tags.includes(tag) : true))
      .filter((m) => {
        if (!q) return true;
        const hay = `${m.title} ${m.tags.join(' ')} ${m.category}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        if (sort === 'volume') return b.volume - a.volume;
        if (sort === 'closing')
          return +new Date(a.endsAt) - +new Date(b.endsAt);
        if (sort === 'edge') return (b.edgePP ?? 0) - (a.edgePP ?? 0);
        if (sort === 'ai') return b.aiConfidence - a.aiConfidence;
        return (
          (b.trending ? 1 : 0) - (a.trending ? 1 : 0) +
          (b.volume - a.volume) * 0.0001
        );
      });
  }, [markets, active, sort, query, tag, status]);

  const hasFilters = query.length > 0 || tag !== null || active !== 'all' || status !== 'live';

  function clearFilters() {
    setQuery('');
    setTag(null);
    setActive('all');
    setStatus('live');
  }

  return (
    <section className="mx-auto max-w-[1440px] px-6">
      {/* Search row */}
      <div className="flex flex-wrap items-center gap-3 pb-4">
        <div className="relative flex-1 min-w-[260px]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets, tags, narratives…"
            className="w-full rounded-full border border-white/10 bg-ink-900 py-2.5 pl-10 pr-4 text-sm text-bone placeholder:text-bone-muted focus:border-volt/60 focus:outline-none"
            aria-label="Search markets"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-[11px] text-bone-muted hover:text-bone"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <StatusToggle value={status} onChange={setStatus} />
      </div>

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
            { k: 'edge' as const, l: '⚡ Edge' },
            { k: 'ai' as const, l: '🧠 AI conf' },
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

      {/* Tag rail */}
      {tags.length > 0 && (
        <div className="no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
            Tags
          </span>
          {tag && (
            <button
              type="button"
              onClick={() => setTag(null)}
              className="rounded-full border border-volt bg-volt/10 px-2.5 py-1 text-[11px] font-semibold text-volt"
            >
              #{tag} ✕
            </button>
          )}
          {tags
            .filter((t) => t !== tag)
            .map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className="whitespace-nowrap rounded-full border border-white/10 bg-ink-800 px-2.5 py-1 text-[11px] text-bone-muted transition hover:border-white/20 hover:text-bone"
              >
                #{t}
              </button>
            ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[11px] text-bone-muted">
        <span>
          Showing <span className="font-mono text-bone">{filtered.length}</span> of{' '}
          {markets.length}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full px-2 py-1 text-bone-muted underline-offset-2 hover:text-bone hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 text-center text-bone-muted">
          <span>No markets match these filters.</span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-white/10 bg-ink-800 px-4 py-2 text-sm font-semibold text-bone hover:border-white/30"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function StatusToggle({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const opts: { k: StatusFilter; l: string }[] = [
    { k: 'live', l: 'Live' },
    { k: 'resolved', l: 'Settled' },
    { k: 'all', l: 'All' },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-800 p-1 text-xs">
      {opts.map((o) => (
        <button
          key={o.k}
          type="button"
          onClick={() => onChange(o.k)}
          className={clsx(
            'rounded-full px-3 py-1 font-medium transition',
            value === o.k
              ? 'bg-white/10 text-bone'
              : 'text-bone-muted hover:text-bone'
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

/** Returns the N most-frequent tags across the markets, sorted by count desc. */
function topTags(markets: Market[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const m of markets) {
    for (const t of m.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => t);
}
