'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Market } from '@/lib/types';
import { AutoVideo } from './AutoVideo';
import { pct, formatUSD, timeUntil } from '@/lib/format';

export function Hero({ markets }: { markets: Market[] }) {
  // Hero rotates through binary markets with the cleanest YES/NO narrative.
  // Always exclude resolved markets — the hero is for live action only.
  const featured = markets
    .filter((m) => m.kind === 'binary' && m.trending && m.status !== 'resolved')
    .slice(0, 4);
  const [i, setI] = useState(0);

  useEffect(() => {
    // Guard: `(x + 1) % 0` is NaN, which would poison the rotation index
    // forever once featured goes empty (data change, all resolved, etc.).
    // Skip the timer entirely in that case.
    if (featured.length === 0) return;
    const t = setInterval(() => setI((x) => (x + 1) % featured.length), 7000);
    return () => clearInterval(t);
  }, [featured.length]);

  const m = featured[i];

  /*
   * `timeUntil(endsAt)` is time-dependent, so server and client evaluate it
   * against different `Date.now()` instants — a minute-boundary flip between
   * SSR and hydration would produce a React hydration warning. We render a
   * stable placeholder during SSR and swap the live label in on mount, then
   * tick it once a minute so the copy stays fresh.
   */
  const [endsLabel, setEndsLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!m) return;
    setEndsLabel(timeUntil(m.endsAt));
    const t = setInterval(() => setEndsLabel(timeUntil(m.endsAt)), 60_000);
    return () => clearInterval(t);
  }, [m?.endsAt]);

  // If upstream filters ever produce an empty set (all trending binaries
  // resolved, data-model change, etc.), render nothing rather than letting
  // the destructured `m.slug` / `m.media` crash the whole landing page.
  if (!m) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="spotlight absolute inset-x-0 top-0 h-[720px]" />
      <div className="grid-bg absolute inset-0 opacity-60" />
      <div className="relative mx-auto grid max-w-[1440px] gap-10 px-6 pt-10 pb-12 sm:pt-16 md:grid-cols-12">
        {/* Headline */}
        <div className="md:col-span-7">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-volt/30 bg-volt/5 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-volt sm:text-[11px]">
            <span className="live-dot shrink-0" />
            <span className="truncate">Asia-native · AI-powered · live in beta</span>
          </div>

          {/*
           * Headline scales: ~40px mobile → 56px sm → 72px md → 88px lg.
           * The hard <br/>s are kept only at md+; on mobile we let the
           * browser wrap the 3-phrase headline naturally so it never
           * overflows 375px viewports.
           */}
          <h1 className="mt-6 display-xl text-[40px] leading-[0.95] text-bone sm:text-[56px] md:text-[72px] lg:text-[88px]">
            Trade your <span className="italic text-volt">conviction</span>
            <span className="hidden md:inline"><br /></span>{' '}
            on the moments
            <span className="hidden md:inline"><br /></span>{' '}
            that <span className="italic">actually</span> move APAC.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-bone-muted sm:text-lg">
            K-pop comebacks. T1 at Worlds. Son scoring a brace. The next Oscar.
            Every narrative that matters to 4 billion Asians — priced, tradable, and
            graded by a 23-source AI evidence swarm.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/markets/${m.slug}`}
              className="rounded-full bg-volt px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-volt-dark sm:px-6 sm:py-3"
            >
              Explore markets →
            </Link>
            <a
              href="#how"
              className="rounded-full border border-white/10 bg-ink-800 px-5 py-2.5 text-sm font-semibold text-bone hover:bg-ink-700 sm:px-6 sm:py-3"
            >
              How it resolves
            </a>
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-white/5 pt-6 sm:gap-6">
            <StatCell k="Markets live" v="87" />
            <StatCell k="24h volume" v="$4.2M" />
            <StatCell k="AI accuracy" v="84%" />
          </div>
        </div>

        {/* Featured rotating card */}
        <div className="md:col-span-5">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(124,92,255,0.45)]">
            <div className="aspect-[4/5]">
              <AutoVideo
                media={m.media}
                fit="cover"
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 card-gradient" />
            </div>

            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-ink-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-bone backdrop-blur">
                  {m.category}
                </span>
                <span className="inline-flex items-center rounded-full bg-volt/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-volt backdrop-blur">
                  ✨ Featured
                </span>
              </div>
              <div className="flex gap-1">
                {featured.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setI(idx)}
                    className={`h-1 rounded-full transition-all ${
                      idx === i ? 'w-6 bg-volt' : 'w-2 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5">
              <div className="text-[11px] font-medium uppercase tracking-widest text-bone-muted">
                {/*
                 * `endsLabel` is null on the server and first client render
                 * (same markup → no hydration warning), then populated from
                 * useEffect. En-dash keeps the layout stable pre/post swap.
                 */}
                Closes in {endsLabel ?? '—'} · {formatUSD(m.volume)} vol
              </div>
              <Link
                href={`/markets/${m.slug}`}
                className="mt-1 block font-display text-xl leading-tight text-bone line-clamp-3 sm:text-2xl md:text-3xl"
              >
                {m.title}
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-volt transition-all"
                      style={{ width: `${m.yesProb * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-bone-muted">
                    <span>YES {pct(m.yesProb)}</span>
                    <span>NO {pct(1 - m.yesProb)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="rounded-lg border border-yes/30 bg-yes-soft py-2.5 text-sm font-semibold text-yes transition hover:bg-yes/20">
                  Buy YES · ¢{(m.yesProb * 100).toFixed(0)}
                </button>
                <button className="rounded-lg border border-no/30 bg-no-soft py-2.5 text-sm font-semibold text-no transition hover:bg-no/20">
                  Buy NO · ¢{((1 - m.yesProb) * 100).toFixed(0)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-lg font-bold tabular-nums text-bone sm:text-2xl">{v}</div>
      <div className="mt-1 text-[9px] font-medium uppercase tracking-widest text-bone-muted sm:text-[11px]">
        {k}
      </div>
    </div>
  );
}
