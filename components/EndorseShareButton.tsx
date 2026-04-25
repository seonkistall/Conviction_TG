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
 * v2.29-3 — "Endorse this market" share button on /markets/[id].
 *
 * Why a separate button (vs. the existing MarketHeroShare)?
 * ---------------------------------------------------------
 * MarketHeroShare drops a /markets/[slug] URL whose OG card is the
 * impersonal "BLACKPINK · YES ¢62 · AI conf 71%" — fine for a topic
 * announcement, but not personal. The endorsement receipt adds the
 * sharer's identity ("@oracle.seoul ENDORSES YES @ ¢62"), turning a
 * topic share into a stance share. That's the difference between
 * retweeting an article and quote-tweeting it with your own take —
 * the latter drives 3-4x the engagement on X.
 *
 * Token shape
 * -----------
 * Reuses the /share/p/[token] route with `kind: 'tip'` + `sh: 0`,
 * `ap === cp === currentPrice`. The OG renderer detects the tip
 * variant and swaps the P&L hero for the stance line. No new route
 * needed; one share infra serves both flavors.
 *
 * UX
 * ---
 * The hero already shows the AI's recommended side. We default the
 * endorsement side to that AI side (the user clicked Share BECAUSE
 * they agreed with what they saw), but the user can flip it via a
 * tiny popover that appears on hover/long-press. Mobile has no
 * hover, so the popover opens on the first tap; the second tap
 * commits.
 */
interface Props {
  marketId: string;
  marketSlug: string;
  /** Current YES probability (0..1). */
  yesProb: number;
  /** AI-implied side, used as the default endorsement direction. */
  aiSide: 'YES' | 'NO';
  className?: string;
}

export function EndorseShareButton({
  marketId,
  marketSlug,
  yesProb,
  aiSide,
  className,
}: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fire = useCallback(
    async (side: 'YES' | 'NO') => {
      if (busy) return;
      setBusy(true);
      setPickerOpen(false);
      try {
        // Stance price = current market YES probability for YES,
        // (1 - yesProb) for NO. This matches what the user is "buying"
        // in spirit: their endorsement is "I think this market price
        // is right today".
        const stancePrice = side === 'YES' ? yesProb : 1 - yesProb;
        const cents = Math.round(stancePrice * 10000) / 10000;
        const payload: SharePayload = {
          m: marketId,
          s: side,
          sh: 0,                        // 0 = tip / no position
          ap: cents,
          cp: cents,
          h: CURRENT_USER.handle,
          k: 'tip',
        };
        const token = encodeSharePayload(payload);
        const origin =
          typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : 'https://conviction.markets';
        const url = `${origin}/share/p/${token}`;
        const xText = `My take on Conviction · ${side} @ ¢${Math.round(stancePrice * 100)}`;

        // Native share sheet on mobile, X intent + clipboard on desktop —
        // same path the position receipt uses.
        if (
          typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function'
        ) {
          try {
            await navigator.share({
              title: 'My take on Conviction',
              text: xText,
              url,
            });
            return;
          } catch (err) {
            if ((err as DOMException)?.name === 'AbortError') return;
          }
        }
        try {
          if (
            typeof navigator !== 'undefined' &&
            navigator.clipboard?.writeText
          ) {
            await navigator.clipboard.writeText(url);
          }
        } catch {
          /* ignore */
        }
        const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          xText
        )}&url=${encodeURIComponent(url)}`;
        if (typeof window !== 'undefined') {
          window.open(xIntent, '_blank', 'noopener,noreferrer');
        }
        toast.push({
          kind: 'trade',
          title: 'Endorsement copied',
          body: 'Opened X composer in a new tab.',
          amount: `${side} ¢${Math.round(stancePrice * 100)}`,
        });
      } finally {
        window.setTimeout(() => setBusy(false), 600);
      }
    },
    [busy, marketId, marketSlug, toast, yesProb]
  );

  return (
    <div className={clsx('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => {
          // First tap opens the picker so the user can confirm the side.
          // Defaulting to fire() on first click would lock people into
          // the AI side without seeing they had a choice.
          if (pickerOpen) {
            fire(aiSide);
            return;
          }
          setPickerOpen(true);
        }}
        aria-label="Endorse this market"
        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-bone-muted backdrop-blur transition hover:bg-ink-900 hover:text-bone disabled:opacity-50"
        disabled={busy}
      >
        <span aria-hidden="true">↗</span> Endorse
      </button>
      {pickerOpen && (
        <div
          role="menu"
          aria-label="Pick endorsement side"
          className="absolute right-0 top-full z-30 mt-1 flex gap-1 rounded-full border border-white/10 bg-ink-800 p-1 shadow-xl"
        >
          <button
            type="button"
            onClick={() => fire('YES')}
            className="rounded-full bg-yes-soft px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-yes hover:bg-yes/30"
          >
            YES
          </button>
          <button
            type="button"
            onClick={() => fire('NO')}
            className="rounded-full bg-no-soft px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-no hover:bg-no/30"
          >
            NO
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            aria-label="Cancel"
            className="rounded-full px-2 py-1 text-[11px] text-bone-muted hover:text-bone"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
