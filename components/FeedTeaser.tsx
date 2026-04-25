'use client';

import Link from 'next/link';
import clsx from 'clsx';
import type { Market } from '@/lib/types';

/**
 * v2.29-1 — Landing-page feed teaser.
 *
 * Why this exists
 * ---------------
 * Polymarket and Kalshi both lead with a flat market grid. Their first-
 * visit funnel is: see grid → click a market → land on detail. That's
 * 3 taps before the user understands the *shape* of the product.
 *
 * Conviction's distinctive product is the immersive feed (TikTok of
 * prediction markets). But a first-time visitor on `/` wouldn't know
 * the feed exists unless they spotted the chrome rail on desktop or
 * scrolled to the trending strip — both lossy signals. This teaser
 * sits directly under the Hero, BEFORE TrendingStrip, so a 5-second
 * scroll past the Hero already reveals the feed format:
 *
 *   - 3 vertically-framed mini cards (the feed's native aspect ratio)
 *   - Each card carries a poster, title, AI conf pill, region badge
 *   - "TAP TO SWIPE" hint along the bottom — sells the gesture
 *   - Single CTA at the bottom: "Open the full feed →"
 *
 * Conversion intent
 * -----------------
 * Each mini card is a Link to `/feed?m=<slug>` — the v2.28-3 warm
 * landing path. Tapping a card drops the user into the immersive
 * feed positioned at that market with the order sheet open. Funnel
 * goes from "I spotted the feed on landing" to "I'm staring at YES/NO"
 * in one tap. The bottom CTA is the safety net for users who don't
 * have a specific market in mind yet.
 */
interface Props {
  /** Pre-filtered live markets (excludes resolved). Pass at least 3. */
  markets: Market[];
  /** Optional title override; defaults to a Korean+English headline. */
  title?: string;
}

export function FeedTeaser({ markets, title }: Props) {
  // Pick the top 3 trending live markets. If we have <3 we render
  // whatever's available — the layout adapts via CSS grid on desktop.
  const picks = markets
    .filter((m) => m.status !== 'resolved')
    .sort((a, b) => {
      // Trending first, then highest volume — same ranking the Hero
      // and TrendingStrip use, so the teaser feels consistent.
      if (a.trending !== b.trending) return a.trending ? -1 : 1;
      return (b.volume ?? 0) - (a.volume ?? 0);
    })
    .slice(0, 3);

  if (picks.length < 1) return null;

  return (
    <section
      aria-labelledby="feed-teaser-heading"
      className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-volt">
            The Feed
          </div>
          <h2
            id="feed-teaser-heading"
            className="mt-1 font-display text-2xl text-bone md:text-3xl"
          >
            {title ?? 'See what APAC is trading right now'}
          </h2>
        </div>
        {/*
         * Inline CTA on desktop — pairs with the bottom CTA on mobile.
         * Keeping both surfaces ensures the funnel works regardless of
         * which direction the user reads.
         */}
        <Link
          href="/feed"
          className="hidden shrink-0 items-center gap-1 rounded-full border border-volt/30 bg-volt/10 px-3.5 py-2 text-xs font-bold uppercase tracking-widest text-volt transition hover:bg-volt/20 md:inline-flex"
        >
          Open feed →
        </Link>
      </div>

      {/*
       * Cards row.
       *  - Mobile: horizontal snap-scroll (matches the feed-detail
       *    sheet's gallery feel)
       *  - md+: 3-column grid (each card stays at the feed's vertical
       *    aspect, so the desktop view honestly previews what mobile
       *    users will get)
       */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
        {picks.map((m) => (
          <TeaserCard key={m.id} m={m} />
        ))}
      </div>

      {/* Mobile-only bottom CTA — the desktop has it inline above. */}
      <div className="mt-5 flex justify-center md:hidden">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 rounded-full border border-volt/30 bg-volt/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-volt transition hover:bg-volt/20"
        >
          Open the full feed →
        </Link>
      </div>
    </section>
  );
}

function TeaserCard({ m }: { m: Market }) {
  const yesC = Math.round(m.yesProb * 100);
  const aiConf = Math.round(m.aiConfidence * 100);
  const aiImpliesYes = m.aiConfidence >= 0.5;
  return (
    <Link
      href={`/feed?m=${m.slug}`}
      aria-label={`${m.title} · open in feed`}
      className={clsx(
        'group relative block w-[78vw] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-ink-800 transition',
        // 9:16 vertical aspect — mirrors the feed's native frame.
        'aspect-[9/16]',
        // Desktop sizing: full column width, no flex shrink/grow needed.
        'sm:w-[60vw] md:w-auto'
      )}
    >
      {/* Poster — same asset the FeedCard uses, so the visual is
          consistent with what the user sees once they tap in.
          v2.29-5: explicit width/height (CSS overrides actual size,
          but the attrs let the browser allocate space pre-load and
          short-circuit the implicit aspect-ratio math — Lighthouse
          flags these as "unsized-images" otherwise). 480×270 is the
          underlying YouTube hqdefault size. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={m.media.poster}
        alt=""
        width={480}
        height={270}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      {/* Tinted overlay so the white text is readable on any poster. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40"
      />

      {/* Top-left: trending / AI edge pill */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        {m.trending ? (
          <span className="rounded-full bg-volt px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-900">
            Trending
          </span>
        ) : null}
        <span className="rounded-full border border-white/20 bg-ink-900/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-bone-muted backdrop-blur">
          AI {aiConf}%
        </span>
      </div>

      {/* Top-right: live cents (the YES probability) */}
      <div
        className={clsx(
          'absolute right-3 top-3 rounded-full border px-2.5 py-1 font-mono text-[12px] font-bold tabular-nums backdrop-blur',
          aiImpliesYes
            ? 'border-yes/40 bg-yes/15 text-yes'
            : 'border-no/40 bg-no/15 text-no'
        )}
      >
        ¢{yesC}
      </div>

      {/* Bottom: title + region + swipe hint */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
          {m.category} · {m.region}
        </div>
        <div className="mt-1 line-clamp-3 font-display text-base font-bold leading-snug text-bone md:text-lg">
          {m.title}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-volt">
          <span aria-hidden="true">↑</span> Tap to swipe
        </div>
      </div>
    </Link>
  );
}
