'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { NARRATIVE_INDICES, getMarket } from '@/lib/markets';
import { AutoVideo } from './AutoVideo';
import { useT } from '@/lib/i18n';

export function NarrativeIndices() {
  const t = useT();
  return (
    <section className="mx-auto max-w-[1440px] px-6 pt-16">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/5 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-volt">
            Conviction Index Suite
          </div>
          <h2 className="mt-3 font-display text-4xl text-bone md:text-5xl">
            {t('narrative.title')}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-bone-muted">
            {t('narrative.sub')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {NARRATIVE_INDICES.map((nx) => (
          <div
            key={nx.id}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-800"
          >
            {nx.media && (
              <div className="relative aspect-[16/9]">
                <AutoVideo
                  media={nx.media}
                  className="absolute inset-0 h-full w-full"
                  fit="cover"
                />
                <div className="absolute inset-0 narrative-grad" />
                <div className="absolute inset-0 card-gradient" />
                <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900/70 text-2xl backdrop-blur">
                  {nx.emoji}
                </div>
              </div>
            )}
            <div className="p-5">
              <h3 className="font-display text-2xl text-bone">{nx.title}</h3>
              <p className="mt-1 text-xs text-bone-muted">{nx.blurb}</p>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="font-mono text-3xl font-bold tabular-nums text-bone">
                    ¢{Math.round(nx.price * 100)}
                  </div>
                  <div
                    className={clsx(
                      'text-xs font-mono',
                      nx.change24h >= 0 ? 'text-yes' : 'text-no'
                    )}
                  >
                    {nx.change24h >= 0 ? '+' : ''}
                    {nx.change24h.toFixed(1)}% · 24h
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-volt px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-volt-dark"
                >
                  Trade
                </button>
              </div>

              <ul className="mt-4 space-y-1.5">
                {nx.legs.map((l) => {
                  const m = getMarket(l.marketId);
                  return (
                    <li
                      key={l.marketId}
                      className="flex items-center justify-between text-[11px] text-bone-muted"
                    >
                      <Link
                        href={m ? `/markets/${m.slug}` : '#'}
                        className="line-clamp-1 hover:text-bone"
                      >
                        {m?.title ?? l.marketId}
                      </Link>
                      <span className="font-mono tabular-nums">
                        {Math.round(l.weight * 100)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
