/**
 * Cross-cutting numeric/string constants used by multiple surfaces.
 *
 * v2.25 — Centralized so a future product change ($5 → $1 starting
 * stake, brand handle rotation, etc.) is a single-file edit instead
 * of a ripgrep + sed + miss-one-callsite hunt.
 */

/**
 * Stake preset chips shown in the OrderBook (market detail), the
 * FeedDetailSheet (feed YES/NO sheet), and the QuickBetActions
 * tooltip (markets grid). All three surfaces present an identical
 * ladder so a user who learns "$10 is the default tap" anywhere
 * generalizes the muscle memory everywhere.
 *
 * Tier reasoning:
 *   $5  — entry-friendly: "I'll try one" without committing real money
 *   $10 — anchored default (matches the v2.22-1 `QUICK_STAKE_USD`)
 *   $25 — "I have an opinion" tier, common K-pop comeback bet size
 *   $100 — whale tier, also lines up with daily Polymarket median
 */
export const STAKE_PRESETS = [5, 10, 25, 100] as const;
export type StakePreset = (typeof STAKE_PRESETS)[number];

/** Default tap stake when no other context exists. Subset of STAKE_PRESETS. */
export const DEFAULT_STAKE_USD: StakePreset = 10;

/**
 * Canonical X (Twitter) handle. Used by share helpers to attribute
 * reshares back to the brand without us having to scrape and reconcile
 * "official" account confusion later. If the handle ever rotates,
 * this is the single source of truth.
 */
export const BRAND_X_HANDLE = 'conviction_apac';

/**
 * mailto: target for waitlist / notify-me CTAs. Lives behind a
 * Cloudflare email-routing rule so the literal address can rotate
 * without touching the bundle.
 */
export const BRAND_BETA_EMAIL = 'beta@conviction.trade';
