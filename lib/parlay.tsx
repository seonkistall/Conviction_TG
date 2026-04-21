'use client';
/**
 * Tiny Parlay store — React Context + reducer.
 * No external deps. Persisted to localStorage.
 *
 * Payout math (simplified): each leg priced at `price` (0..1) implies
 * decimal odds = 1 / price. Combined multiplier = Π(1 / price_i).
 * Max payout = stake × multiplier. Implied combined probability = Π price_i.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type { ParlayLeg } from './types';

export interface ParlayReceipt {
  txHash: string;
  blockNum: number;
  placedAt: number;
  legs: ParlayLeg[];
  stake: number;
  multiplier: number;
  maxPayout: number;
  status: 'OPEN' | 'WON' | 'LOST';
}

interface ParlayState {
  legs: ParlayLeg[];
  stake: number;
  open: boolean;
  placing: boolean;
  receipt: ParlayReceipt | null;
}

type Action =
  | { type: 'ADD'; leg: ParlayLeg }
  | { type: 'REMOVE'; marketId: string }
  | { type: 'SET_STAKE'; stake: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; state: Partial<ParlayState> }
  | { type: 'TOGGLE'; open?: boolean }
  | { type: 'PLACING' }
  | { type: 'PLACED'; receipt: ParlayReceipt }
  | { type: 'DISMISS_RECEIPT' };

function reducer(s: ParlayState, a: Action): ParlayState {
  switch (a.type) {
    case 'ADD': {
      const exists = s.legs.find((l) => l.marketId === a.leg.marketId);
      if (exists) {
        return {
          ...s,
          legs: s.legs.map((l) =>
            l.marketId === a.leg.marketId ? a.leg : l
          ),
          open: true,
        };
      }
      return { ...s, legs: [...s.legs, a.leg], open: true };
    }
    case 'REMOVE':
      return { ...s, legs: s.legs.filter((l) => l.marketId !== a.marketId) };
    case 'SET_STAKE':
      return { ...s, stake: Math.max(0, a.stake) };
    case 'CLEAR':
      return { ...s, legs: [], stake: s.stake };
    case 'TOGGLE':
      return { ...s, open: a.open ?? !s.open };
    case 'PLACING':
      return { ...s, placing: true };
    case 'PLACED':
      return {
        ...s,
        placing: false,
        receipt: a.receipt,
        legs: [],
      };
    case 'DISMISS_RECEIPT':
      return { ...s, receipt: null, open: false };
    case 'HYDRATE':
      return { ...s, ...a.state };
  }
}

interface ParlayCtx {
  legs: ParlayLeg[];
  stake: number;
  open: boolean;
  placing: boolean;
  receipt: ParlayReceipt | null;
  add: (leg: ParlayLeg) => void;
  remove: (marketId: string) => void;
  setStake: (n: number) => void;
  clear: () => void;
  toggle: (open?: boolean) => void;
  place: () => void;
  dismissReceipt: () => void;
  /** Combined decimal multiplier (1 / Π price) */
  multiplier: number;
  /** Implied combined probability */
  impliedProb: number;
  /** Max payout = stake * multiplier */
  maxPayout: number;
  hasLeg: (marketId: string) => boolean;
}

const INITIAL: ParlayState = {
  legs: [],
  stake: 25,
  open: false,
  placing: false,
  receipt: null,
};

const Ctx = createContext<ParlayCtx>({
  legs: [],
  stake: 25,
  open: false,
  placing: false,
  receipt: null,
  add: () => {},
  remove: () => {},
  setStake: () => {},
  clear: () => {},
  toggle: () => {},
  place: () => {},
  dismissReceipt: () => {},
  multiplier: 1,
  impliedProb: 1,
  maxPayout: 25,
  hasLeg: () => false,
});

const STORAGE_KEY = 'cv_parlay_v1';
const TICKETS_KEY = 'cv_tickets_v1';

function randHex(len: number): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) out += hex[Math.floor(Math.random() * 16)];
  return out;
}

export function readTickets(): ParlayReceipt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ParlayReceipt[];
  } catch {
    return [];
  }
}

export function ParlayProvider({ children }: { children: React.ReactNode }) {
  const [s, dispatch] = useReducer(reducer, INITIAL);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ParlayState>;
      dispatch({ type: 'HYDRATE', state: parsed });
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ legs: s.legs, stake: s.stake })
      );
    } catch {}
  }, [s.legs, s.stake]);

  const add = useCallback((leg: ParlayLeg) => dispatch({ type: 'ADD', leg }), []);
  const remove = useCallback(
    (marketId: string) => dispatch({ type: 'REMOVE', marketId }),
    []
  );
  const setStake = useCallback(
    (n: number) => dispatch({ type: 'SET_STAKE', stake: n }),
    []
  );
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const toggle = useCallback(
    (open?: boolean) => dispatch({ type: 'TOGGLE', open }),
    []
  );

  const { multiplier, impliedProb, maxPayout } = useMemo(() => {
    if (!s.legs.length) {
      return { multiplier: 1, impliedProb: 1, maxPayout: s.stake };
    }
    const impliedProb = s.legs.reduce(
      (acc, l) => acc * Math.max(0.005, Math.min(0.995, l.price)),
      1
    );
    const multiplier = 1 / impliedProb;
    return {
      multiplier,
      impliedProb,
      maxPayout: s.stake * multiplier,
    };
  }, [s.legs, s.stake]);

  const hasLeg = useCallback(
    (marketId: string) => s.legs.some((l) => l.marketId === marketId),
    [s.legs]
  );

  const place = useCallback(() => {
    if (s.placing || !s.legs.length) return;
    dispatch({ type: 'PLACING' });
    // Simulate on-chain confirmation
    window.setTimeout(() => {
      const receipt: ParlayReceipt = {
        txHash: '0x' + randHex(40),
        blockNum: 18_920_000 + Math.floor(Math.random() * 80_000),
        placedAt: Date.now(),
        legs: s.legs,
        stake: s.stake,
        multiplier,
        maxPayout,
        status: 'OPEN',
      };
      // Persist to tickets ledger
      try {
        const existing = readTickets();
        localStorage.setItem(
          TICKETS_KEY,
          JSON.stringify([receipt, ...existing].slice(0, 50))
        );
      } catch {}
      dispatch({ type: 'PLACED', receipt });
    }, 1300);
  }, [s.placing, s.legs, s.stake, multiplier, maxPayout]);

  const dismissReceipt = useCallback(
    () => dispatch({ type: 'DISMISS_RECEIPT' }),
    []
  );

  return (
    <Ctx.Provider
      value={{
        legs: s.legs,
        stake: s.stake,
        open: s.open,
        placing: s.placing,
        receipt: s.receipt,
        add,
        remove,
        setStake,
        clear,
        toggle,
        place,
        dismissReceipt,
        multiplier,
        impliedProb,
        maxPayout,
        hasLeg,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useParlay() {
  return useContext(Ctx);
}
