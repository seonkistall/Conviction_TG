'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MARKETS } from './markets';

/**
 * Live price simulation for the v2.12 demo.
 *
 * Why it exists
 * -------------
 * A static-looking prediction market feels dead. Real Polymarket/Kalshi
 * traders see prices tick every few seconds as orders hit the book.
 * We don't have a live order book in the demo — so we approximate one
 * with a client-side random-walk store that:
 *
 *   1. Seeds from the canonical MARKETS table on mount.
 *   2. Every `TICK_MS`, nudges every price by a small amount biased
 *      toward its seed value (mean-reverting walk). This prevents the
 *      ugly drift where every market eventually lands at 0.5.
 *   3. Emits the new price map to all subscribed `<LivePrice />` or
 *      `useLivePrice()` consumers through React context. Components
 *      combine the live value with `usePriceFlicker` to flash up/down.
 *
 * Never ticks during SSR (falls back to the seed). Also disabled when
 * the user has `prefers-reduced-motion: reduce` — a constantly-
 * re-rendering header is exactly the kind of thing RM users want gone.
 */

type PriceMap = Record<string, number>;

const TICK_MS = 4000;
const MAX_STEP = 0.018; // ≤1.8pp per tick
const MEAN_REVERT = 0.08; // pull back toward seed each tick

interface LivePricesCtx {
  prices: PriceMap;
}

const Ctx = createContext<LivePricesCtx>({ prices: {} });

/**
 * Clamp to [0.02, 0.98] — prediction-market UIs never show 0 or 100,
 * they cap at 2/98 to signal "effectively decided".
 */
function clampProb(p: number): number {
  if (p < 0.02) return 0.02;
  if (p > 0.98) return 0.98;
  return p;
}

export function LivePricesProvider({ children }: { children: ReactNode }) {
  // Seed once, from the static markets table. We intentionally don't
  // reseed if MARKETS changes — the demo fixture is static.
  const seeds = useRef<PriceMap>(
    Object.fromEntries(MARKETS.map((m) => [m.id, m.yesProb]))
  );
  const [prices, setPrices] = useState<PriceMap>(seeds.current);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Respect reduced-motion: no ticker at all. The seed is correct.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const tick = () => {
      setPrices((prev) => {
        const next: PriceMap = {};
        for (const id in prev) {
          const curr = prev[id];
          const seed = seeds.current[id] ?? curr;
          const noise = (Math.random() - 0.5) * 2 * MAX_STEP;
          const pull = (seed - curr) * MEAN_REVERT;
          // Round to 2 decimals so the flicker hook only fires on
          // visually-perceptible changes (¢ granularity).
          next[id] = Math.round(clampProb(curr + noise + pull) * 100) / 100;
        }
        return next;
      });
    };

    // v2.16: Pause the ticker while the tab is hidden. setInterval keeps
    // firing on background tabs (just throttled to ≥1Hz by Chrome's
    // background-tab policy), wasting CPU and waking the device's
    // efficiency cores on mobile. We tear the interval down on
    // visibilitychange → hidden, and re-arm it (with one immediate tick
    // to refresh the visual state) when the tab comes back.
    let iv: number | null = null;
    const start = () => {
      if (iv !== null) return;
      iv = window.setInterval(tick, TICK_MS);
    };
    const stop = () => {
      if (iv === null) return;
      window.clearInterval(iv);
      iv = null;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        // Catch up on the missed interval boundary so a returning user
        // doesn't see a stale price for up to TICK_MS.
        tick();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, []);

  return <Ctx.Provider value={{ prices }}>{children}</Ctx.Provider>;
}

/** Subscribe to the live price for a single market. Falls back to
 *  `seed` if the provider isn't mounted (e.g. edge-case SSR). */
export function useLivePrice(marketId: string, seed: number): number {
  const { prices } = useContext(Ctx);
  return prices[marketId] ?? seed;
}

/**
 * Batched subscription — for widgets that render a list of rows keyed
 * by marketId. Returns a { [marketId]: price } map, falling back to
 * `seeds[id]` when the provider hasn't populated that id yet.
 *
 * Prefer this over calling `useLivePrice` inside each row component —
 * the parent owns a single context read and passes plain props down,
 * which keeps child components hook-free and immune to "list shrinks
 * on re-render" rules-of-hooks foot-guns.
 */
export function useLivePrices(
  ids: string[],
  seeds: Record<string, number> = {}
): PriceMap {
  const { prices } = useContext(Ctx);
  const out: PriceMap = {};
  for (const id of ids) {
    out[id] = prices[id] ?? seeds[id] ?? 0.5;
  }
  return out;
}
