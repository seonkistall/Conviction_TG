'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';

const STORAGE_KEY = 'cv_copy_trades_v1';

function readSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function CopyTradeButton({ handle }: { handle: string }) {
  const t = useT();
  const [copying, setCopying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCopying(readSet().has(handle));
  }, [handle]);

  const toggle = () => {
    const set = readSet();
    if (set.has(handle)) {
      set.delete(handle);
      setCopying(false);
    } else {
      set.add(handle);
      setCopying(true);
    }
    writeSet(set);
  };

  return (
    /*
     * v2.19-3 — "Demo" badge on the Copy-trade button.
     *
     * The button writes to localStorage but doesn't actually route a
     * user's stake through the agentic quant on-chain — that's an
     * MVP+1 backend concern. Pre-v2.19 an evaluator saw a bright
     * "Copy-trade" CTA and reasonably assumed it placed real copies,
     * then noticed their balance didn't move and got confused about
     * what the demo actually did.
     *
     * Explicit "Demo · copy flow" chip pinned to the top-right of the
     * button sets expectations up front without softening the CTA's
     * visual weight. On the followed/active state the chip disappears
     * (the state itself is the signal).
     */
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className={clsx(
          'flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-lg transition',
          copying
            ? 'border border-volt/40 bg-ink-900 text-volt hover:bg-ink-800'
            : 'bg-gradient-to-r from-volt to-volt-dark text-ink-900 hover:brightness-105'
        )}
        aria-pressed={copying}
        aria-describedby="copy-trade-demo-note"
      >
        {copying ? (
          <>
            <span className="live-dot" style={{ width: 7, height: 7 }} />
            <span>{mounted ? t('trader.copying') : 'Copy-trade'}</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{mounted ? t('trader.copy') : 'Copy-trade'}</span>
          </>
        )}
      </button>
      {!copying && (
        <span
          id="copy-trade-demo-note"
          className="absolute -top-2 right-3 rounded-full border border-white/15 bg-ink-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-bone-muted"
          title="Copy-trade is a local-state demo in this build. Real on-chain routing ships post-MVP."
        >
          Demo
        </span>
      )}
    </div>
  );
}
