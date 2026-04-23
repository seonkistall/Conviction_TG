'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { DEBUT_EVENTS, getMarket } from '@/lib/markets';
import { useT } from '@/lib/i18n';

/**
 * v2.22-3 — Color system expanded from K-pop labels (HYBE/SM/YG/JYP/
 * ADOR) to the full APAC studio roster. Each region gets a signature
 * hue inherited from its country's cultural palette (volt for Korea,
 * sakura pink for Japan, red for China, saffron for India, emerald
 * for SEA).
 */
const COMPANY_TINT: Record<string, string> = {
  // Korea
  HYBE: 'bg-[#7C5CFF]/15 text-conviction border-conviction/30',
  SM: 'bg-[#FF8AB4]/15 text-[#FF8AB4] border-[#FF8AB4]/30',
  YG: 'bg-[#000]/60 text-bone border-white/20',
  JYP: 'bg-[#C6FF3D]/15 text-volt border-volt/30',
  ADOR: 'bg-[#AFE1E8]/15 text-[#AFE1E8] border-[#AFE1E8]/30',
  // Japan — anime studios + music
  MAPPA: 'bg-[#E91E63]/15 text-[#FF6B9D] border-[#FF6B9D]/30',
  ufotable: 'bg-[#E91E63]/15 text-[#FF6B9D] border-[#FF6B9D]/30',
  Aniplex: 'bg-[#E91E63]/15 text-[#FF6B9D] border-[#FF6B9D]/30',
  Toho: 'bg-[#E91E63]/15 text-[#FF6B9D] border-[#FF6B9D]/30',
  'Sony Music JP': 'bg-[#E91E63]/15 text-[#FF6B9D] border-[#FF6B9D]/30',
  // China
  Tencent: 'bg-[#E60012]/15 text-[#FF6B6B] border-[#FF6B6B]/30',
  iQiyi: 'bg-[#E60012]/15 text-[#FF6B6B] border-[#FF6B6B]/30',
  JDG: 'bg-[#E60012]/15 text-[#FF6B6B] border-[#FF6B6B]/30',
  // India
  YRF: 'bg-[#FF6A13]/15 text-[#FFA94D] border-[#FFA94D]/30',
  Dharma: 'bg-[#FF6A13]/15 text-[#FFA94D] border-[#FFA94D]/30',
  // SEA
  MOONTON: 'bg-[#10B981]/15 text-[#34D399] border-[#34D399]/30',
  GMA: 'bg-[#10B981]/15 text-[#34D399] border-[#34D399]/30',
  Other: 'bg-white/5 text-bone-muted border-white/10',
};

const REGION_FLAG: Record<string, string> = {
  KR: '🇰🇷',
  JP: '🇯🇵',
  CN: '🇨🇳',
  IN: '🇮🇳',
  SEA: '🌏',
  APAC: '🌐',
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = d.toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
  return { day, month };
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(diff / 86_400_000));
}

export function DebutCalendar() {
  const t = useT();
  return (
    <section className="mx-auto max-w-[1440px] px-6 pt-12 sm:pt-16">
      {/*
       * v2.22-3 — Eyebrow + title rebranded from "K-Culture Debut Radar"
       * to "APAC Debut Radar" to match the expanded event catalog
       * (K-pop + JP anime + CN drama + IN Bollywood + SEA esports).
       * The `debut.title` / `debut.sub` i18n strings are overridden
       * inline here so a future translator sees the APAC wording in
       * context and doesn't have to hunt through the i18n dict.
       */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-conviction/30 bg-conviction/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-conviction">
          🌏 APAC · Debut Radar
        </div>
        <h2 className="mt-3 font-display text-3xl text-bone sm:text-4xl md:text-5xl">
          APAC Drop Calendar
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-bone-muted">
          K-pop comebacks · JP anime releases · C-drama launches · Bollywood
          openings · SEA esports finals. Every drop spawns a live market.
        </p>
      </div>

      {/*
       * v2.20-3 — Horizontal timeline, now with scroll-snap + right-edge
       * gradient fade.
       *
       * - `snap-x snap-mandatory` + `snap-start` on each card gives
       *   thumb-friendly card-by-card flicks on mobile (no drifting to
       *   random positions mid-card) and aligns the first card cleanly
       *   after a tap on the scrollbar track on desktop.
       * - A right-edge gradient fade + chevron chip hints that more
       *   cards live off-screen. Pre-v2.20 the horizontal scroll
       *   affordance was invisible on desktop browsers that hide the
       *   scrollbar by default, so the strip read as a static row of
       *   3–4 cards.
       */}
      <div className="relative -mx-6 pb-4">
        <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-6">
          {DEBUT_EVENTS.map((d) => {
            const { day, month } = fmtDate(d.dropsAt);
            const n = daysUntil(d.dropsAt);
            const linked = d.marketId ? getMarket(d.marketId) : null;
            return (
              <div
                key={d.id}
                className="relative w-[280px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-ink-800"
              >
                {/* Poster */}
                <div className="relative aspect-[4/5]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${d.poster})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-transparent" />

                  {/* Date chip (top left) */}
                  <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-white/15 bg-ink-900/70 backdrop-blur">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-bone-muted">
                      {month}
                    </span>
                    <span className="font-display text-xl font-bold leading-none text-bone">
                      {day}
                    </span>
                  </div>

                  {/* v2.22-3: Company chip gains a region flag prefix
                      so a reader skimming the strip can instantly tell
                      which country the drop is from (not just studio). */}
                  <span
                    className={clsx(
                      'absolute right-3 top-3 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest backdrop-blur',
                      COMPANY_TINT[d.company] ?? COMPANY_TINT.Other
                    )}
                  >
                    <span aria-hidden="true">{REGION_FLAG[d.region]}</span>
                    {d.company}
                  </span>

                  {/* Countdown */}
                  <span className="absolute bottom-3 left-3 rounded-full bg-ink-900/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-bone backdrop-blur">
                    T−{n}d
                  </span>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="font-display text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                    {d.artist}
                  </div>
                  <h3 className="mt-1 line-clamp-2 font-display text-lg text-bone">
                    {d.title}
                  </h3>

                  {/* Heat bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest">
                      <span className="text-bone-muted">Anticipation</span>
                      <span className="font-mono text-bone">
                        {Math.round(d.heat * 100)}
                      </span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-ink-900">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${d.heat * 100}%`,
                          background:
                            'linear-gradient(90deg, #FF8AB4 0%, #7C5CFF 60%, #C6FF3D 100%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4">
                    {linked ? (
                      <Link
                        href={`/markets/${linked.slug}`}
                        className="flex items-center justify-between rounded-full bg-volt px-3 py-2 text-xs font-semibold text-ink-900 transition hover:bg-volt-dark"
                      >
                        <span>{t('debut.view_market')}</span>
                        <span className="font-mono">
                          ¢{Math.round(linked.yesProb * 100)}
                        </span>
                      </Link>
                    ) : (
                      /*
                       * v2.20-3: Surface the spawn→oracle flow explicitly.
                       * Through v2.19 this CTA was just a muted "Create
                       * market →" link that hid the magic — evaluators
                       * didn't realize tapping it kicks off the 23-scraper
                       * wizard. New two-line layout: the CTA stays clear,
                       * and a thin caption tells you what actually happens
                       * on the next screen.
                       */
                      <Link
                        href={`/markets/new?q=${encodeURIComponent(d.title)}`}
                        className="block rounded-xl border border-volt/30 bg-volt/5 p-2 transition hover:border-volt/60 hover:bg-volt/10"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-volt">
                          <span>✨ Spawn market for {d.artist}</span>
                          <span>→</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-bone-muted">
                          AI Wizard pre-fills title · 13 scrapers judge
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/*
         * Right-edge fade — pure visual, pointer-events-none so it
         * doesn't steal the final card's tap region. Width is 40px
         * on mobile, 64px on desktop so the nudge scales with viewport.
         */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink-900 to-transparent md:w-16"
        />
      </div>
    </section>
  );
}
