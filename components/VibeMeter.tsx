'use client';

import { VIBE_SIGNALS } from '@/lib/markets';
import { useT } from '@/lib/i18n';

const SOURCE_TINT: Record<string, string> = {
  weverse: 'bg-[#FF8AB4]/20 text-[#FF8AB4]',
  x: 'bg-white/10 text-bone',
  reddit: 'bg-[#FF4500]/20 text-[#FF4500]',
  youtube: 'bg-[#FF0000]/20 text-[#FF0000]',
  instiz: 'bg-conviction/20 text-conviction',
};

// v2.20-4 — Hover tooltip per source chip. Aligns with the "explain the
// swarm" work we did in the Evidence sheet (v2.17-8) and the
// /methodology page (v2.20-2) — same providers, same one-line story.
const SOURCE_WHY: Record<string, string> = {
  weverse: 'K-pop + J-pop artist-owned community. Comeback anticipation spikes live here 2–3 days before press.',
  x: 'Global real-time graph. Ticker velocity + quote-graph stance signals.',
  reddit: 'Subreddit-level heat — fandom concentration + comment ranking.',
  youtube: 'YouTube Data v3 — MV velocity, live-viewer rank, comment sentiment.',
  instiz: 'Korean netizen aggregation site (Instiz / theqoo) — early K-consensus pulse.',
};

export function VibeMeter() {
  const t = useT();
  return (
    <section className="mx-auto max-w-[1440px] px-6 pt-12 sm:pt-16">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FF8AB4]/30 bg-[#FF8AB4]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-[#FF8AB4]">
          Cultural Signal Desk
        </div>
        <h2 className="mt-3 font-display text-3xl text-bone sm:text-4xl md:text-5xl">
          {t('vibe.title')}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-bone-muted">{t('vibe.sub')}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {VIBE_SIGNALS.map((v) => {
          const pct = Math.round((v.score * 0.5 + 0.5) * 100); // -1..1 → 0..100
          return (
            /*
             * v2.20-4 — Whole card is now a <button> that opens the
             * command palette pre-seeded with this topic. Pre-v2.20
             * the VibeMeter was purely decorative: evaluators saw
             * "BLACKPINK reunion · score 82" and had no action to
             * take. Now a tap hands the topic straight to ⌘K so the
             * next step is obvious (find markets that trade this
             * narrative). The synthetic Ctrl+K keydown is the same
             * dispatch pattern Header's search button uses, and the
             * pre-seed via window event means CommandPalette doesn't
             * need to know about VibeMeter specifically — it just
             * consumes a plain custom event.
             */
            <button
              type="button"
              key={v.topic}
              onClick={() => {
                if (typeof window === 'undefined') return;
                window.dispatchEvent(
                  new CustomEvent('cv:palette:seed', { detail: v.topic })
                );
                window.dispatchEvent(
                  new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    bubbles: true,
                  })
                );
              }}
              aria-label={`Search markets related to ${v.topic}`}
              className="group rounded-2xl border border-white/10 bg-ink-800 p-5 text-left transition hover:border-conviction/40 hover:bg-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conviction"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl text-bone transition group-hover:text-conviction">
                  {v.topic}
                </h3>
                <span className="font-mono text-2xl font-bold tabular-nums text-bone">
                  {pct}
                </span>
              </div>

              {/* Scale bar */}
              <div className="relative mt-3 h-2 overflow-hidden rounded-full">
                <div className="absolute inset-0 vibe-track opacity-30" />
                <div
                  className="absolute top-0 h-full"
                  style={{
                    left: `${pct}%`,
                    transform: 'translateX(-50%)',
                    width: 6,
                    background: '#F2F0EA',
                    boxShadow: '0 0 10px rgba(255,255,255,0.6)',
                  }}
                />
              </div>

              {/* Sparkline */}
              <svg
                viewBox="0 0 96 24"
                className="mt-3 h-8 w-full"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke={v.score >= 0 ? '#C6FF3D' : '#EF4444'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={v.sparkline
                    .map((p, i) => `${(i / (v.sparkline.length - 1)) * 96},${24 - p * 22 - 1}`)
                    .join(' ')}
                />
              </svg>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-bone-muted">
                  {v.volume.toLocaleString()} mentions · 24h
                </span>
                <div className="flex gap-1">
                  {v.sources.map((s) => (
                    <span
                      key={s}
                      title={SOURCE_WHY[s] ?? s}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SOURCE_TINT[s]}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              {/* "Open in search" affordance — matches the chip pattern
                  used elsewhere (Leaderboard, trader profiles). Invisible
                  until hover so the card itself stays the primary scan. */}
              <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-bone-muted opacity-0 transition group-hover:opacity-100">
                <span>Find markets</span>
                <span aria-hidden="true">→</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
