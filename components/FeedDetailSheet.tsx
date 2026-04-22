'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import type { Market } from '@/lib/types';
import { formatUSD, pct, timeUntil } from '@/lib/format';
import { useParlay } from '@/lib/parlay';
import { useToast } from '@/lib/toast';

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
  const toast = useToast();
  // "Share" button state. We flash a "Copied!" label for 1.4s after a
  // clipboard-path share so the user has a visible acknowledgement even
  // when no native Web Share chooser opened.
  const [shareLabel, setShareLabel] = useState<'default' | 'copied' | 'shared'>(
    'default'
  );

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

  /**
   * Share flow — three-tier fallback.
   *
   *   1. navigator.share (Web Share API). Opens the native iOS / Android
   *      share sheet; on Chrome desktop this is no-op-ish (falls into 2).
   *   2. Copy to clipboard. Works everywhere modern, toast confirms.
   *   3. X.com intent URL. Opens Twitter/X compose in a new tab. Used as
   *      an explicit secondary button ("Share on X") so it's discoverable
   *      even when 1/2 already worked.
   *
   * Intentionally skipped: KakaoTalk SDK. It needs a registered app key
   * and a DOM-loaded SDK — a deep-link URL scheme (kakaotalk://) only works
   * inside the KakaoTalk in-app browser. Not worth the bundle weight for
   * v2.12 demo scope.
   */
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/markets/${market.slug}`
      : `/markets/${market.slug}`;
  const shareText = `${market.title} · Conviction`;

  const handleShare = async () => {
    const data = { title: shareText, text: shareText, url: shareUrl };
    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        // canShare isn't standard yet — feature-detect before asserting.
        (!navigator.canShare || navigator.canShare(data))
      ) {
        await navigator.share(data);
        setShareLabel('shared');
        window.setTimeout(() => setShareLabel('default'), 1400);
        return;
      }
    } catch {
      // User dismissed the share sheet — fall through to clipboard.
    }
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setShareLabel('copied');
        window.setTimeout(() => setShareLabel('default'), 1400);
        toast.push({
          kind: 'trade',
          title: 'Link copied',
          body: shareUrl,
        });
        return;
      }
    } catch {}
    // Last-ditch: X.com intent. Only reached if both share and clipboard
    // are unavailable — extremely rare on any modern browser.
    if (typeof window !== 'undefined') {
      const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(shareUrl)}`;
      window.open(xHref, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareX = () => {
    if (typeof window === 'undefined') return;
    const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xHref, '_blank', 'noopener,noreferrer');
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

        {/*
         * Share row. Primary button goes through the three-tier fallback
         * (native share → clipboard → X intent). Secondary button jumps
         * straight to X.com compose for a one-tap Twitter share even when
         * the native sheet would've also worked. Kept compact so the
         * "View full market" CTA stays the visual anchor.
         */}
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm font-semibold text-bone transition hover:bg-ink-700"
            aria-label="Share this market"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="m8.59 13.51 6.83 3.98" />
              <path d="m15.41 6.51-6.82 3.98" />
            </svg>
            {shareLabel === 'copied'
              ? 'Link copied'
              : shareLabel === 'shared'
              ? 'Shared'
              : 'Share market'}
          </button>
          <button
            type="button"
            onClick={handleShareX}
            className="flex items-center justify-center rounded-xl border border-white/10 bg-ink-900 px-3 py-3 text-sm font-semibold text-bone transition hover:bg-ink-700"
            aria-label="Share on X"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2H21.5l-7.56 8.635L23 22h-6.938l-5.43-7.106L4.4 22H1.13l8.086-9.236L1 2h7.112l4.911 6.49L18.244 2zm-1.217 18h1.83L7.084 4h-1.97L17.027 20z" />
            </svg>
          </button>
        </div>

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
