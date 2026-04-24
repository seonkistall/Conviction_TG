/**
 * v2.25 — Shared share helper.
 *
 * Pre-v2.25 the X.com intent URL was rebuilt in three places:
 *   - components/FeedCard.tsx   (right-rail X-direct Share button)
 *   - components/FeedDetailSheet.tsx (since deleted in v2.24)
 *   - components/MarketHeroShare.tsx (market detail Share CTA)
 *
 * Whenever any one needed to change (handle rename, UTM tag, copy
 * tweak), the other two went stale until someone caught it. This
 * module is the canonical builder.
 */

import { BRAND_X_HANDLE } from './constants';

export interface ShareTarget {
  /** Human-readable market title or whatever the prefilled tweet should say */
  title: string;
  /** Absolute URL pointing at the market or page being shared */
  url: string;
}

/**
 * Build a fully-qualified `x.com/intent/tweet` URL with the brand
 * handle attribution baked in. Mobile X (iOS/Android) automatically
 * deep-links the intent URL into the installed app.
 *
 * @example
 *   const href = xIntentUrl({ title: market.title, url: shareUrl });
 *   window.open(href, '_blank', 'noopener,noreferrer');
 */
export function xIntentUrl({ title, url }: ShareTarget): string {
  const text = `${title} — live on @${BRAND_X_HANDLE}`;
  return `https://x.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`;
}

/**
 * Open the X compose tab for the given share target. No-op on the
 * server. Returns whether a window was opened (popup blockers can
 * silently swallow `window.open` on desktop — callers may want to
 * fire a toast confirmation regardless).
 */
export function openXIntent(target: ShareTarget): boolean {
  if (typeof window === 'undefined') return false;
  const href = xIntentUrl(target);
  const win = window.open(href, '_blank', 'noopener,noreferrer');
  return win !== null;
}
