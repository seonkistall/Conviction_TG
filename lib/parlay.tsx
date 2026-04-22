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
import { usePositions } from './positions';
import { useToast } from './toast';
import {
  encodeSharedParlay,
  ticketIdFromTxHash,
} from './parlayShare';
import { commit as commitHaptic, success as successHaptic } from './haptics';

export interface ParlayReceipt {
  /** Short, URL-friendly ticket id, e.g. "cv-a7b3c9d1". */
  id: string;
  txHash: string;
  blockNum: number;
  placedAt: number;
  legs: ParlayLeg[];
  stake: number;
  multiplier: number;
  maxPayout: number;
  status: 'OPEN' | 'WON' | 'LOST';
  /** Relative path to the shareable receipt, including base64url payload. */
  sharePath: string;
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
    const parsed = JSON.parse(raw) as ParlayReceipt[];
    // Backfill id/sharePath on tickets written by earlier versions that
    // didn't set them. Keeps old tickets shareable without a migration.
    return parsed.map((t) => {
      if (t.id && t.sharePath) return t;
      const id = t.id ?? ticketIdFromTxHash(t.txHash);
      const query = encodeSharedParlay({
        id,
        legs: t.legs,
        stake: t.stake,
        placedAt: t.placedAt,
      });
      return { ...t, id, sharePath: `/parlays/${id}?d=${query}` };
    });
  } catch {
    return [];
  }
}

export function ParlayProvider({ children }: { children: React.ReactNode }) {
  const [s, dispatch] = useReducer(reducer, INITIAL);
  // Parlay settlement hooks: when a parlay is placed we optimistically
  // materialize each leg as a ("parlay share") position and emit a toast.
  // This is the glue between /feed's one-tap-to-parlay and /portfolio.
  const positions = usePositions();
  const { push: pushToast } = useToast();

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

  const add = useCallback((leg: ParlayLeg) => {
    // Tiny tap confirms the pick was registered. On desktop this is a
    // no-op; on Android it's a subtle 8-24-18ms buzz that feels right.
    successHaptic();
    dispatch({ type: 'ADD', leg });
  }, []);
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
      const txHash = '0x' + randHex(40);
      const id = ticketIdFromTxHash(txHash);
      const placedAt = Date.now();
      const shareQuery = encodeSharedParlay({
        id,
        legs: s.legs,
        stake: s.stake,
        placedAt,
      });
      const receipt: ParlayReceipt = {
        id,
        txHash,
        blockNum: 18_920_000 + Math.floor(Math.random() * 80_000),
        placedAt,
        legs: s.legs,
        stake: s.stake,
        multiplier,
        maxPayout,
        status: 'OPEN',
        sharePath: `/parlays/${id}?d=${shareQuery}`,
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

      // Materialize each leg as a position. For binary markets the pick is
      // 'YES' or 'NO'; for multi markets the pick is an outcome id — we
      // represent those as a YES position on the market priced at the leg
      // price, which is a fine MVP approximation (the real book would mint
      // outcome-specific shares). Stake is split evenly across legs.
      const perLegStake = s.stake / Math.max(1, s.legs.length);
      for (const leg of s.legs) {
        const side: 'YES' | 'NO' =
          leg.pick === 'NO' ? 'NO' : 'YES';
        const sharesFloat = perLegStake / Math.max(0.005, leg.price);
        const sharesInt = Math.max(1, Math.round(sharesFloat));
        positions.buy({
          marketId: leg.marketId,
          side,
          shares: sharesInt,
          price: leg.price,
        });
      }
      pushToast({
        kind: 'parlay',
        title: `Parlay placed · ${s.legs.length} legs`,
        body: `Stake $${s.stake.toFixed(2)} · Max payout $${maxPayout.toFixed(2)}`,
        amount: `×${multiplier.toFixed(2)}`,
        cta: { href: receipt.sharePath, label: 'View receipt' },
      });
      // Heavier commit buzz to sell the on-chain-confirm moment.
      commitHaptic();
    }, 1300);
  }, [s.placing, s.legs, s.stake, multiplier, maxPayout, positions, pushToast]);

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
