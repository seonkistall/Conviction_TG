'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Market } from '@/lib/types';
import { AutoVideo } from './AutoVideo';
import { EdgeBadge } from './EdgeBadge';
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
          onOpen={() => openSheet(null)}
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
          <span aria-hidden="true" className="text-bone-muted/60">
            ·
          </span>
          <Link
            href={`/markets/${market.slug}?evidence=open`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-full border border-conviction/30 bg-conviction/10 px-1.5 py-0.5 font-mono text-[10px] text-conviction hover:bg-conviction/20"
          >
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-conviction" />
            23-src AI · {Math.round(market.aiConfidence * 100)}%
          </Link>
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
            <OutcomeBar market={market} compact />
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
 * localStorage so the state persists across reloads. Count shown is
 * `baseCount + liked? 1 : 0` so the card's trader count still
 * reflects the mock data but nudges by the user's own tap. Heart fills
 * + volt-tints when liked; icon stays outlined otherwise.
 */
const LIKE_STORAGE_KEY = 'cv_feed_likes_v1';
function readLikes(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LIKE_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function writeLikes(s: Set<string>) {
  try {
    localStorage.setItem(LIKE_STORAGE_KEY, JSON.stringify(Array.from(s)));
  } catch {}
}

function FeedLikeButton({
  marketId,
  baseCount,
}: {
  marketId: string;
  baseCount: number;
}) {
  const [liked, setLiked] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setLiked(readLikes().has(marketId));
  }, [marketId]);
  const onClick = () => {
    const set = readLikes();
    if (set.has(marketId)) {
      set.delete(marketId);
      setLiked(false);
    } else {
      set.add(marketId);
      setLiked(true);
    }
    writeLikes(set);
  };
  const count = baseCount + (mounted && liked ? 1 : 0);
  return (
    <RailButton
      icon={liked ? '♥' : '♡'}
      label={count.toLocaleString()}
      active={liked}
      onClick={onClick}
      aria-label={liked ? 'Remove like' : 'Like this market'}
    />
  );
}

/*
 * v2.23-5 — Comment button.
 *
 * Through v2.22-2 this popped a "Comments · coming soon" toast and
 * routed to the market detail page. That was technically honest
 * but functionally dead — a big heart between Like and Info with
 * no payoff. Per v2.23 #5 feedback, Comment now shares the same
 * bottom-sheet surface as the Info button: opens FeedDetailSheet
 * in read mode (no pre-picked side), where the reader can see
 * structured market facts + the discussion area (ships in a follow-
 * up cut next to the share/stake row in the sheet). `onOpen` is
 * piped from FeedCard's `openSheet(null)` helper.
 */
function FeedCommentButton({
  baseCount,
  onOpen,
}: {
  baseCount: number;
  onOpen: () => void;
}) {
  return (
    <RailButton
      icon="💬"
      label={baseCount.toLocaleString()}
      aria-label="View market · Comments"
      onClick={onOpen}
    />
  );
}

/*
 * v2.23-5 — Share button. X-direct.
 *
 * Through v2.22-2 this was a three-tier chain (Web Share API →
 * clipboard → X.com intent), designed for mobile natives to pick
 * their preferred channel. In practice testers reported that the
 * Web Share API on desktop silently fell through to clipboard,
 * which felt like "nothing happened" — and mobile users were also
 * asking for X specifically because that's where the APAC crowd
 * they want to share with actually lives.
 *
 * New behavior: tap Share → open `x.com/intent/tweet` in a new
 * tab/window with the market title + URL pre-filled, every time.
 * On mobile, iOS/Android will auto-redirect the intent URL into
 * the installed X app via deep-link if present.
 *
 * The toast still fires so the user gets visible feedback that the
 * tap registered (popup blockers sometimes eat the window.open
 * silently on desktop).
 */
function FeedShareButton({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const toast = useToast();
  const onShare = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/markets/${slug}`;
    // Includes the canonical @conviction_apac handle so any reshare
    // on X threads back to the brand without us having to pay to
    // acquire the namespace ourselves.
    const text = `${title} — live on @conviction_apac`;
    const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(xHref, '_blank', 'noopener,noreferrer');
    toast.push({
      kind: 'trade',
      title: 'Opening X',
      body: 'Compose tweet with market link',
      cta: { href: url, label: 'Copy link' },
    });
  };
  return (
    <RailButton
      icon="𝕏"
      label="Share"
      aria-label="Share on X"
      onClick={onShare}
    />
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
const PROPOSER_POOL = [
  'ai.oracle.kr',
  'allora.lck',
  'qwen.drama',
  'sonnet.macro',
  'anime.signal.jp',
  'culturebae_',
  'lck.sharp',
  'seoulquant',
  'tokyo.macro',
  'shanghai.bull',
];

function feedProposerHandle(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return PROPOSER_POOL[hash % PROPOSER_POOL.length];
}
