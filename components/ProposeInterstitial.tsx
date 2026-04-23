'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * v2.21-2 — "Propose your own" interstitial for the /feed scroll.
 *
 * Context
 * -------
 * Permissionless market creation via Conviction AI is the single
 * biggest differentiator vs. Polymarket/Kalshi in APAC: anyone types
 * a question, the 23-scraper swarm builds a live market with an
 * evidence-graded oracle. Through v2.20 this story lived on
 * /markets/new only — invisible to a reader who spent 90 seconds
 * flicking through /feed on a phone.
 *
 * The interstitial injects the pitch into the flow the reader already
 * takes: every 5 markets they scroll past, they meet one of these as
 * a 100dvh snap-child. Matches FeedCard's shape exactly (same
 * viewport, same snap-start class), so scroll-snap-mandatory still
 * behaves correctly.
 *
 * What it shows
 * -------------
 * - Rotating placeholder questions, cycling every 2.6s. Each one is
 *   a real APAC-flavored prompt the user could literally propose.
 * - Pipeline strip ("Parse → 23 scrapers → Qwen3 → Sonnet → Live").
 * - One big CTA: "Propose a market →" linking to /markets/new with
 *   the currently-visible placeholder handed in as ?q= so the wizard
 *   pre-fills (pattern established by DebutCalendar in v2.20-3).
 *
 * Not a FeedCard
 * --------------
 * Deliberately different visual from FeedCard — no video, no price,
 * conviction-gradient background — so a returning reader doesn't
 * parse it as a market they already saw and quickly scroll past.
 * The contrast IS the affordance.
 */

const PROMPTS = [
  'Will IVE win Daesang at MAMA 2026?',
  'Does YOASOBI chart Billboard top 40 this year?',
  'Will JDG beat T1 at Worlds 2026?',
  'BTC closes above $180K before year-end?',
  'Does SRK\'s Pathaan 2 cross ₹500cr opening week?',
  'Will BOJ deliver its first rate cut by Q3?',
];

const PIPELINE = [
  { step: 'Parse', blurb: 'Intent + entity + horizon' },
  { step: '23 scrapers', blurb: 'Naver · Weverse · LoL API · NPB · CoinGecko…' },
  { step: 'Qwen3', blurb: 'Domain-native draft verdict' },
  { step: 'Sonnet-4.6', blurb: 'Calibration verify + publish' },
];

export function ProposeInterstitial() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setI((x) => (x + 1) % PROMPTS.length),
      2600
    );
    return () => clearInterval(t);
  }, []);

  const q = PROMPTS[i];
  const href = `/markets/new?q=${encodeURIComponent(q)}`;

  return (
    <article
      className="relative flex h-[100dvh] snap-start flex-col justify-end overflow-hidden bg-gradient-to-br from-conviction/20 via-ink-900 to-ink-900 pb-24 md:pb-16"
      aria-label="Propose your own market"
    >
      {/*
       * Ambient grid + volt glow.  Pure CSS so no extra paint cost.
       * The glow drifts in from the bottom-right to echo the "coming
       * from the AI" feel rather than a static panel.
       */}
      <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-40" />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-32 h-[60vh] w-[60vh] rounded-full bg-gradient-to-br from-volt/20 via-conviction/20 to-transparent blur-3xl"
      />

      <div className="relative z-10 mx-auto w-full max-w-[480px] px-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-volt/40 bg-volt/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-volt">
          <span aria-hidden="true">✨</span> Permissionless · Conviction AI
        </div>

        <h2 className="mt-4 font-display text-[32px] leading-[1.1] text-bone md:text-5xl">
          Got a thesis?
          <br />
          <span className="italic text-volt">Propose a market.</span>
        </h2>

        <p className="mt-3 max-w-sm text-sm leading-relaxed text-bone-muted">
          Anyone types a question. The 23-scraper swarm builds it into
          a tradable market with an evidence-graded oracle.
        </p>

        {/* Rotating prompt bubble. Fixed min-height avoids the surrounding
            layout twitching on rotation. Key={q} so the browser re-runs
            the opacity transition whenever the prompt changes. */}
        <div
          key={q}
          className="mt-5 min-h-[92px] rounded-2xl border border-white/15 bg-ink-800/70 p-4 backdrop-blur transition-opacity duration-500"
        >
          <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
            Try something like
          </div>
          <div className="mt-1 font-display text-lg leading-snug text-bone md:text-xl">
            "{q}"
          </div>
        </div>

        {/* Pipeline pill row — horizontal scroll on narrow viewports. */}
        <div className="no-scrollbar mt-4 flex snap-x gap-2 overflow-x-auto pb-1">
          {PIPELINE.map((p, idx) => (
            <div
              key={p.step}
              className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-white/10 bg-ink-800/70 px-3 py-1.5 backdrop-blur"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-volt text-[10px] font-bold text-ink-900">
                {idx + 1}
              </span>
              <div>
                <div className="text-[11px] font-semibold text-bone">
                  {p.step}
                </div>
                <div className="text-[9px] leading-tight text-bone-muted">
                  {p.blurb}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Primary CTA + secondary oracle peek. CTA carries the
            currently-visible prompt as ?q= so the wizard pre-fills
            (pattern from DebutCalendar in v2.20-3). */}
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={href}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-volt to-volt-dark px-5 py-3.5 text-sm font-bold text-ink-900 shadow-xl transition active:scale-[0.98]"
          >
            Propose via AI →
          </Link>
          <Link
            href="/methodology"
            className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-ink-900/70 px-4 py-2.5 text-xs font-semibold text-bone-muted backdrop-blur hover:text-bone"
          >
            How the oracle works
          </Link>
        </div>
      </div>
    </article>
  );
}
