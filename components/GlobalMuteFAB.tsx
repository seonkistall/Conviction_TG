'use client';

import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { useMute } from '@/lib/mute';
import { useT } from '@/lib/i18n';

export function GlobalMuteFAB() {
  const { muted, toggle } = useMute();
  const t = useT();
  // v2.10 — on /feed we move mute control into the feed card itself
  // (single-tap on video area toggles mute, TikTok-style). Hiding the
  // floating FAB here stops it from overlapping the card title / stats
  // block on tall portrait viewports.
  const path = usePathname() ?? '/';
  const immersive = path === '/feed' || path.startsWith('/feed/');
  return (
    <button
      type="button"
      onClick={toggle}
      className={clsx(
        'fixed bottom-5 left-5 z-40 flex h-12 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold shadow-xl backdrop-blur transition md:bottom-6 md:left-6',
        immersive && 'hidden',
        muted ? 'bg-ink-800 text-bone-muted hover:text-bone' : 'bg-volt text-ink-900 hover:brightness-105'
      )}
      aria-label={muted ? t('mute.muted') : t('mute.unmuted')}
      aria-pressed={!muted}
    >
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
  );
}
