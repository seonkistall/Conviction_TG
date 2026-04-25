'use client';

import { useCallback, useState } from 'react';
import clsx from 'clsx';
import {
  encodeSharePayload,
  type SharePayload,
} from '@/lib/shareToken';
import { CURRENT_USER } from '@/lib/markets';
import { useToast } from '@/lib/toast';

/**
 * v2.28-2 — "Share my conviction" button on /portfolio rows.
 *
 * The viral primitive
 * -------------------
 * Polymarket's most-shared object on X is the receipt: a screenshot
 * with "+$2,800 on Bitcoin > $100k" — instantly attributable, instantly
 * clickable. We need the same loop without forcing a screenshot.
 *
 * What this button does:
 *   1. Encodes the position snapshot (marketId, side, shares, avg, mark,
 *      handle) into a stateless base64url token via lib/shareToken.
 *   2. Builds a public URL: https://<host>/share/p/<token>
 *   3. Best-path UX:
 *      - On a device with `navigator.share`, hand off to native share
 *        sheet (iOS/Android) — that's where users are most reflexive
 *        about reposting.
 *      - Fallback: copy the URL to clipboard + open the X intent in a
 *        new tab so the user lands inside their composer pre-filled.
 *      - Toast confirms with "Link copied" so the click feels alive.
 *
 * The conversion math
 * -------------------
 * Each share link routes back to /share/p/<token> which has a hard CTA
 * to /markets/[slug]. The token persists the original mark price, so
 * any future reader sees the *same* number the original sharer saw —
 * even if the live price has since moved. This is honest (the receipt
 * is a snapshot of a moment) and stable (the OG card doesn't churn
 * 30 seconds after posting because the market ticked).
 */
interface Props {
  marketId: string;
  side: string;
  shares: number;
  avgPrice: number;
  /** Mark price at the moment of share — captured snapshot, not live. */
  markPrice: number;
  /** Optional override; defaults to CURRENT_USER.handle. */
  handle?: string;
  className?: string;
}

export function ShareConvictionButton({
  marketId,
  side,
  shares,
  avgPrice,
  markPrice,
  handle,
  className,
}: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const payload: SharePayload = {
        m: marketId,
        s: side,
        sh: shares,
        // Round prices to 4 decimal places — keeps the token short and
        // matches the ¢-cent rounding the OG card displays anyway.
        ap: Math.round(avgPrice * 10000) / 10000,
        cp: Math.round(markPrice * 10000) / 10000,
        h: handle ?? CURRENT_USER.handle,
      };
      const token = encodeSharePayload(payload);
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://conviction.markets';
      const url = `${origin}/share/p/${token}`;

      const pnl = shares * (markPrice - avgPrice);
      const sign = pnl >= 0 ? '+' : '';
      const pct = avgPrice > 0 ? (markPrice / avgPrice - 1) * 100 : 0;
      // X (Twitter) intent text — punchy, fits the 280-char ceiling
      // even with the full URL appended by X's auto-shortener.
      const xText = `${sign}$${pnl.toFixed(0)} on Conviction · ${side} ${shares.toLocaleString()} shares · ${sign}${pct.toFixed(1)}%`;

      // Native share sheet — best UX on mobile by far. Falls back
      // gracefully when the API isn't there (desktop Safari, all
      // desktop Firefox, in-app webviews on older Android).
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
      ) {
        try {
          await navigator.share({
            title: 'My Conviction',
            text: xText,
            url,
          });
          // navigator.share resolves on success; native handles its
          // own confirm UI so we keep the toast quiet here.
          return;
        } catch (err) {
          // User canceled the sheet — that's not a failure, just
          // bail without falling through to the X intent so we
          // don't double-fire.
          if ((err as DOMException)?.name === 'AbortError') return;
          // Otherwise fall through to clipboard+intent.
        }
      }

      // Desktop / fallback path: copy URL + pop X composer.
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(url);
        }
      } catch {
        // ignore — toast will still fire and the X intent is the
        // primary path on desktop.
      }

      const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        xText
      )}&url=${encodeURIComponent(url)}`;
      if (typeof window !== 'undefined') {
        window.open(xIntent, '_blank', 'noopener,noreferrer');
      }
      toast.push({
        kind: 'trade',
        title: 'Link copied',
        body: 'Opened X composer in a new tab.',
        amount: `${sign}$${pnl.toFixed(0)}`,
      });
    } finally {
      // Tiny debounce so accidental double-taps don't open two tabs.
      window.setTimeout(() => setBusy(false), 600);
    }
  }, [
    avgPrice,
    busy,
    handle,
    marketId,
    markPrice,
    shares,
    side,
    toast,
  ]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share my conviction"
      title="Share my conviction"
      className={clsx(
        'inline-flex items-center gap-1 rounded-md border border-white/10 bg-ink-900 px-2 py-1 text-[11px] text-bone-muted transition hover:bg-ink-700 hover:text-bone disabled:opacity-50',
        className
      )}
      disabled={busy}
    >
      <span aria-hidden="true">↗</span> Share
    </button>
  );
}
