'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import {
  buildActivityFeed,
  formatAge,
  type ActivityItem,
} from '@/lib/liveActivity';

/**
 * v2.26.2 — Floating live-activity stream for /feed.
 *
 * Top-of-viewport rolling chip stack of recent (synthesized) trades.
 *
 * Rolling cadence
 * ---------------
 *   - Tick interval: 1500ms (was 8000ms in v2.28-1; users found that
 *     too still — the stream needs to feel like an exchange, not a
 *     status board)
 *   - Visible count: 5 chips
 *   - On tick, ONE new chip slides in at the top (volt-bordered,
 *     "Just now"), the bottom chip fades out, the others slide down
 *     a slot. Avoids the v2.28-1 jarring full-replace.
 *
 * Honesty
 * -------
 * The "Demo Activity · stream" sub-label was removed at the user's
 * request — we want the ticker to read as live activity. A tiny ℹ
 * info icon at the right edge of each chip stack opens a tooltip
 * with the honest framing for due diligence purposes:
 *   "Synthesized from live trader roster · pre-launch beta"
 * This way casual visitors see live activity; a VC asking the
 * obvious question gets a documented answer in one tap.
 *
 * Visual rules
 * ------------
 *   - z-30 above feed cards but below modals
 *   - pointer-events: none on the wrapper so taps fall through
 *     to the FeedCard underneath; chips themselves are pointer-
 *     events: auto so they stay clickable as deep-links
 *   - prefers-reduced-motion → no rotation, render a static snapshot
 *   - tab visibility loss → pause the timer (CPU saver)
 */

const ROTATE_MS = 1500;     // 1.5s, within user-requested 1-2s range
// v2.26.3: dropped from 5 to 1 chip per user UX feedback — the 5-chip
// stack covered too much of the video. With 1 chip the ticker reads as
// "live ticker" without competing with the immersive content. Each
// rotation slides a new chip in (replacing the prior one) so the
// "live trading" signal still pulses every 1.5s.
const VISIBLE_COUNT = 1;

export function LiveActivityTicker() {
  // SSR-stable initial rotation. Client effect bumps it on a timer.
  const [rotation, setRotation] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const tick = () => {
      if (!paused) setRotation((r) => r + 1);
    };
    const id = window.setInterval(tick, ROTATE_MS);
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
      className="pointer-events-none absolute inset-x-0 top-[calc(max(env(safe-area-inset-top,0px),0.5rem)+3.25rem)] z-30 flex flex-col items-center gap-1 px-3"
    >
      {/*
       * v2.26.3: single-row layout. Chip + ℹ icon side-by-side via
       * a flex row instead of stacked. Cuts the ticker's vertical
       * footprint roughly in half (was ~210px with 5 chips, now ~32px
       * with 1 chip), freeing the top of the immersive video card.
       */}
      <div className="flex w-full max-w-[420px] items-center justify-center gap-1">
        {items.map((it, idx) => (
          <ActivityPill key={it.id} item={it} highlighted={idx === 0} />
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTooltipOpen((v) => !v);
          }}
          onBlur={() => window.setTimeout(() => setTooltipOpen(false), 150)}
          aria-label="About this activity stream"
          aria-expanded={tooltipOpen}
          className="pointer-events-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ink-900/80 text-[10px] font-semibold text-bone-muted/70 backdrop-blur transition hover:text-bone"
        >
          ℹ
        </button>
      </div>

      {tooltipOpen && (
        <div
          role="tooltip"
          className="pointer-events-auto mt-1 max-w-[260px] rounded-lg border border-white/10 bg-ink-900/95 px-3 py-2 text-[10px] leading-relaxed text-bone-muted shadow-xl backdrop-blur"
        >
          <div className="font-semibold uppercase tracking-widest text-bone">
            About this stream
          </div>
          <p className="mt-1">
            Synthesized from the live trader roster — sized to real
            stake ladders and consistent with current market prices.
            Real-fill stream lands at public launch.
          </p>
        </div>
      )}
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
        // v2.26.2: bumped bg from /85 to /92 + border from /10 to /20 so
        // the chips read clearly against dark video frames. Earlier
        // /85 over a black BLACKPINK frame made chips nearly invisible
        // at first glance — VC scan needs them obvious.
        'pointer-events-auto fade-in-down flex w-full max-w-[420px] items-center gap-2 overflow-hidden rounded-full border bg-ink-900/92 px-3 py-1.5 text-[11px] backdrop-blur transition hover:bg-ink-900',
        highlighted
          ? 'border-volt/50 shadow-[0_0_0_1px_rgba(198,255,61,0.22)]'
          : 'border-white/20 opacity-95'
      )}
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {item.avatar}
      </span>
      <span className="truncate font-mono text-bone">@{item.handle}</span>
      <span
        className={clsx(
          'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest',
          item.side === 'YES' ? 'bg-yes/15 text-yes' : 'bg-no/15 text-no'
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
