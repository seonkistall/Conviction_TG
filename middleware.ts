import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * v2.11 — Mobile-first landing redirect.
 *
 * Dev feedback #3: "유투브 앱 들어갈 때 요즘 숏츠가 먼저 뜨듯이 저희도
 * 앱 접속할 때 feed가 먼저 뜨면 어떨까." Mobile users open the app
 * expecting vertical video the way Shorts/TikTok trained them. Landing
 * with its Hero + markets grid is the right surface for desktop (SEO,
 * marketing context, at-a-glance catalog) but wastes a mobile user's
 * 10–20s attention window.
 *
 * Rule: mobile UA hitting `/` → 307 redirect to `/feed`.
 *
 * Escape hatches and carve-outs:
 *   - `?desktop=1` on the URL disables the redirect. Useful for mobile
 *     users who want to deliberately see the marketing landing, for
 *     support links, and for the left SideRail Home link on desktop
 *     /feed (it includes `?desktop=1` so that tapping Home from a
 *     desktop browser emulating a phone doesn't loop).
 *   - Bots / link-preview crawlers (Googlebot, Slackbot, Twitterbot,
 *     facebookexternalhit, WhatsApp, Telegram, LinkedIn) are NOT
 *     redirected. Landing / serves the canonical JSON-LD + hero copy
 *     that SEO and social-card rendering depend on; bouncing them to
 *     /feed would kill rich previews and hurt indexing.
 *
 * 307 (not 308) on purpose: we treat this as a temporary, device-based
 * routing decision. If the user rotates to a desktop (or we change the
 * heuristic), their cached redirect shouldn't pin them to /feed forever.
 *
 * Matcher is scoped to `/` exactly (see config below) so no other route
 * pays the UA-parsing cost.
 */

const MOBILE_UA_RE =
  /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS/i;

// A broad sweep of crawlers. Not exhaustive — we err on the side of NOT
// redirecting when in doubt, because a false negative (bot gets /feed) is
// worse than a false positive (rare mobile UA sees landing).
const BOT_UA_RE =
  /bot|crawler|spider|slurp|facebookexternalhit|slackbot|twitterbot|whatsapp|telegram|preview|linkedinbot|pinterestbot|discordbot|embedly|quora|applebot/i;

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Scope guard — matcher already limits this, but be defensive so a
  // future matcher widening doesn't accidentally redirect everything.
  if (pathname !== '/') return NextResponse.next();

  // Explicit opt-out — `/?desktop=1` bypasses for mobile users who want the
  // landing page (marketing shares, screenshots, QA).
  if (searchParams.get('desktop') === '1') return NextResponse.next();

  const ua = request.headers.get('user-agent') ?? '';
  if (!ua) return NextResponse.next();
  if (BOT_UA_RE.test(ua)) return NextResponse.next();
  if (!MOBILE_UA_RE.test(ua)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/feed';
  // Preserve any query string the user had — mostly harmless for /feed
  // and occasionally useful (utm_* for attribution).
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Scope strictly to `/`. Globally-scoped middleware would run on every
  // request (including static assets) and compile in/out on every deploy.
  matcher: '/',
};
