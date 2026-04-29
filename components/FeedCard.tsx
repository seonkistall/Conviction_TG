'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Market } from '@/lib/types';
import { AIEdgeBar } from './AIEdgeBar';
import { AutoVideo } from './AutoVideo';
import { OutcomeBar } from './OutcomeBar';
import { ResolvedBanner } from './ResolvedBanner';
import { FeedDetailSheet } from './FeedDetailSheet';
import { LivePrice } from './LivePrice';
import { useLivePrice } from '@/lib/livePrices';
import { formatUSD, pct, timeUntil } from '@/lib/format';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';
import { useMute } from '@/lib/mute';
import { useT } from '@/lib/i18n';
import {
  openXIntent,
  openThreadsIntent,
  openInstagramShare,
  openNativeShare,
} from '@/lib/share';
import { useWatchlist } from '@/lib/watchlist';

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
  const positions = usePositions();
  const toast = useToast();
  const mute = useMute();
  const t = useT();
  // v2.22-1: Parlay store removed. `hasPosition` replaces the old
  // `inParlay` ring on YES/NO quick-bets so the card still hints
  // "you already hold this side".
  const hasPosition = positions.hasPosition(market.id);
  const isResolved = market.status === 'resolved';
  const isBinary = market.kind === 'binary';
  // Resolved markets keep their settlement price frozen. Everyone else
  // feeds from the live-tick store so the numbers drift subtly.
  const liveYes = useLivePrice(market.id, market.yesProb);
  const displayYes = isResolved ? market.yesProb : liveYes;

  // --- Heart-burst animation state -----------------------------------------
  // Each tap spawns a new heart with a unique id so React can track AnimatePresence.
  const [hearts, setHearts] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);

  // v2.11 — detail sheet open state. Controlled here (not in FeedClient)
  // because opening/closing is per-card and shouldn't bubble up.
  const [infoOpen, setInfoOpen] = useState(false);
  /*
   * v2.23-6: Pre-selected side when the sheet is opened from a YES/NO
   * quick-bet tap (rather than the Info rail button). `null` means the
   * sheet was opened in pure read mode; YES/NO means the user already
   * expressed an intent and the sheet should highlight that side +
   * enable the Confirm button immediately.
   */
  const [pendingSide, setPendingSide] = useState<'YES' | 'NO' | null>(null);
  const openSheet = useCallback((withSide: 'YES' | 'NO' | null) => {
    setPendingSide(withSide);
    setInfoOpen(true);
  }, []);

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

      // v2.22-1: Swipe-right → open-parlay gesture removed along
      // with the rest of parlay. Horizontal swipes are now ignored
      // by the feed (vertical scroll is still native).

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
          /*
           * v2.23-6: Double-tap used to place a $10 YES position
           * directly. Per the v2.23 #6 feedback, that was too
           * committal for a gesture that people also use to "like"
           * content elsewhere — and a user who's just excited about
           * a market deserves to see the stake dial before the
           * money moves. Now: heart-burst still fires (the fun
           * part), and the detail sheet opens pre-picked to YES so
           * the user can confirm at their chosen stake.
           */
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          popHeart(t1.clientX - rect.left, t1.clientY - rect.top);
          openSheet('YES');
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
    [
      isBinary,
      isResolved,
      market.id,
      market.title,
      market.yesProb,
      mute,
      popHeart,
      positions,
      toast,
    ]
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

      {/*
       * Top bar — category + live.
       *
       * v2.26.3 — Pushed down by ~3rem (was top-0) to clear the
       * FeedClient back-chip + counter row that lives at top:0 z-20.
       * Pre-fix the back chip ("← Markets") at z-20 was drawing on
       * top of the FeedCard category chip ("MUSIC") at z-10; same
       * x-axis (left:16px), back chip at y=16-50, category chip at
       * y=4-29 — clear visual collision. Bumping the FeedCard chips
       * down by 3rem clears them below the back-chip row entirely.
       *
       * Also clears the LiveActivityTicker (1 chip + ℹ) which sits
       * at top:~3.25rem and is ~32px tall. Combined back-chip + ticker
       * area is ~6.5rem from the top; we land here just below that.
       */}
      <div className="absolute inset-x-0 top-[calc(max(env(safe-area-inset-top,0px),0.5rem)+6.25rem)] z-10 flex items-center justify-between px-4">
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
              {/*
               * v2.26.2: top-bar EdgeBadge removed to clear visual
               * space for the LiveActivityTicker (which sits just
               * below this row) and because the AIEdgeBar at the
               * bottom is now the canonical edge surface. Top bar
               * keeps category + countdown only — minimal metadata,
               * non-competing with the ticker chips.
               */}
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

      {/*
       * Right rail actions.
       *
       * v2.22-6: Bumped to `z-20` (up from `z-10`). The "Bottom content"
       * block below also sits at `z-10` and spans `inset-x-0` (even
       * though its *content* has `pr-20` right-padding to clear the
       * rail visually, the DIV itself still takes the full width and
       * intercepts pointer events). On small viewports (iPhone SE 375px,
       * Galaxy S9+ 320px) the rail's vertical midpoint lands inside
       * the bottom-content box, so clicks on the Info button got eaten
       * by the caption layer. Raising the rail's stack puts real
       * buttons above the decorative caption without changing layout.
       */}
      <div className="absolute right-3 bottom-[22dvh] z-20 flex flex-col items-center gap-4 md:right-6 md:bottom-[18dvh]">
        <FeedLikeButton marketId={market.id} baseCount={market.traders} />
        <FeedCommentButton
          baseCount={Math.round(market.traders / 7)}
        />
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
        {/* v2.22-2: Share rail button — Web Share API → clipboard
            fallback → X intent. Full tiered flow. */}
        <FeedShareButton
          title={market.title}
          slug={market.slug}
        />
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-[calc(env(safe-area-inset-bottom,0px)_+_1rem)] pr-20 md:pr-24 md:translate-y-0">
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

        {/*
         * v2.21-3 — "Proposed by @handle · 23-source AI {conf}%"
         * micro-byline.
         *
         * Double purpose:
         *   1. Surfaces the permissionless UGC story inline ("this
         *      market was proposed by someone, not us") on every feed
         *      card, so the "anyone-can-create" moat is legible
         *      without needing the ProposeInterstitial to be visible.
         *   2. Reinforces the 23-source AI oracle trust signal right
         *      next to the market title — no extra tap needed.
         *
         * The handle is a deterministic pick from a small pool hashed
         * on market.id so the same card consistently shows the same
         * proposer across re-renders. When real UGC ships the derivation
         * becomes a real field; the slot + visual shape stay identical.
         */}
        <div
          className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-bone-muted"
          aria-label={`Proposed by ${feedProposerHandle(market.id)}, AI confidence ${Math.round(
            market.aiConfidence * 100
          )} percent`}
        >
          <span className="font-mono text-bone-muted">
            Proposed by{' '}
            <Link
              href={`/traders/${feedProposerHandle(market.id)}`}
              className="text-bone hover:text-volt"
              onClick={(e) => e.stopPropagation()}
            >
              @{feedProposerHandle(market.id)}
            </Link>
          </span>
          {/*
           * v2.26.2: The compact "23-src AI · 78%" chip that used to
           * live here was promoted to the prominent AIEdgeBar below
           * the title. Removing the chip avoids saying the same thing
           * twice in the same vertical inch.
           */}
        </div>

        <Link
          href={`/markets/${market.slug}`}
          className="mt-2 block font-display text-2xl leading-[1.1] text-bone md:text-4xl"
        >
          {market.title}
        </Link>

        {/*
         * v2.26.2 — AI Edge meter.
         *
         * Placed directly between the title (the question) and the
         * YES/NO action row. Reading order becomes:
         *   1. Proposer + tags  (who is asking)
         *   2. Title            (what is being asked)
         *   3. AI Edge bar      (how much edge AI sees vs the market)
         *   4. YES / NO         (act)
         * VC scanning this card top-to-bottom in 30s reads the AI
         * moat as the bridge between the question and the action —
         * exactly where the differentiator belongs in the funnel.
         *
         * Hidden on resolved markets — the gap is academic once the
         * market has settled.
         */}
        {!isResolved ? (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <AIEdgeBar
              aiConfidence={market.aiConfidence}
              yesProb={displayYes}
            />
          </div>
        ) : null}

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
              price={displayYes}
              onOpen={() => openSheet('YES')}
            />
            <QuickBet
              side="NO"
              price={1 - displayYes}
              onOpen={() => openSheet('NO')}
            />
          </div>
        ) : (
          <div className="mt-4">
            {/*
              v2.26: Opt into MultiOutcomeSheet so tapping an outcome
              on a multi market (Korean election, LoL Worlds winner,
              etc.) pops the inline pick-+-stake-+-confirm UX instead
              of navigating away from the feed.
            */}
            <OutcomeBar market={market} compact useSheet />
          </div>
        )}

        {/* Stats strip */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-bone-muted">
          <span className="font-mono">
            <LivePrice
              marketId={market.id}
              seed={market.yesProb}
              format="percent"
              className="text-bone"
            />{' '}
            {t('card.yes')}
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
        initialSide={pendingSide ?? undefined}
      />
    </article>
  );
}

/*
 * v2.22-2 — RailButton is now a real interactive button with onClick
 * + optional `active` state. Used by FeedLikeButton, FeedCommentButton,
 * FeedShareButton below. The old display-only variant was a dead CTA
 * (flagged by the v2.21 logical-consistency sweep).
 */
function RailButton({
  icon,
  label,
  onClick,
  active = false,
  'aria-label': ariaLabel,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={onClick && active ? true : undefined}
      className={clsx(
        'press flex flex-col items-center gap-1 text-bone drop-shadow-lg',
        !onClick && 'cursor-default'
      )}
    >
      <span
        className={clsx(
          'flex h-12 w-12 items-center justify-center rounded-full text-xl backdrop-blur transition',
          active
            ? 'bg-volt text-ink-900'
            : 'bg-ink-900/70 hover:bg-ink-900'
        )}
      >
        {icon}
      </span>
      <span className="text-[10px] font-semibold text-bone-muted">{label}</span>
    </button>
  );
}

/*
 * v2.23-6 — QuickBet on the feed card is now a side-pre-select button
 * that opens the market detail sheet. It does NOT place an order
 * inline; the sheet's Confirm button commits at the user's chosen
 * stake. This prevents the "accidental $10" pattern that testers
 * reported.
 *
 * Shape of the button is unchanged (YES/NO + price cents) so the
 * visual rhythm of the feed card stays identical. Only the onClick
 * semantics moved.
 */
function QuickBet({
  side,
  price,
  onOpen,
}: {
  side: 'YES' | 'NO';
  price: number;
  onOpen: () => void;
}) {
  const [pulsing, setPulsing] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setPulsing(false);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setPulsing(true))
        );
        window.setTimeout(() => setPulsing(false), 420);
        onOpen();
      }}
      aria-label={`Open order sheet · ${side} at ${Math.round(price * 100)} cents`}
      className={clsx(
        'flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-widest backdrop-blur transition hover:scale-[1.02]',
        side === 'YES'
          ? 'border-yes/40 bg-yes-soft text-yes hover:bg-yes/20'
          : 'border-no/40 bg-no-soft text-no hover:bg-no/20',
        pulsing && 'animate-bet-pulse'
      )}
    >
      <span>{side}</span>
      <span className="font-mono tabular-nums">¢{Math.round(price * 100)}</span>
    </button>
  );
}

/*
 * v2.22-2 — Like button. Toggles a per-market "liked" bit in
 * localStorage so the state persists across reloads.
 *
 * v2.25: Storage moved to `lib/watchlist.ts` so /portfolio's new
 * Watchlist tab reads the exact same set. The local-only
 * `LIKE_STORAGE_KEY` + `readLikes`/`writeLikes` helpers that used to
 * live here are gone; `useWatchlist()` owns the key + serialization
 * round-trip now.
 */
function FeedLikeButton({
  marketId,
  baseCount,
}: {
  marketId: string;
  baseCount: number;
}) {
  const { has, toggle, hydrated } = useWatchlist();
  const liked = has(marketId);
  const count = baseCount + (hydrated && liked ? 1 : 0);
  return (
    <RailButton
      icon={liked ? '♥' : '♡'}
      label={count.toLocaleString()}
      active={liked}
      onClick={() => toggle(marketId)}
      aria-label={liked ? 'Remove from watchlist' : 'Add to watchlist'}
    />
  );
}

/*
 * v2.24-1 — Comment button: "Coming soon" demand-signal toast.
 *
 * v2.23-5 routed Comment → the market detail sheet, which gave
 * users *something* to look at but blurred the "discussion vs.
 * market info" affordance — Info already does the same thing,
 * and burying comments inside Info hid the demand signal.
 *
 * Per the v2.24 feedback round, the Comment tap is now a
 * dedicated "Coming soon" toast that explicitly tells the user
 * we've registered their interest and are routing it to the
 * team. That preserves the click-through demand signal (every
 * tap = one prioritization data point) while setting an honest
 * expectation that comments aren't shipped yet.
 *
 * Toast uses `kind: 'trade'` so the visual shape is consistent
 * with the rest of the Feed surface (same background, same
 * dismiss behavior) and includes a Notify-me CTA so users can
 * raise their hand more concretely if they want.
 */
function FeedCommentButton({
  baseCount,
}: {
  baseCount: number;
}) {
  const toast = useToast();
  return (
    <RailButton
      icon="💬"
      label={baseCount.toLocaleString()}
      aria-label="Comment — coming soon"
      onClick={() => {
        toast.push({
          kind: 'trade',
          title: 'Comments · coming soon',
          body: 'Tap registered. We\'ll let the team know there\'s demand for in-feed discussion.',
          cta: {
            href: 'mailto:beta@conviction.trade?subject=Notify%20me%20when%20Comments%20ship',
            label: 'Notify me',
          },
        });
      }}
    />
  );
}

function FeedShareButton({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareTarget = useCallback(() => {
    if (typeof window === 'undefined') return { title, url: '' };
    return { title, url: `${window.location.origin}/markets/${slug}` };
  }, [title, slug]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  const handleX = () => {
    setMenuOpen(false);
    const t = shareTarget();
    openXIntent(t);
    toast.push({
      kind: 'trade',
      title: 'Opening X',
      body: 'Compose tweet with market link',
      cta: { href: t.url, label: 'Copy link' },
    });
  };

  const handleThreads = () => {
    setMenuOpen(false);
    const t = shareTarget();
    openThreadsIntent(t);
    toast.push({
      kind: 'trade',
      title: 'Opening Threads',
      body: 'Compose post with market link',
      cta: { href: t.url, label: 'Copy link' },
    });
  };

  const handleInstagram = async () => {
    setMenuOpen(false);
    const t = shareTarget();
    await openInstagramShare(t);
    toast.push({
      kind: 'trade',
      title: 'Link copied · opening Instagram',
      body: 'Paste the link into your story or DM',
      cta: { href: t.url, label: 'Copy link' },
    });
  };

  const handleNative = async () => {
    setMenuOpen(false);
    const t = shareTarget();
    const shared = await openNativeShare(t);
    if (!shared) {
      try {
        await navigator.clipboard.writeText(t.url);
        toast.push({ kind: 'trade', title: 'Link copied', body: t.url });
      } catch {
        toast.push({ kind: 'trade', title: 'Share unavailable', body: 'Copy the link manually' });
      }
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <RailButton
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        }
        label="Share"
        aria-label="Share this market"
        onClick={() => setMenuOpen((v) => !v)}
      />

      {menuOpen && (
        <div
          className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-white/10 bg-ink-900/95 py-1.5 shadow-2xl backdrop-blur-xl"
          role="menu"
          aria-label="Share options"
        >
          <ShareMenuItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            }
            label="Instagram"
            onClick={handleInstagram}
          />
          <ShareMenuItem
            icon={
              <svg width="16" height="16" viewBox="0 0 192 192" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
              </svg>
            }
            label="Threads"
            onClick={handleThreads}
          />
          <ShareMenuItem
            icon={<span className="text-sm font-bold">𝕏</span>}
            label="X"
            onClick={handleX}
          />
          <div className="mx-2 my-1 border-t border-white/5" />
          <ShareMenuItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            }
            label="Share via…"
            onClick={handleNative}
          />
        </div>
      )}
    </div>
  );
}

function ShareMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-bone transition hover:bg-white/5 active:bg-white/10"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </button>
  );
}

/**
 * v2.21-3 — Deterministic proposer handle for the FeedCard byline.
 *
 * Picks from a fixed pool of real AI_TRADERS + TRADERS handles
 * already seeded in lib/markets.ts so the @handle links to a real
 * profile page. When real UGC ships, swap this for `market.proposer`
 * on the Market type — the call site stays identical.
 *
 * FNV-1a 32-bit hash keeps the picks stable across reloads: the same
 * market always shows the same proposer. Collisions are fine — multiple
 * markets can legitimately share a proposer (and the leaderboard will
 * eventually want to roll those up).
 */
/*
 * v2.26.4 — Proposer pool audit fix.
 *
 * Pre-fix the pool contained 5 handles that did not exist in either
 * AI_TRADERS or TRADERS (`culturebae_`, `lck.sharp`, `seoulquant`,
 * `tokyo.macro`, `shanghai.bull`). Since the proposer chip links to
 * `/traders/[handle]` and that route only static-resolves AI_TRADERS
 * entries, ~50% of "Proposed by @..." link clicks landed on the 404
 * page — a Tier-1 VC clicking through a single feed card had a coin-
 * flip chance of hitting "This market doesn't exist". Replaced the
 * bogus entries with the 8 catalog-verified AI trader handles from
 * lib/markets.ts. Duplication across markets is fine (the original
 * comment already noted "multiple markets can legitimately share a
 * proposer").
 */
const PROPOSER_POOL = [
  'ai.oracle.kr',
  'allora.lck',
  'qwen.drama',
  'sonnet.macro',
  'ai.vibe.jp',
  'lpl.scout',
  'anime.signal.jp',
  'npb.analytics',
];

function feedProposerHandle(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return PROPOSER_POOL[hash % PROPOSER_POOL.length];
}
