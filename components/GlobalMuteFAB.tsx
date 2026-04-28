'use client';

import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMute } from '@/lib/mute';
import { useT } from '@/lib/i18n';

const FIRST_TAP_KEY = 'cv_mute_fab_hinted_v1';

export function GlobalMuteFAB() {
  const { muted, toggle } = useMute();
  const t = useT();
  // v2.10 — on /feed we move mute control into the feed card itself
  // (single-tap on video area toggles mute, TikTok-style). Hiding the
  // floating FAB here stops it from overlapping the card title / stats
  // block on tall portrait viewports.
  const path = usePathname() ?? '/';
  const immersive = path === '/feed' || path.startsWith('/feed/');

  /*
   * v2.20-7 — First-visit "Tap to hear" hint.
   *
   * Every card lands muted (Chrome autoplay policy forces mute=1 for
   * the initial paint; we unmute via postMessage only after the user
   * taps the FAB). On a first visit the user saw silent videos with
   * no obvious way to turn sound on — the FAB was bottom-left, icon-
   * only on mobile, and in an unexpected spot.
   *
   * We now attach a pulsing volt ring + a speech-bubble caption for
   * the first ~6 seconds of a user's first session. Once they tap
   * (or close the session), we set a localStorage flag so the hint
   * never fires again. On /feed the whole FAB is already hidden, so
   * the hint never shows there either.
   */
  const [hinting, setHinting] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || immersive) return;
    try {
      if (localStorage.getItem(FIRST_TAP_KEY)) return;
    } catch {
      return;
    }
    setHinting(true);
    const t = window.setTimeout(() => setHinting(false), 6000);
    return () => window.clearTimeout(t);
  }, [immersive]);

  const onClick = () => {
    toggle();
    if (hinting) {
      setHinting(false);
      try {
        localStorage.setItem(FIRST_TAP_KEY, '1');
      } catch {}
    }
  };

  return (
    <div
      className={clsx(
        'fixed md:right-auto z-40 md:bottom-6 md:left-6 bottom-16 right-3 left-auto',
        immersive && 'hidden'
      )}
    >
      {/* v2.20-7 — Speech-bubble hint. Fades in alongside the pulsing
          ring for 6s on first visit, then disappears for good. Pointer-
          events-none so it never intercepts the FAB's tap. */}
      {hinting && muted && (
        <div
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 w-max max-w-[220px] rounded-lg border border-volt/40 bg-ink-900/95 px-3 py-2 text-xs text-bone shadow-xl md:text-sm translate-x-[-70%] md:translate-x-0 flex flex-col md:flex-row"
          role="status"
          aria-live="polite"
        >
          <span className="font-semibold text-volt">🔊 Tap to hear</span>
          <span className="ml-1 text-bone-muted">— videos start muted</span>
          <span
            aria-hidden="true"
            className="absolute right-6 md:right-auto left-auto md:left-6 top-full -mt-1 h-2 w-2 rotate-45 border-b border-r border-volt/40 bg-ink-900"
          />
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'relative flex h-12 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold shadow-xl backdrop-blur transition',
          muted ? 'bg-ink-800 text-bone-muted hover:text-bone' : 'bg-volt text-ink-900 hover:brightness-105'
        )}
        aria-label={muted ? t('mute.muted') : t('mute.unmuted')}
        aria-pressed={!muted}
      >
        {hinting && muted && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full border-2 border-volt/70"
          />
        )}
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 5L6 9H2v6h4l5 4V5zm7.07 1.93l-1.41 1.41C17.42 9.1 18 10.47 18 12s-.58 2.9-1.34 3.66l1.41 1.41C19.27 15.82 20 13.99 20 12s-.73-3.82-1.93-5.07zM22.07 2.93l-1.41 1.41C22.25 5.93 23 8.86 23 12s-.75 6.07-2.34 7.66l1.41 1.41C23.98 19.19 25 15.72 25 12s-1.02-7.19-2.93-9.07z" />
          </svg>
        ) : (
          <div className="flex h-4 items-center gap-[3px]">
            <span className="wave-bar block h-full w-[3px] rounded-full bg-ink-900" />
            <span className="wave-bar block h-full w-[3px] rounded-full bg-ink-900" />
            <span className="wave-bar block h-full w-[3px] rounded-full bg-ink-900" />
            <span className="wave-bar block h-full w-[3px] rounded-full bg-ink-900" />
          </div>
        )}
        <span className="hidden md:inline">{muted ? t('mute.muted') : t('mute.unmuted')}</span>
      </button>
    </div>
  );
}
