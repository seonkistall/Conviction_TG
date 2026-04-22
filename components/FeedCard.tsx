'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import type { Market } from '@/lib/types';
import { AutoVideo } from './AutoVideo';
import { EdgeBadge } from './EdgeBadge';
import { OutcomeBar } from './OutcomeBar';
import { ResolvedBanner } from './ResolvedBanner';
import { FeedDetailSheet } from './FeedDetailSheet';
import { formatUSD, pct, timeUntil } from '@/lib/format';
import { useParlay } from '@/lib/parlay';
import { useMute } from '@/lib/mute';
import { useT } from '@/lib/i18n';

interface Props {
  market: Market;
}

/*
 * v2.10 gesture constants.
 *
 * These were tuned against Galaxy S25 Ultra portrait (384×854) and iPhone
 * 14 (390×844). The goals were:
 *   - Double-tap window 260ms: fast enough not to trigger by accident when
 *     snap-scrolling (typical snap = 1 tap), slow enough that a deliberate
 *     double-tap on a small target still registers.
 *   - Swipe thresholds biased so that vertical snap-scroll always wins ties.
 *     The user is paging the feed 95% of the time; swipe-right is a
 *     shortcut, not a mis-grab waiting to happen.
 */
const DOUBLE_TAP_MS = 260;
const SWIPE_MIN_DX = 60;          // px — minimum horizontal distance
const SWIPE_MAX_DY = 40;          // px — maximum vertical drift allowed
const SWIPE_MAX_MS = 400;         // ms — must complete within this
const TAP_MAX_DX = 14;            // px — if moved more than this, it's a drag
const TAP_MAX_MS = 260;           // ms — if held longer, it's not a tap
const HEART_ANIM_MS = 900;        // lifespan of the heart pop overlay

/**
 * Full-viewport TikTok-style market card. Snaps vertically on a snap-feed
 * container. Right rail has vertical-stack action buttons (like / comment
 * / parlay / share) in the familiar short-form video UX.
 *
 * v2.10 gestures added on the video/overlay area (NOT on the right rail
 * buttons, CTAs, or title link — those keep their click semantics):
 *   - Single tap → toggle global mute (TikTok-like audio control).
 *   - Double tap → add YES leg to parlay + heart-burst animation overlay
 *     at the tap point. Only for binary, non-resolved markets.
 *   - Swipe right → open Parlay Slip drawer. Axis-locked so it never
 *     fights the vertical snap-feed scroll.
 */
export function FeedCard({ market }: Props) {
  const parlay = useParlay();
  const mute = useMute();
  const t = useT();
  const inParlay = parlay.hasLeg(market.id);
  const isResolved = market.status === 'resolved';
  const isBinary = market.kind === 'binary';

  // --- Heart-burst animation state -----------------------------------------
  // Each tap spawns a new heart with a unique id so React can track AnimatePresence.
  const [hearts, setHearts] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);

  // v2.11 — detail sheet open state. Controlled here (not in FeedClient)
  // because opening/closing is per-card and shouldn't bubble up.
  const [infoOpen, setInfoOpen] = useState(false);

  const popHeart = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    setHearts((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, HEART_ANIM_MS);
  }, []);

  // --- Touch-state refs ----------------------------------------------------
  // We intentionally use refs rather than state for raw touch coords so
  // we don't re-render on every move event. The React state only flips
  // on actual resolved gestures.
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTapAt = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t0 = e.touches[0];
    if (!t0) return;
    touchStart.current = { x: t0.clientX, y: t0.clientY, t: Date.now() };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t1 = e.changedTouches[0];
      if (!t1) return;
      const dx = t1.clientX - start.x;
      const dy = t1.clientY - start.y;
      const dt = Date.now() - start.t;

      // --- Swipe-right → open parlay slip ---
      // Must be mostly-horizontal, rightward, fast, and of meaningful magnitude.
      if (
        dx > SWIPE_MIN_DX &&
        Math.abs(dy) < SWIPE_MAX_DY &&
        Math.abs(dx) > Math.abs(dy) * 1.5 &&
        dt < SWIPE_MAX_MS
      ) {
        parlay.toggle(true);
        return;
      }

      // --- Tap detection ---
      // If the finger barely moved and the press was short, treat as tap.
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx > TAP_MAX_DX || absDy > TAP_MAX_DX || dt > TAP_MAX_MS) return;

      const now = Date.now();
      const isDouble = now - lastTapAt.current < DOUBLE_TAP_MS;

      if (isDouble) {
        // Reset so a third tap doesn't chain-fire as another double.
        lastTapAt.current = 0;
        if (!isResolved && isBinary) {
          parlay.add({
            marketId: market.id,
            pick: 'YES',
            price: market.yesProb,
          });
          // Coordinate in element-local space so the heart animates at the
          // finger position, not the viewport origin.
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          popHeart(t1.clientX - rect.left, t1.clientY - rect.top);
        }
        return;
      }

      lastTapAt.current = now;
      // Single tap → toggle global mute. We wait one DOUBLE_TAP_MS window
      // before committing so we don't fire mute on the first half of a
      // double-tap. If a second tap comes in the branch above wins.
      window.setTimeout(() => {
        if (lastTapAt.current === now) {
          mute.toggle();
          lastTapAt.current = 0;
        }
      }, DOUBLE_TAP_MS + 10);
    },
    [isBinary, isResolved, market.id, market.yesProb, mute, parlay, popHeart]
  );

  return (
    <article className="relative h-[100dvh] w-full overflow-hidden bg-ink-900 snap-start">
      {/* Video background — full bleed */}
      <AutoVideo
        media={market.media}
        className={clsx(
          'absolute inset-0 h-full w-full',
          isResolved && 'grayscale'
        )}
        fit="cover"
      />
      <div className="pointer-events-none absolute inset-0 feed-overlay" />

      {/*
       * Gesture layer — sits ABOVE the video but BELOW the rail / CTAs /
       * top bar. Captures taps and swipes on the "empty" video area
       * without swallowing interactions with the action buttons. The
       * z-index hierarchy below:
       *   video           : z-0 (implicit)
       *   gesture layer   : z-[1]
       *   top bar         : z-10
       *   right rail      : z-10
       *   bottom content  : z-10
       *   heart overlay   : z-20 (must be above bottom content to be seen)
       * Because every interactive control has z-10+, they remain
       * clickable — the gesture layer only catches taps on the otherwise
       * bare video space.
       */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-hidden="true"
      />

      {/* Top bar — category + live */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 pt-[env(safe-area-inset-top,1rem)]">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-ink-900/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-bone backdrop-blur">
            {market.category}
          </span>
          {isResolved ? (
            <ResolvedBanner market={market} variant="chip" />
          ) : (
            <>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/60 px-2.5 py-1 text-[11px] text-bone-muted backdrop-blur">
                <span className="live-dot" />
                {timeUntil(market.endsAt)}
              </span>
              {market.edgePP && market.edgePP >= 5 && <EdgeBadge pp={market.edgePP} />}
            </>
          )}
        </div>
        {/* v2.10 — compact mute chip to replace the global FAB on /feed.
            Sits top-right so it doesn't fight the rail or title. */}
        <button
          type="button"
          onClick={mute.toggle}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-ink-900/70 text-bone-muted backdrop-blur hover:text-bone"
          aria-label={mute.muted ? 'Unmute' : 'Mute'}
          aria-pressed={!mute.muted}
        >
          {mute.muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 10v4h4l5 4V6L7 10H3zm13.59 2L19 14.41 20.41 13l-2.41-2.41 2.41-2.42L19 6.76l-2.41 2.41L14.17 6.76 12.76 8.17 15.17 10.59 12.76 13l1.41 1.41z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77S18.01 4.14 14 3.23z" />
            </svg>
          )}
        </button>
      </div>

      {/* Right rail actions */}
      <div className="absolute right-3 bottom-[22dvh] z-10 flex flex-col items-center gap-4 md:right-6 md:bottom-[18dvh]">
        <RailButton icon="♥" label={market.traders.toLocaleString()} />
        <RailButton icon="💬" label={Math.round(market.traders / 7).toLocaleString()} />
        {/*
         * v2.11 — Info button. Dev feedback #2: a single button that opens
         * the market's detail as a blurred sheet so the user can read
         * structured info without leaving the feed. Positioned between the
         * comment count and the parlay + button so the "information density"
         * stack reads: engage → discuss → inspect → act.
         */}
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/70 text-bone backdrop-blur transition hover:bg-ink-900"
          aria-label="View market details"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="8" />
            <line x1="12" y1="12" x2="12" y2="16" />
          </svg>
        </button>
        <span className="-mt-3 text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
          Info
        </span>
        {!isResolved && (
          <>
            <button
              type="button"
              onClick={() =>
                parlay.add({ marketId: market.id, pick: 'YES', price: market.yesProb })
              }
              className={clsx(
                'flex h-12 w-12 flex-col items-center justify-center rounded-full font-bold transition',
                inParlay
                  ? 'bg-volt text-ink-900 scale-105'
                  : 'bg-ink-900/70 text-volt hover:bg-ink-900 backdrop-blur'
              )}
              aria-label={t('feed.add_parlay')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
              </svg>
            </button>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
              {t('feed.add_parlay_short')}
            </span>
          </>
        )}
        <RailButton icon="↗" label="Share" />
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] pr-20 md:pr-24">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-bone-muted">
          {market.tags.slice(0, 3).map((tg) => (
            <span
              key={tg}
              className="rounded-full border border-white/10 bg-ink-900/60 px-2 py-0.5 backdrop-blur"
            >
              #{tg}
            </span>
          ))}
        </div>
        <Link
          href={`/markets/${market.slug}`}
          className="mt-2 block font-display text-2xl leading-[1.1] text-bone md:text-4xl"
        >
          {market.title}
        </Link>

        {/* YES/NO quick-bet for binary, outcome bar for multi, or settled banner */}
        {isResolved ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-bone-muted backdrop-blur">
            {t('market.settled_final')}
            {Math.round((market.closePrice ?? 0) * 100)}
          </div>
        ) : market.kind === 'binary' ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <QuickBet
              side="YES"
              price={market.yesProb}
              marketId={market.id}
            />
            <QuickBet
              side="NO"
              price={1 - market.yesProb}
              marketId={market.id}
            />
          </div>
        ) : (
          <div className="mt-4">
            <OutcomeBar market={market} compact />
          </div>
        )}

        {/* Stats strip */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-bone-muted">
          <span className="font-mono">
            <span className="text-bone">{pct(market.yesProb)}</span> {t('card.yes')}
          </span>
          <span>·</span>
          <span>{formatUSD(market.volume)} {t('card.vol')}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-volt" />
            AI {Math.round(market.aiConfidence * 100)}
          </span>
        </div>
      </div>

      {/*
       * Heart-burst overlay. One <span> per active tap, positioned
       * relative to the card so the heart appears exactly under the
       * finger. `pointer-events-none` so it never swallows follow-up taps.
       * The actual animation is a simple scale/translate/opacity keyframe
       * declared in globals.css as `.heart-burst`.
       */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
        {hearts.map((h) => (
          <span
            key={h.id}
            className="heart-burst absolute -translate-x-1/2 -translate-y-1/2 text-5xl"
            style={{ left: h.x, top: h.y }}
          >
            ♥
          </span>
        ))}
      </div>

      {/*
       * v2.11 — Detail sheet. Rendered per-card but only mounts its DOM
       * when open (the component returns null otherwise). This keeps the
       * feed list light — N cards do NOT mean N always-mounted dialogs.
       */}
      <FeedDetailSheet
        market={market}
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
      />
    </article>
  );
}

function RailButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 text-bone drop-shadow-lg"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/70 text-xl backdrop-blur transition hover:bg-ink-900">
        {icon}
      </span>
      <span className="text-[10px] font-semibold text-bone-muted">{label}</span>
    </button>
  );
}

function QuickBet({
  side,
  price,
  marketId,
}: {
  side: 'YES' | 'NO';
  price: number;
  marketId: string;
}) {
  const parlay = useParlay();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        parlay.add({ marketId, pick: side, price });
      }}
      className={clsx(
        'flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-widest backdrop-blur transition hover:scale-[1.02]',
        side === 'YES'
          ? 'border-yes/40 bg-yes-soft text-yes hover:bg-yes/20'
          : 'border-no/40 bg-no-soft text-no hover:bg-no/20'
      )}
    >
      <span>{side}</span>
      <span className="font-mono tabular-nums">¢{Math.round(price * 100)}</span>
    </button>
  );
}
