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
    tag: '01 · Asia Native',
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
    tag: '02 · Evidence First',
    titleKey: 'onb.2.title',
    bodyKey: 'onb.2.body',
    bg: 'from-volt/20 via-ink-900 to-ink-900',
    visual: (
      <div className="space-y-2 rounded-2xl border border-volt/30 bg-ink-900 p-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-volt">
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          Oracle · Qwen3 → Sonnet-4.6
        </div>
        <div className="space-y-1.5 text-left">
          {['Weverse fan cafe heat', 'Melon streaming velocity', 'Naver ratings sentiment', 'LCK patch diff v14.3'].map(
            (s, i) => (
              <div
                key={s}
                className="flex items-center gap-2 rounded-md bg-ink-800 px-2 py-1.5 text-[11px] text-bone-muted"
              >
                <span
                  className={`h-2 w-2 rounded-full ${i < 3 ? 'bg-yes' : 'bg-volt'}`}
                />
                {s}
              </div>
            )
          )}
        </div>
        <div className="rounded-md bg-volt/10 px-2 py-1.5 text-center font-mono text-[11px] font-bold text-volt">
          Confidence · 0.88
        </div>
      </div>
    ),
  },
  {
    tag: '03 · Conviction feed',
    titleKey: 'onb.3.title',
    bodyKey: 'onb.3.body',
    bg: 'from-conviction/20 via-volt/10 to-ink-900',
    // v2.17 — Previous visual showed a static phone with right-rail icons
    // (♥ + ↗) but never taught the primary gestures: double-tap = YES,
    // single-tap = global mute. These are the main ways a reader
    // interacts with the feed, and leaving them to a source-code comment
    // was the biggest gulf-of-execution gap in the whole product. We now
    // label the two taps explicitly with a pulsing dot + caption.
    visual: (
      <div className="relative mx-auto h-52 w-36 overflow-hidden rounded-3xl border border-white/15 bg-ink-900">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-conviction/30 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 space-y-1">
          <div className="h-1 w-10 rounded-full bg-volt" />
          <div className="text-[10px] font-bold leading-tight text-bone">
            T1 wins Worlds 2026?
          </div>
          <div className="flex gap-1 pt-1">
            <div className="flex-1 rounded bg-yes/90 py-0.5 text-center text-[9px] font-bold text-ink-900">
              YES ¢71
            </div>
            <div className="flex-1 rounded bg-no/80 py-0.5 text-center text-[9px] font-bold text-ink-900">
              NO ¢29
            </div>
          </div>
        </div>
        {/* Double-tap gesture hint: pulsing ring centered on the card */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          <span className="absolute inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-volt/30" />
          <span className="relative inline-flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-volt text-[11px] font-bold text-ink-900">
            2×
          </span>
        </div>
        <div className="absolute left-2 top-2 rounded-md bg-ink-900/85 px-1.5 py-0.5 text-[9px] font-semibold text-volt">
          2× tap · YES
        </div>
        <div className="absolute right-2 top-2 rounded-md bg-ink-900/85 px-1.5 py-0.5 text-[9px] font-semibold text-bone-muted">
          1× tap · mute
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
