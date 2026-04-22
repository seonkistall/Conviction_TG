'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect } from 'react';
import type { Market } from '@/lib/types';
import { formatUSD, pct, timeUntil } from '@/lib/format';
import { useParlay } from '@/lib/parlay';

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
}

export function FeedDetailSheet({ market, open, onClose }: Props) {
  const parlay = useParlay();

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

  const pickAndClose = (pick: 'YES' | 'NO', price: number) => {
    parlay.add({ marketId: market.id, pick, price });
    onClose();
  };

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

        {/* Price buttons — big and thumb-sized. Tapping either adds to
            Parlay Slip and closes the sheet; user confirms in the slip. */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => pickAndClose('YES', market.yesProb)}
            className="flex flex-col items-start rounded-xl border border-yes/40 bg-yes-soft px-4 py-3 text-left transition active:scale-[0.98]"
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
            onClick={() => pickAndClose('NO', 1 - market.yesProb)}
            className="flex flex-col items-start rounded-xl border border-no/40 bg-no-soft px-4 py-3 text-left transition active:scale-[0.98]"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-no/80">
              Buy NO
            </span>
            <span className="font-mono text-2xl font-bold text-no">
              ¢{Math.round((1 - market.yesProb) * 100)}
            </span>
          </button>
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

        <Link
          href={`/markets/${market.slug}`}
          className="mt-5 block rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-center text-sm font-semibold text-bone transition hover:bg-ink-700"
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
