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

/**
 * Build a Threads share intent URL. Deep-links into the app when
 * installed, falls back to threads.net on desktop.
 */
export function threadsIntentUrl({ title, url }: ShareTarget): string {
  const text = `${title} — live on @${BRAND_X_HANDLE}\n${url}`;
  return `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
}

export function openThreadsIntent(target: ShareTarget): boolean {
  if (typeof window === 'undefined') return false;
  const href = threadsIntentUrl(target);
  const win = window.open(href, '_blank', 'noopener,noreferrer');
  return win !== null;
}

/**
 * Instagram has no web intent API — copies the link to clipboard then
 * opens instagram.com (deep-links into the app on mobile).
 */
export async function openInstagramShare({ url }: ShareTarget): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    await navigator.clipboard.writeText(url);
  } catch { /* clipboard denied */ }
  window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Native Web Share API (OS-level share sheet on iOS / Android).
 * Returns `false` if unavailable or user cancelled.
 */
export async function openNativeShare({ title, url }: ShareTarget): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.share) return false;
  try {
    await navigator.share({ title, url });
    return true;
  } catch {
    return false;
  }
}


/**
 * v2.28 (F-10) — TG-aware share. When the user is inside Telegram,
 * prefer a t.me deeplink so the receiving group-chat member taps
 * once and lands directly on the market inside the Mini App. On a
 * regular browser, fall through to the existing X intent.
 *
 * Conventions for the deeplink payload mirror TelegramAdapter:
 *   market_<slug>  → /markets/<slug>
 *   feed           → /feed
 *   propose        → /markets/new
 */
import { isInTelegram, tgDeeplink, openTelegramLink } from './tgWebApp';

export interface TgShareTarget {
  /** Visible tweet/message text seed (typically the market title). */
  title: string;
  /** start_param value (e.g. `market_btc-150k-eoy`). */
  startApp: string;
  /** Web fallback URL — used when isInTelegram() is false. */
  fallbackUrl: string;
}

/**
 * Open the appropriate share surface for the runtime context.
 * Inside TG: TG share-to-chat sheet pointing at the deeplink.
 * Outside TG: native Web Share API → clipboard → X intent (in that order).
 *
 * Returns true when a share surface was actually opened.
 */
export async function openContextShare(target: TgShareTarget): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (isInTelegram()) {
    const link = tgDeeplink(target.startApp);
    const intent =
      'https://t.me/share/url?url=' +
      encodeURIComponent(link) +
      '&text=' +
      encodeURIComponent(target.title + ' — live on Conviction');
    openTelegramLink(intent);
    return true;
  }

  // Web Share first
  const shared = await openNativeShare({
    title: target.title,
    url: target.fallbackUrl,
  });
  if (shared) return true;

  // Clipboard fallback
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(target.fallbackUrl);
      return true;
    }
  } catch {
    /* clipboard denied */
  }

  // X intent last
  return openXIntent({ title: target.title, url: target.fallbackUrl });
}

