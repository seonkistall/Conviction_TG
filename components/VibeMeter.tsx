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
            <div
              key={v.topic}
              className="rounded-2xl border border-white/10 bg-ink-800 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl text-bone">{v.topic}</h3>
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
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SOURCE_TINT[s]}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
