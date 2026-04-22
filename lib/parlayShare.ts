/**
 * Shareable Parlay Receipt encoding.
 *
 * A placed parlay lives in localStorage (see lib/parlay.tsx), which means
 * only the trader who placed it sees the full receipt. To make the ticket
 * shareable, we base64url-encode a minimal receipt payload into a URL
 * query string:
 *
 *   /parlays/<human-id>?d=<base64url>
 *
 * The server component at app/parlays/[id]/page.tsx reads `d`, decodes
 * it, and renders the receipt — no DB required. The same encoding is
 * consumed by the dynamic OG image route so the Twitter/LinkedIn card
 * shows the actual odds, legs, and payout.
 *
 * The payload is deliberately lossy relative to the full ParlayReceipt:
 * we drop the tx hash, block number, and per-leg market metadata that
 * is re-hydrated from MARKETS.ts on the server. What we need to carry
 * across origins is just leg picks, prices, stake, and placed-at.
 */
export interface SharedParlay {
  /** Short human-readable ticket id, e.g. "cv-a7b3". */
  id: string;
  /** Per-leg picks. `pick` is 'YES' | 'NO' for binary, outcome id for multi. */
  legs: { marketId: string; pick: string; price: number }[];
  stake: number;
  placedAt: number;
}

/** Deterministic-ish short id from the tx hash — lowercase, no separators. */
export function ticketIdFromTxHash(txHash: string): string {
  const clean = txHash.replace(/^0x/, '').toLowerCase();
  return 'cv-' + clean.slice(0, 4) + clean.slice(4, 8);
}

/** Base64url encode without Node Buffer so we can call this from both server and client. */
export function encodeSharedParlay(p: SharedParlay): string {
  const json = JSON.stringify(p);
  const b64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(json, 'utf-8').toString('base64')
      : btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Inverse of encodeSharedParlay. Returns null on any decode error. */
export function decodeSharedParlay(encoded: string): SharedParlay | null {
  try {
    const b64 =
      encoded.replace(/-/g, '+').replace(/_/g, '/') +
      '='.repeat((4 - (encoded.length % 4)) % 4);
    const json =
      typeof Buffer !== 'undefined'
        ? Buffer.from(b64, 'base64').toString('utf-8')
        : decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.legs)) return null;
    return parsed as SharedParlay;
  } catch {
    return null;
  }
}

/**
 * Compute the combined decimal multiplier and max payout from shared legs.
 * Kept in this module so both the receipt page and the OG route can call
 * it without pulling in the full parlay reducer.
 */
export function computePayout(p: Pick<SharedParlay, 'legs' | 'stake'>) {
  if (p.legs.length === 0) {
    return { multiplier: 1, impliedProb: 1, maxPayout: p.stake };
  }
  const impliedProb = p.legs.reduce(
    (acc, l) => acc * Math.max(0.005, Math.min(0.995, l.price)),
    1
  );
  const multiplier = 1 / impliedProb;
  return {
    multiplier,
    impliedProb,
    maxPayout: p.stake * multiplier,
  };
}
