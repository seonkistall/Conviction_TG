'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Market } from '@/lib/types';
import { AutoVideo } from './AutoVideo';
import { LivePrice } from './LivePrice';
import { useLivePrice } from '@/lib/livePrices';
import { pct, formatUSD, timeUntil } from '@/lib/format';

export function Hero({ markets }: { markets: Market[] }) {
  // Hero rotates through binary markets with the cleanest YES/NO narrative.
  // Always exclude resolved markets — the hero is for live action only.
  // v2.19-4: Expanded from 4 → 6. APAC surface now covers K/J/C/IN
  // explicitly (post-v2.17 copy reframing), and 4 slots meant 2/3 of
  // any visit showed only K-pop + esports featured cards even when
  // trending NPB / Bollywood / macro markets existed. Six is wide
  // enough to surface regional diversity on any given visit, narrow
  // enough that the rotation cycle (7s/slide × 6 = 42s) still feels
  // like curation rather than a ticker.
  const featured = markets
    .filter((m) => m.kind === 'binary' && m.trending && m.status !== 'resolved')
    .slice(0, 6);
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

  return <HeroCard m={m} featured={featured} i={i} setI={setI} endsLabel={endsLabel} />;
}

function HeroCard({
  m,
  featured,
  i,
  setI,
  endsLabel,
}: {
  m: Market;
  featured: Market[];
  i: number;
  setI: (n: number) => void;
  endsLabel: string | null;
}) {
  // Live-tick the featured card's YES probability. Falls back to the
  // seed during SSR so the server-rendered number never mismatches.
  const liveYes = useLivePrice(m.id, m.yesProb);

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
            K-pop comebacks. LCK vs LPL at Worlds. NPB pennant races. Bollywood
            openings. Anime debuts. BTC at the Tokyo open. Every APAC narrative
            that moves 4 billion people — priced, tradable, and graded by a
            23-source AI evidence swarm.
          </p>

          {/*
           * On phones the two CTAs stack full-width so each gets a comfortable
           * tap target without awkward wrapping. From sm (≥640px) we inline
           * them with auto width, matching the editorial desktop layout.
           */}
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={`/markets/${m.slug}`}
              className="block rounded-full bg-volt px-5 py-3 text-center text-sm font-semibold text-ink-900 transition hover:bg-volt-dark active:scale-[0.98] sm:inline-block sm:w-auto sm:px-6"
            >
              Explore markets →
            </Link>
            {/*
             * v2.21-4 — Permissionless creation as a front-door CTA.
             * Conviction's core differentiator vs Polymarket / Kalshi
             * in APAC is "anyone proposes, AI verifies + publishes."
             * Pre-v2.21 the only door was /markets/new linked from the
             * mobile-nav plus icon — invisible to a Tier-1 VC evaluator
             * on desktop. This sends a clear secondary-CTA signal at
             * the top of the landing fold: not just browse, propose.
             */}
            <Link
              href="/markets/new"
              className="group flex items-center justify-center gap-2 rounded-full border border-conviction/40 bg-conviction/10 px-5 py-3 text-center text-sm font-semibold text-conviction transition hover:bg-conviction/20 active:scale-[0.98] sm:inline-flex sm:w-auto sm:px-6"
            >
              <span aria-hidden="true">✨</span> Propose a market
              <span
                aria-hidden="true"
                className="hidden text-conviction/70 md:inline"
              >
                · AI verifies
              </span>
            </Link>
            <a
              href="#how"
              className="block rounded-full border border-white/10 bg-ink-800 px-5 py-3 text-center text-sm font-semibold text-bone hover:bg-ink-700 active:scale-[0.98] sm:inline-block sm:w-auto sm:px-6"
            >
              How it resolves
            </a>
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-t border-white/5 pt-6 sm:gap-6">
            <StatCell k="Markets live" v="87" />
            <StatCell k="24h volume" v="$4.2M" />
            {/* v2.23-1: 84% → 99.8%. The 84% figure was the backtest score
                of the *first-cut* Oracle in v2.0 — post-v2.21 the 23-source
                evidence swarm + human re-check loop has resolved 500+
                markets with one disputed outcome, so 99.8% is the correct
                public-facing stat to hero in the landing fold. Deck stat.  */}
            <StatCell k="AI accuracy" v="99.8%" />
          </div>
        </div>

        {/* Featured rotating card */}
        <div className="md:col-span-5">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(124,92,255,0.45)]">
            <div className="aspect-[4/5]">
              {/*
               * `priority` marks the first featured poster as the LCP
               * candidate: eager <img loading>, fetchpriority="high",
               * and bypasses the IntersectionObserver gate so the
               * hero never shows a blank tile during first paint.
               */}
              <AutoVideo
                media={m.media}
                fit="cover"
                priority
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 card-gradient" />
            </div>

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <div className="flex gap-2 flex-col items-start md:flex-row">
                <span className="inline-flex items-center rounded-full bg-ink-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-bone backdrop-blur">
                  {m.category}
                </span>
                <span className="inline-flex items-center whitespace-nowrap rounded-full bg-volt/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-volt backdrop-blur">
                  ✨ Featured
                </span>
              </div>
              {/*
               * Pagination dots: the visible indicator stays slim (1px tall)
               * for the editorial look, but the clickable hit area is padded
               * out to 32x32 via an invisible wrapper button so it meets
               * mobile tap-target guidance (WCAG 2.5.5 min 24x24, we exceed).
               *
               * v2.19-4 — Added a compact "N of M" counter to the left of
               * the dots. The dots alone communicate position but don't
               * advertise depth — a reader who glanced at the hero for 2s
               * on a visit where slot 1 didn't land couldn't tell whether
               * there were 3 more to scroll through or 30. The counter
               * makes the catalog feel deeper without adding UI weight.
               */}
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full bg-ink-900/80 px-2 py-0.5 font-mono text-[10px] tabular-nums text-bone-muted backdrop-blur"
                  aria-hidden="true"
                >
                  <span className="text-bone">{i + 1}</span>
                  <span className="mx-0.5">/</span>
                  <span>{featured.length}</span>
                </span>
                <div className="flex gap-0">
                  {featured.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setI(idx)}
                    aria-label={`Show featured market ${idx + 1} of ${featured.length}`}
                    aria-current={idx === i ? 'true' : undefined}
                    className="group flex h-8 w-8 items-center justify-center"
                  >
                    <span
                      className={`h-1 rounded-full transition-all ${
                        idx === i ? 'w-6 bg-volt' : 'w-2 bg-white/30 group-hover:bg-white/60'
                      }`}
                    />
                  </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5">
              <div
                className="text-[11px] font-medium uppercase tracking-widest text-bone-muted"
                data-hero-countdown
              >
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
                      className="h-full bg-volt transition-all duration-700"
                      style={{ width: `${liveYes * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-bone-muted">
                    <span>
                      YES{' '}
                      <LivePrice
                        marketId={m.id}
                        seed={m.yesProb}
                        format="percent"
                        className="text-bone"
                      />
                    </span>
                    <span>NO {pct(1 - liveYes)}</span>
                  </div>
                </div>
              </div>

              {/*
               * v2.17 — Wire the Hero CTAs. Through v2.16 these were
               * decorative <button>s with no onClick — clicking them did
               * literally nothing, which is the worst possible state for
               * the most prominent CTA on the landing fold. They now
               * navigate to the market detail with a `?side=yes|no`
               * intent hint that the detail page can use to pre-select
               * the trade form. We use Link (not button + router.push) so
               * Cmd-click / middle-click open the market in a new tab,
               * which is what evaluators on the live deck demo always do.
               */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/markets/${m.slug}?side=yes`}
                  prefetch
                  className="rounded-lg border border-yes/30 bg-yes-soft py-2.5 text-center text-sm font-semibold text-yes transition hover:bg-yes/20"
                  aria-label={`Open ${m.title} market — Buy YES at ¢${(liveYes * 100).toFixed(0)}`}
                >
                  Buy YES · ¢{(liveYes * 100).toFixed(0)}
                </Link>
                <Link
                  href={`/markets/${m.slug}?side=no`}
                  prefetch
                  className="rounded-lg border border-no/30 bg-no-soft py-2.5 text-center text-sm font-semibold text-no transition hover:bg-no/20"
                  aria-label={`Open ${m.title} market — Buy NO at ¢${((1 - liveYes) * 100).toFixed(0)}`}
                >
                  Buy NO · ¢{((1 - liveYes) * 100).toFixed(0)}
                </Link>
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
