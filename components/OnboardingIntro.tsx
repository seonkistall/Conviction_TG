'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';

const STORAGE_KEY = 'cv_onboarded_v1';

interface Slide {
  tag: string;
  titleKey: string;
  bodyKey: string;
  visual: React.ReactNode;
  bg: string;
}

const slides: Slide[] = [
  {
    tag: '01 · APAC-native',
    titleKey: 'onb.1.title',
    bodyKey: 'onb.1.body',
    bg: 'from-conviction/30 via-ink-900 to-ink-900',
    visual: (
      <div className="grid grid-cols-3 gap-2 text-5xl">
        <div className="flex h-20 items-center justify-center rounded-2xl bg-[#FF8AB4]/10">💜</div>
        <div className="flex h-20 items-center justify-center rounded-2xl bg-conviction/10">🎮</div>
        <div className="flex h-20 items-center justify-center rounded-2xl bg-volt/10">⚾</div>
        <div className="flex h-20 items-center justify-center rounded-2xl bg-[#C47A00]/10">📺</div>
        <div className="flex h-20 items-center justify-center rounded-2xl bg-[#AFE1E8]/10">🟧</div>
        <div className="flex h-20 items-center justify-center rounded-2xl bg-white/5">🗳️</div>
      </div>
    ),
  },
  {
    /*
      v2.27-2: Slide 2 now pitches permissionless creation, not
      evidence. The previous evidence visual moved to Slide 3 below.
      Visual is a mocked wizard flow — user types a question, 13
      scrapers grade it, the market ships. This is the single
      clearest way to communicate Conviction's UGC-at-meme-speed
      moat in ~6 seconds of dwell.
    */
    tag: '02 · Permissionless',
    titleKey: 'onb.2.title',
    bodyKey: 'onb.2.body',
    bg: 'from-volt/20 via-ink-900 to-ink-900',
    visual: (
      <div className="space-y-2 rounded-2xl border border-volt/30 bg-ink-900 p-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-volt">
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          AI wizard · 45s
        </div>
        <div className="rounded-md border border-dashed border-volt/30 bg-ink-800 px-2 py-2 text-left text-[11px] italic text-bone">
          &quot;Will BLACKPINK release a full-group album in 2026?&quot;
        </div>
        <div className="space-y-1.5 text-left">
          {[
            { l: 'Parse + domain route', s: 'ok' },
            { l: '13-scraper grading', s: 'ok' },
            { l: 'Qwen3 resolution spec', s: 'ok' },
            { l: 'Sonnet-4.6 verify', s: 'ok' },
            { l: 'Publish live', s: 'run' },
          ].map((row) => (
            <div
              key={row.l}
              className="flex items-center gap-2 rounded-md bg-ink-800 px-2 py-1.5 text-[11px] text-bone-muted"
            >
              <span
                className={`h-2 w-2 rounded-full ${row.s === 'ok' ? 'bg-yes' : 'bg-volt'}`}
              />
              {row.l}
            </div>
          ))}
        </div>
        <div className="rounded-md bg-volt/10 px-2 py-1.5 text-center font-mono text-[11px] font-bold text-volt">
          Cost · $0.08 · shipped
        </div>
      </div>
    ),
  },
  {
    /*
      v2.27-2: Slide 3 now shows the Oracle evidence stack (moved
      from v2.17's gesture tutorial to here). Gesture hints live on
      the actual feed page now; this slide's job is to establish
      that every price is auditable — 23 sources, two-stage LLM
      judging, human signoff — and that you can drill into the
      evidence bundle on any market.
    */
    tag: '03 · Auditable oracle',
    titleKey: 'onb.3.title',
    bodyKey: 'onb.3.body',
    bg: 'from-conviction/20 via-volt/10 to-ink-900',
    visual: (
      <div className="space-y-2 rounded-2xl border border-conviction/30 bg-ink-900 p-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-conviction">
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          Evidence · 23 sources
        </div>
        <div className="space-y-1.5 text-left">
          {[
            'Weverse · BLACKPINK fan-cafe heat',
            'Naver · HYBE Q4-25 earnings call',
            'Melon · streaming velocity (7d)',
            'LA SoFi · ticketing block hold',
            'Chroma RAG · group-activity base rate',
          ].map((s) => (
            <div
              key={s}
              className="flex items-center gap-2 rounded-md bg-ink-800 px-2 py-1.5 text-[11px] text-bone-muted"
            >
              <span className="h-2 w-2 rounded-full bg-yes" />
              {s}
            </div>
          ))}
        </div>
        <div className="rounded-md bg-conviction/10 px-2 py-1.5 text-center font-mono text-[11px] font-bold text-conviction">
          Confidence · 0.88 · auditable
        </div>
      </div>
    ),
  },
];

export function OnboardingIntro() {
  const t = useT();
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink-900/80 backdrop-blur-sm md:items-center">
      <div
        className={clsx(
          'relative w-full max-w-md overflow-hidden rounded-t-3xl border-t border-white/15 bg-gradient-to-b md:rounded-3xl md:border',
          slide.bg
        )}
      >
        {/* Skip */}
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-ink-900/80 px-3 py-1 text-[11px] font-semibold text-bone-muted hover:text-bone"
        >
          {t('onb.skip')}
        </button>

        <div className="flex flex-col items-center gap-5 px-6 pb-6 pt-10 text-center md:px-8">
          {/* Visual */}
          <div className="w-full">{slide.visual}</div>

          {/* Tag */}
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-volt">
            {slide.tag}
          </div>

          {/* Copy */}
          <h2 className="font-display text-3xl leading-tight text-bone md:text-4xl">
            {t(slide.titleKey)}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-bone-muted">
            {t(slide.bodyKey)}
          </p>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={clsx(
                  'h-1.5 rounded-full transition-all',
                  i === idx ? 'w-8 bg-volt' : 'w-1.5 bg-white/20 hover:bg-white/40'
                )}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="flex w-full gap-2 pt-1">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => setIdx((n) => Math.max(0, n - 1))}
                className="rounded-full border border-white/10 bg-ink-900/80 px-5 py-3 text-sm font-semibold text-bone-muted hover:text-bone"
              >
                ←
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) {
                  close();
                } else {
                  setIdx((n) => Math.min(slides.length - 1, n + 1));
                }
              }}
              className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-volt to-volt-dark px-5 py-3 text-sm font-bold text-ink-900 hover:brightness-105"
            >
              {isLast ? t('onb.start') : t('onb.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
