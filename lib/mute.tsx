'use client';
/**
 * Session-wide mute state. Videos stay `muted` on autoplay (browser policy),
 * but once the user taps the global Mute FAB we unmute the currently visible
 * <video> elements & signal consumers via context. Persisted to sessionStorage.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface MuteCtx {
  muted: boolean;
  toggle: () => void;
  setMuted: (m: boolean) => void;
}

const Ctx = createContext<MuteCtx>({
  muted: true,
  toggle: () => {},
  setMuted: () => {},
});

export function MuteProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(true);

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
    // Apply to all <video> elements currently mounted
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((v) => {
        v.muted = muted;
      });
    }
  }, [muted]);

  const toggle = useCallback(() => setMuted((m) => !m), []);

  return (
    <Ctx.Provider value={{ muted, toggle, setMuted }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMute() {
  return useContext(Ctx);
}
