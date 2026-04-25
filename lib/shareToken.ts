/**
 * v2.28-2 — Share-token codec for "Share my conviction" links.
 *
 * Why stateless tokens?
 * ---------------------
 * The viral primitive on /portfolio is "I want to flex this position
 * to my followers without giving Conviction anything to store."
 * A persisted Postgres row per share keystroke would make the feature
 * gateable behind login + DB writes — neither belongs on the share
 * loop's critical path. Instead, we encode the position snapshot
 * itself into a base64url token that lives in the URL.
 *
 *   /share/p/<token>
 *
 * The token is decoded server-side by the route + the OG image; both
 * read the same `lib/markets.ts` catalog to resolve the marketId, so
 * the URL is the only state the server needs. If the marketId no
 * longer exists in the catalog (we ever rotate one out), the route
 * gracefully renders an "expired" card instead of 404'ing — the
 * link's already in the wild on X / Slack / KakaoTalk and we'd
 * rather show a graceful state than a broken Vercel error page.
 *
 * Privacy
 * -------
 * The token does NOT carry any user PII beyond what the user chose
 * to attach (handle is optional and defaulted to a generic "@trader"
 * when omitted). No emails, ids, or device fingerprints. The same
 * token is identical for every user with the same position snapshot.
 *
 * Encoding choice
 * ---------------
 * - JSON.stringify → utf8 → base64url. This is ~30% larger than a
 *   binary protocol but trivially debuggable from a curl command,
 *   and the URL stays under the 2,000-char ceiling X / iMessage
 *   share previews care about (a worst-case payload is ~140 chars).
 * - We use base64url (not base64) so tokens don't need percent-
 *   encoding when pasted into a URL — keeps the share string short
 *   and copy-pasteable.
 */

export interface SharePayload {
  /** Market id from lib/markets.ts. */
  m: string;
  /** Side: 'YES' | 'NO' for binary, or outcome id for multi. */
  s: string;
  /** Shares held. */
  sh: number;
  /** Average entry price (0..1, two-decimal precision is plenty). */
  ap: number;
  /** Mark / current price at the moment of share (0..1). */
  cp: number;
  /** Optional handle (no leading @). */
  h?: string;
}

/**
 * URL-safe base64 of a JSON payload. We strip `=` padding because
 * the decoder pads back; saves a couple of chars on every share
 * link, which matters when the link gets re-shared inside an iMessage
 * preview that truncates URLs aggressively.
 */
export function encodeSharePayload(p: SharePayload): string {
  const json = JSON.stringify(p);
  // Buffer is available on Node + edge; for the browser we polyfill
  // via btoa() in the inverse direction below. The encoder runs only
  // in the client (Portfolio button) — server only decodes.
  const b64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(json, 'utf-8').toString('base64')
      : btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function decodeSharePayload(token: string): SharePayload | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
    // Pad to a multiple of 4 — base64url drops trailing `=`.
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json =
      typeof Buffer !== 'undefined'
        ? Buffer.from(padded, 'base64').toString('utf-8')
        : decodeURIComponent(escape(atob(padded)));
    const obj = JSON.parse(json) as Partial<SharePayload>;
    // Soft-validate: every required field present and the right shape.
    if (
      typeof obj?.m !== 'string' ||
      typeof obj?.s !== 'string' ||
      typeof obj?.sh !== 'number' ||
      typeof obj?.ap !== 'number' ||
      typeof obj?.cp !== 'number'
    ) {
      return null;
    }
    return obj as SharePayload;
  } catch {
    return null;
  }
}

/**
 * Compute realized-on-paper P&L from a share payload. The card uses
 * this in two places (page + OG image) so we keep the math here to
 * avoid drift between the two surfaces.
 */
export function pnlFromPayload(p: SharePayload): {
  pnlUsd: number;
  pnlPct: number;
} {
  const pnlUsd = p.sh * (p.cp - p.ap);
  const pnlPct = p.ap > 0 ? (p.cp / p.ap - 1) * 100 : 0;
  return { pnlUsd, pnlPct };
}
