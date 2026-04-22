'use client';
/**
 * Positions store — React Context + reducer + localStorage.
 *
 * v2.6 Phase A: turns one-tap YES/NO and "Buy YES · $X" into a real,
 * persistent position the user can see on /portfolio. Mocks settlement,
 * but the data model mirrors how an actual on-chain shares ledger would
 * look: each position is keyed by (marketId, side), shares are summed,
 * avgPrice is recomputed weighted by previous shares.
 *
 * Persistence
 * -----------
 * Stored under `cv_positions_v1`. On first mount we read; if nothing is
 * there we **seed** from the static PORTFOLIO mock so the user never
 * lands on an empty table on their first visit. After that, every change
 * round-trips through localStorage.
 *
 * Realized P&L
 * ------------
 * Closing a position removes it from `positions[]` and pushes a
 * RealizedFill onto `closed[]`. /portfolio can read this for the
 * "Closed positions" section in v2.6 Phase B.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { PortfolioPosition } from './types';
import { PORTFOLIO } from './markets';

export interface RealizedFill {
  marketId: string;
  side: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
  closePrice: number;
  pnl: number;
  closedAt: number; // epoch ms
}

interface PositionsState {
  positions: PortfolioPosition[];
  closed: RealizedFill[];
  hydrated: boolean;
}

type Action =
  | {
      type: 'BUY';
      marketId: string;
      side: 'YES' | 'NO';
      shares: number;
      price: number;
    }
  | {
      type: 'CLOSE';
      marketId: string;
      side: 'YES' | 'NO';
      closePrice: number;
    }
  | { type: 'HYDRATE'; state: Partial<PositionsState> }
  | { type: 'RESET' };

function mergePosition(
  existing: PortfolioPosition | undefined,
  shares: number,
  price: number
): PortfolioPosition {
  if (!existing) {
    return {
      marketId: '',
      side: 'YES',
      shares,
      avgPrice: price,
      currentPrice: price,
      pnl: 0,
    };
  }
  const totalShares = existing.shares + shares;
  // weighted avg keeps the running cost basis honest across multiple buys
  const avg = (existing.avgPrice * existing.shares + price * shares) / totalShares;
  return {
    ...existing,
    shares: totalShares,
    avgPrice: avg,
    currentPrice: price,
    pnl: totalShares * (price - avg),
  };
}

function reducer(s: PositionsState, a: Action): PositionsState {
  switch (a.type) {
    case 'BUY': {
      const idx = s.positions.findIndex(
        (p) => p.marketId === a.marketId && p.side === a.side
      );
      if (idx === -1) {
        const next: PortfolioPosition = {
          marketId: a.marketId,
          side: a.side,
          shares: a.shares,
          avgPrice: a.price,
          currentPrice: a.price,
          pnl: 0,
        };
        return { ...s, positions: [next, ...s.positions] };
      }
      const merged = mergePosition(s.positions[idx], a.shares, a.price);
      merged.marketId = a.marketId;
      merged.side = a.side;
      const positions = [...s.positions];
      positions[idx] = merged;
      return { ...s, positions };
    }
    case 'CLOSE': {
      const idx = s.positions.findIndex(
        (p) => p.marketId === a.marketId && p.side === a.side
      );
      if (idx === -1) return s;
      const p = s.positions[idx];
      const fill: RealizedFill = {
        marketId: p.marketId,
        side: p.side,
        shares: p.shares,
        avgPrice: p.avgPrice,
        closePrice: a.closePrice,
        pnl: p.shares * (a.closePrice - p.avgPrice),
        closedAt: Date.now(),
      };
      const positions = s.positions.filter((_, i) => i !== idx);
      return { ...s, positions, closed: [fill, ...s.closed].slice(0, 100) };
    }
    case 'HYDRATE':
      return { ...s, ...a.state, hydrated: true };
    case 'RESET':
      return { positions: [], closed: [], hydrated: true };
  }
}

interface PositionsCtx {
  positions: PortfolioPosition[];
  closed: RealizedFill[];
  hydrated: boolean;
  buy: (input: {
    marketId: string;
    side: 'YES' | 'NO';
    shares: number;
    price: number;
  }) => void;
  close: (marketId: string, side: 'YES' | 'NO', closePrice: number) => void;
  reset: () => void;
  /** True if the user holds any shares of that market (either side). */
  hasPosition: (marketId: string) => boolean;
  /** Get the user's position on a specific (marketId, side), or null. */
  positionOn: (
    marketId: string,
    side: 'YES' | 'NO'
  ) => PortfolioPosition | null;
}

const INITIAL: PositionsState = {
  positions: [],
  closed: [],
  hydrated: false,
};

const Ctx = createContext<PositionsCtx>({
  positions: [],
  closed: [],
  hydrated: false,
  buy: () => {},
  close: () => {},
  reset: () => {},
  hasPosition: () => false,
  positionOn: () => null,
});

const STORAGE_KEY = 'cv_positions_v1';

interface PersistedShape {
  positions: PortfolioPosition[];
  closed: RealizedFill[];
}

export function PositionsProvider({ children }: { children: React.ReactNode }) {
  const [s, dispatch] = useReducer(reducer, INITIAL);

  // Hydrate from localStorage; if empty, seed with the static PORTFOLIO mock
  // so first-time visitors see a populated table.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedShape;
        dispatch({
          type: 'HYDRATE',
          state: {
            positions: parsed.positions ?? [],
            closed: parsed.closed ?? [],
          },
        });
        return;
      }
    } catch {}
    // Seed
    dispatch({
      type: 'HYDRATE',
      state: { positions: [...PORTFOLIO], closed: [] },
    });
  }, []);

  // Persist after every meaningful change, but only after hydration so we
  // don't blow away a returning user's positions with the empty initial state.
  useEffect(() => {
    if (!s.hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ positions: s.positions, closed: s.closed })
      );
    } catch {}
  }, [s.positions, s.closed, s.hydrated]);

  const buy = useCallback<PositionsCtx['buy']>(
    ({ marketId, side, shares, price }) => {
      if (shares <= 0 || price <= 0 || price >= 1) return;
      dispatch({ type: 'BUY', marketId, side, shares, price });
    },
    []
  );

  const close = useCallback(
    (marketId: string, side: 'YES' | 'NO', closePrice: number) =>
      dispatch({ type: 'CLOSE', marketId, side, closePrice }),
    []
  );

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const hasPosition = useCallback(
    (marketId: string) => s.positions.some((p) => p.marketId === marketId),
    [s.positions]
  );

  const positionOn = useCallback(
    (marketId: string, side: 'YES' | 'NO') =>
      s.positions.find((p) => p.marketId === marketId && p.side === side) ??
      null,
    [s.positions]
  );

  const value = useMemo<PositionsCtx>(
    () => ({
      positions: s.positions,
      closed: s.closed,
      hydrated: s.hydrated,
      buy,
      close,
      reset,
      hasPosition,
      positionOn,
    }),
    [s.positions, s.closed, s.hydrated, buy, close, reset, hasPosition, positionOn]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePositions() {
  return useContext(Ctx);
}
