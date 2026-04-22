'use client';
/**
 * Mute state — viewport-prioritized single-audio semantics.
 *
 * There are two independent pieces of state:
 *
 *  1. `muted`  — the user's global intent, toggled by the Mute FAB.
 *                When `true`, NO player ever produces audio.
 *                Persisted to sessionStorage.
 *
 *  2. `audioOwnerId` — which ONE <AutoVideo> is currently allowed to produce
 *                audio right now, even when global `muted` is false.
 *                The provider picks the player with the largest
 *                `IntersectionObserver.intersectionRatio` (≥ AUDIO_THRESHOLD).
 *                Everyone else stays muted — so no matter how many cards
 *                are on screen, the user hears a single audio source.
 *
 * Each <AutoVideo> registers itself on mount with a stable `playerId`
 * and continuously reports its current visibility ratio. The provider
 * schedules a rAF-debounced recomputation so that scrolling feels snappy
 * without thrashing React state on every IO callback.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

/** Minimum intersection ratio to be eligible for audio ownership. */
const AUDIO_THRESHOLD = 0.5;

interface MuteCtx {
  /** Global user intent. When true → no audio anywhere. */
  muted: boolean;
  toggle: () => void;
  setMuted: (m: boolean) => void;

  /** Which single player is currently allowed to play audio. */
  audioOwnerId: string | null;

  /** Lifecycle — called by <AutoVideo> on mount/unmount. */
  registerPlayer: (id: string) => void;
  unregisterPlayer: (id: string) => void;

  /** Continuous visibility signal from IntersectionObserver. */
  reportVisibility: (id: string, ratio: number) => void;
}

const Ctx = createContext<MuteCtx>({
  muted: true,
  toggle: () => {},
  setMuted: () => {},
  audioOwnerId: null,
  registerPlayer: () => {},
  unregisterPlayer: () => {},
  reportVisibility: () => {},
});

export function MuteProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(true);
  const [audioOwnerId, setAudioOwnerId] = useState<string | null>(null);

  // Ref-backed maps so repeated IO callbacks don't re-render the whole tree.
  const visibilityRef = useRef<Map<string, number>>(new Map());
  const orderRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('cv_mute');
      if (stored === '0') setMuted(false);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('cv_mute', muted ? '1' : '0');
    } catch {}
  }, [muted]);

  /** Pick the most-visible player (≥ threshold) and promote it to audio owner. */
  const recomputeOwner = useCallback(() => {
    rafRef.current = null;
    const vis = visibilityRef.current;
    let bestId: string | null = null;
    let bestRatio = 0;
    for (const id of orderRef.current) {
      const ratio = vis.get(id) ?? 0;
      if (ratio > bestRatio && ratio >= AUDIO_THRESHOLD) {
        bestRatio = ratio;
        bestId = id;
      }
    }
    setAudioOwnerId((prev) => (prev === bestId ? prev : bestId));
  }, []);

  const schedule = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(recomputeOwner);
  }, [recomputeOwner]);

  const registerPlayer = useCallback(
    (id: string) => {
      if (!orderRef.current.includes(id)) orderRef.current.push(id);
      if (!visibilityRef.current.has(id)) visibilityRef.current.set(id, 0);
      schedule();
    },
    [schedule]
  );

  const unregisterPlayer = useCallback(
    (id: string) => {
      orderRef.current = orderRef.current.filter((x) => x !== id);
      visibilityRef.current.delete(id);
      schedule();
    },
    [schedule]
  );

  const reportVisibility = useCallback(
    (id: string, ratio: number) => {
      const prev = visibilityRef.current.get(id);
      // Skip trivial updates to reduce rAF churn when ratios flap near edges.
      if (prev !== undefined && Math.abs(prev - ratio) < 0.02) return;
      visibilityRef.current.set(id, ratio);
      schedule();
    },
    [schedule]
  );

  const toggle = useCallback(() => setMuted((m) => !m), []);

  return (
    <Ctx.Provider
      value={{
        muted,
        toggle,
        setMuted,
        audioOwnerId,
        registerPlayer,
        unregisterPlayer,
        reportVisibility,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useMute() {
  return useContext(Ctx);
}
