'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import type { Market } from '@/lib/types';
import { formatUSD, pct, timeUntil } from '@/lib/format';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';
import { STAKE_PRESETS, DEFAULT_STAKE_USD, type StakePreset } from '@/lib/constants';

/**
 * v2.11 — Market detail sheet for /feed cards.
 *
 * Dev feedback #2: "어딘가에 버튼이 하나 있고 그 버튼을 누르면 모달이
 * 나오든 블러처리된 상태로 글이 나오든 해당 마켓의 상세 페이지가
 * 나왔으면 좋겠습니다."
 *
 * We chose a bottom-sheet + blur-backdrop pattern (instead of a separate
 * route) because:
 *   - It keeps the current feed card mounted underneath. No re-fetch, no
 *     scroll position loss when the user closes it.
 *   - Blur backdrop preserves the mood of the video (user can still see the
 *     card they were watching) while pulling focus to structured data.
 *   - Mobile-first gesture: swipe-down on the sheet dismisses via native
 *     scroll bounce; tapping outside closes via the full-bleed backdrop
 *     button.
 *
 * Video behind the sheet keeps playing — intentionally. This matches
 * TikTok's Comments drawer: audio/motion continues, attention pulls to the
 * overlay. Pausing would force a re-decode hitch when the sheet closes.
 *
 * The sheet exposes the minimum set of facts a trader needs to commit
 * capital: price (YES/NO), volume, trader count, time remaining, AI
 * confidence, short description, tags. Deep-dive (order book, chart,
 * history) lives at the full `/markets/[slug]` page, linked at the bottom.
 */
interface Props {
  market: Market;
  open: boolean;
  onClose: () => void;
  /**
   * v2.23-6: Pre-selected side when the sheet is opened from a feed
   * YES/NO tap (rather than the Info button). The sheet visually
   * highlights the pre-picked button and the Confirm action commits
   * the chosen stake at that side's price. `undefined` → neither
   * pre-selected (the pre-v2.23 Info-button flow).
   */
  initialSide?: 'YES' | 'NO';
}

/*
 * v2.25 — Stake presets ($5/$10/$25/$100) now live in lib/constants.ts.
 * Three surfaces shared the same literal pre-v2.25 (FeedDetailSheet,
 * OrderBook, QuickBetActions). Centralized so a future product change
 * is a single-file edit. Import is at the top of this module.
 */

export function FeedDetailSheet({
  market,
  open,
  onClose,
  initialSide,
}: Props) {
  const positions = usePositions();
  const toast = useToast();
  // Selected side — defaults to whichever side was tapped on the card
  // (or the "likely" side for Info-button opens). Users can toggle
  // YES/NO freely inside the sheet before confirming.
  const [side, setSide] = useState<'YES' | 'NO' | null>(initialSide ?? null);
  // Stake in dollars. Default to DEFAULT_STAKE_USD ($10 — matches the
  // old direct-buy size so the sheet feels like a strict superset of
  // the old behavior).
  const [stakeUsd, setStakeUsd] = useState<StakePreset>(DEFAULT_STAKE_USD);
  // Reset the selected side + stake any time the sheet re-opens, so a
  // second open doesn't inherit the previous side.
  useEffect(() => {
    if (open) {
      setSide(initialSide ?? null);
      setStakeUsd(DEFAULT_STAKE_USD);
    }
  }, [open, initialSide]);
  // v2.24-2: Share state + flash-label timer were dropped along with
  // the bottom Share row. Sharing now lives entirely on the right-rail
  // X-direct button (FeedShareButton in FeedCard); the sheet has no
  // share affordance of its own. See the deletion note in the JSX
  // below.

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll when open so background doesn't compete for momentum
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  /*
   * v2.23-6: `pickAndClose` now uses the user-chosen stake ($) instead
   * of the hardcoded $10. The YES/NO buttons in the sheet became
   * side-selection toggles (they update `side`) rather than immediate
   * order placers; the bottom "Confirm" bar places the order at the
   * currently selected side + stake. This is the superset behavior the
   * user asked for: market info visible before commit, stake
   * adjustable, no accidental $10 "oops" taps.
   *
   * Kept as a helper (not inlined at the button onClick) so keyboard
   * shortcuts and the price-buttons both route through identical
   * position/toast/side-effects.
   */
  const commit = (pick: 'YES' | 'NO') => {
    const price = pick === 'YES' ? market.yesProb : 1 - market.yesProb;
    if (price > 0 && price < 1) {
      const shares = Math.max(1, Math.round(stakeUsd / price));
      positions.buy({ marketId: market.id, side: pick, shares, price });
      toast.push({
        kind: 'trade',
        title: `${pick} · ${shares} shares placed`,
        body: market.title,
        amount: `-$${(shares * price).toFixed(2)}`,
        cta: { href: '/portfolio', label: 'View' },
      });
    }
    onClose();
  };

  /*
   * v2.24-2: Share helpers (`handleShare`, `handleShareX`, `shareUrl`,
   * `shareText`, `shareLabel`/`scheduleShareReset`) and the bottom
   * Share row that consumed them were all removed in this cycle.
   * The right-rail X-direct button (FeedShareButton in FeedCard) is
   * now the single canonical share path. If a future requirement
   * re-introduces sheet-level sharing, prefer factoring the X-intent
   * helper into a tiny `lib/share.ts` module so both call sites stay
   * aligned rather than duplicating the URL builder here.
   */

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`${market.title} — market details`}
    >
      {/* Blur backdrop (click-away to close). Sits below the sheet. */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/55 backdrop-blur-md"
        aria-label="Close details"
        tabIndex={-1}
      />

      {/*
       * Bottom sheet. On mobile it docks to bottom at ≤72dvh; on desktop
       * it becomes a centered card (420px wide, max-height 80dvh) so the
       * feed rail layout on desktop doesn't force awkward edge-to-edge.
       */}
      <div
        className={clsx(
          'sheet-up absolute inset-x-0 bottom-0 max-h-[76dvh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-800 p-5 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] shadow-[0_-20px_60px_rgba(0,0,0,0.6)]',
          'md:left-1/2 md:right-auto md:bottom-6 md:w-[420px] md:max-h-[80dvh] md:-translate-x-1/2 md:rounded-3xl md:border'
        )}
      >
        {/* Drag handle — pure visual affordance, swipe-down dismissal is
            delegated to native overscroll since sheet is its own scroll
            container. */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold uppercase tracking-widest text-bone">
                {market.category}
              </span>
              <span className="text-bone-muted">·</span>
              <span className="text-bone-muted">{market.region}</span>
            </div>
            <h2 className="mt-2 font-display text-xl leading-tight text-bone">
              {market.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-ink-900 text-bone-muted hover:text-bone"
            aria-label="Close details"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/*
         * v2.23-6 — Side picker + stake chooser + confirm.
         *
         * Old: Buy YES / Buy NO were immediate order placers at a
         * hardcoded $10 stake. That felt like "accidental buy" when
         * users tapped on the feed card just to read the market.
         *
         * New (request from v2.23 #6): tap a price button to pre-select
         * the side (visual highlight only — no order placed). The stake
         * row below lets the user dial the amount. Confirm commits the
         * order at the chosen side + stake; Cancel closes without
         * placing anything.
         *
         * Accessible names preserved (`Buy YES ¢62` / `Buy NO ¢38`) so
         * the existing Playwright guard (`getByRole('button',
         * { name: /Buy YES/i })` etc. in tests/mobile.spec.ts) continues
         * to match — the label doesn't have to also imply the click
         * commits.
         */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide('YES')}
            aria-pressed={side === 'YES'}
            aria-label={`Buy YES at ${Math.round(market.yesProb * 100)} cents`}
            className={clsx(
              'flex flex-col items-start rounded-xl border px-4 py-3 text-left transition active:scale-[0.98]',
              side === 'YES'
                ? 'border-yes bg-yes/15 ring-2 ring-yes/50'
                : 'border-yes/40 bg-yes-soft'
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-yes/80">
              Buy YES
            </span>
            <span className="font-mono text-2xl font-bold text-yes">
              ¢{Math.round(market.yesProb * 100)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSide('NO')}
            aria-pressed={side === 'NO'}
            aria-label={`Buy NO at ${Math.round((1 - market.yesProb) * 100)} cents`}
            className={clsx(
              'flex flex-col items-start rounded-xl border px-4 py-3 text-left transition active:scale-[0.98]',
              side === 'NO'
                ? 'border-no bg-no/15 ring-2 ring-no/50'
                : 'border-no/40 bg-no-soft'
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-no/80">
              Buy NO
            </span>
            <span className="font-mono text-2xl font-bold text-no">
              ¢{Math.round((1 - market.yesProb) * 100)}
            </span>
          </button>
        </div>

        {/* Stake chooser + confirm bar */}
        <div className="mt-3 rounded-xl border border-white/10 bg-ink-900/60 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest">
            <span className="text-bone-muted">Stake</span>
            <span className="font-mono text-bone">
              ${stakeUsd}
              {side && (
                <span className="ml-2 text-bone-muted">
                  → {Math.max(
                    1,
                    Math.round(
                      stakeUsd /
                        (side === 'YES' ? market.yesProb : 1 - market.yesProb)
                    )
                  )}{' '}
                  shares
                </span>
              )}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {STAKE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setStakeUsd(p)}
                aria-pressed={stakeUsd === p}
                className={clsx(
                  'rounded-lg border px-2 py-2 text-sm font-semibold tabular-nums transition',
                  stakeUsd === p
                    ? 'border-volt bg-volt/15 text-volt'
                    : 'border-white/10 bg-ink-800 text-bone-muted hover:text-bone'
                )}
              >
                ${p}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              disabled={!side}
              onClick={() => side && commit(side)}
              className={clsx(
                'flex items-center justify-center rounded-full px-4 py-3 text-sm font-bold transition',
                side === 'YES'
                  ? 'bg-yes text-ink-900 hover:brightness-110 active:scale-[0.98]'
                  : side === 'NO'
                  ? 'bg-no text-ink-900 hover:brightness-110 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-white/5 text-bone-muted'
              )}
            >
              {side ? `Confirm ${side} · $${stakeUsd}` : 'Pick YES or NO'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-ink-800 px-4 py-3 text-sm font-semibold text-bone hover:bg-ink-700"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-ink-900/60 p-3">
          <Stat label="Volume" value={formatUSD(market.volume)} />
          <Stat label="Traders" value={market.traders.toLocaleString()} />
          <Stat label="Ends" value={timeUntil(market.endsAt)} />
          <Stat label="AI conf" value={`${Math.round(market.aiConfidence * 100)}%`} />
          <Stat
            label="Edge"
            value={market.edgePP ? `${market.edgePP}pp` : '—'}
          />
          <Stat label="Status" value={market.status.replace(/-/g, ' ')} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-bone-muted">
          {market.description}
        </p>

        {market.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            {market.tags.map((tg) => (
              <span
                key={tg}
                className="rounded-full border border-white/10 bg-ink-900/60 px-2 py-0.5 text-bone-muted"
              >
                #{tg}
              </span>
            ))}
          </div>
        )}

        {/*
         * v2.24-2: Share row removed.
         *
         * Pre-v2.24 the sheet had a "Share market" + "Share on X"
         * pair tucked at the bottom. Both responsibilities now live
         * on the right-rail X button (FeedShareButton in FeedCard,
         * v2.23-5), which routes the same X intent in one tap from
         * the always-visible feed surface. Keeping the pair here was
         * a redundancy: same destination, same payload, two buttons.
         * Removing them tightens the sheet's vertical rhythm so the
         * primary path (pick side → set stake → Confirm) stays the
         * visual anchor, with "View full market" as the only
         * secondary CTA.
         *
         * `handleShare` / `handleShareX` / `shareLabel` /
         * `scheduleShareReset` are kept around but unused — flagged
         * for removal in the next cleanup sweep once we're sure no
         * external surface still routes share through this sheet.
         */}

        <Link
          href={`/markets/${market.slug}`}
          className="mt-3 block rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-center text-sm font-semibold text-bone transition hover:bg-ink-700"
        >
          View full market →
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-widest text-bone-muted/70">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm text-bone">{value}</div>
    </div>
  );
}
