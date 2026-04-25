'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { buildActivityFeed, formatAge, type ActivityItem } from '@/lib/liveActivity';

/**
 * v2.28-1 — Floating live-activity stream for /feed.
 *
 * Rolls a 4-item snapshot of recent (synthetic) trades along the top
 * of the immersive feed. Refreshes every 8 seconds with a smooth
 * top-fade-in. Designed to be the single most "this is alive" signal
 * a first-time visitor reads in their first 5 seconds on /feed.
 *
 * Visual rules:
 *   - Sits below Header territory but above feed cards (z-30).
 *   - Compact pill chips, one per item — handle + side + ¢ + age.
 *   - Newest item gets a subtle volt left-border + "Just now" label.
 *   - Click a chip → navigate to the market detail (preserves the
 *     intent: "I saw someone just trade BLACKPINK, take me there").
 *   - Hidden on the Feed end-of-feed terminator (no markets to ref).
 *   - Respects prefers-reduced-motion: the rotate is paused.
 *
 * Honest framing:
 *   - Renders a small "Demo activity" sub-label so users know this is
 *     not yet real. The shape (handles, sides, cents, stakes) is real;
 *     the volume is synthesized from the catalog. Same disclosure
 *     pattern Polymarket uses for its testnet feed.
 */
const ROTATE_MS = 8000;
const VISIBLE_COUNT = 4;

export function LiveActivityTicker() {
  // SSR-stable initial rotation. Client effect bumps it on a timer.
  const [rotation, setRotation] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Respect reduced-motion: render a static snapshot, no rotation.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const tick = () => {
      if (!paused) setRotation((r) => r + 1);
    };
    const id = window.setInterval(tick, ROTATE_MS);
    // Pause when the tab loses focus — saves CPU + avoids the "I came
    // back to a torrent of items" jarring effect.
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [paused]);

  const items = buildActivityFeed(rotation, VISIBLE_COUNT);

  return (
    <div
      role="region"
      aria-label="Live trader activity"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-[max(env(safe-area-inset-top),0.5rem)] z-30 flex flex-col items-center gap-1.5 px-3"
    >
      {items.map((it, idx) => (
        <ActivityPill key={it.id} item={it} highlighted={idx === 0} />
      ))}
      <div className="text-[9px] font-semibold uppercase tracking-widest text-bone-muted/60">
        Demo activity · stream
      </div>
    </div>
  );
}

function ActivityPill({
  item,
  highlighted,
}: {
  item: ActivityItem;
  highlighted: boolean;
}) {
  return (
    <Link
      href={`/markets/${item.marketSlug}`}
      className={clsx(
        'pointer-events-auto fade-in-down flex w-full max-w-[420px] items-center gap-2 overflow-hidden rounded-full border bg-ink-900/80 px-3 py-1.5 text-[11px] backdrop-blur transition hover:bg-ink-900',
        highlighted
          ? 'border-volt/40 shadow-[0_0_0_1px_rgba(198,255,61,0.15)]'
          : 'border-white/10 opacity-90'
      )}
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {item.avatar}
      </span>
      <span className="truncate font-mono text-bone">@{item.handle}</span>
      <span
        className={clsx(
          'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest',
          item.side === 'YES'
            ? 'bg-yes/15 text-yes'
            : 'bg-no/15 text-no'
        )}
      >
        {item.side}
      </span>
      <span className="shrink-0 font-mono tabular-nums text-bone-muted">
        ${item.stake} · ¢{item.cents}
      </span>
      <span className="ml-auto shrink-0 truncate text-bone-muted/80">
        {formatAge(item.ageSec)}
      </span>
    </Link>
  );
}
