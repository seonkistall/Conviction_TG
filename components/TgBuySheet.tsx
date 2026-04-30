'use client';

/**
 * v2.28 — TG-native buy sheet (Phase 2, F-02).
 *
 * Bottom-sheet bet flow that opens when the user taps the TG
 * MainButton on market detail. Mirrors OrderBook's stake-first
 * pattern (v2.19-2) but fits the small TG viewport — single
 * column, one preset row, one slider, one confirm.
 *
 * Why a separate sheet instead of reusing OrderBook:
 *   - OrderBook is desktop-first (right rail, sticky, multi-column)
 *     and assumes a card-style chrome that fights with TG's themed
 *     bottom safe-area.
 *   - The TG MainButton already commits the user to "Buy YES ¢41" —
 *     opening a sheet that asks them to choose YES/NO again would
 *     break the 30-second wow path.
 *   - We use HapticFeedback.success on confirm; OrderBook only fires
 *     a toast.
 *
 * Outside Telegram this component never renders (the parent
 * `MarketTgBuyButton` doesn't even mount its CTA when
 * `isInTelegram()` is false), so desktop continues to use OrderBook.
 */

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';
import * as haptics from '@/lib/haptics';
import { useTgMainButton } from '@/lib/tgMainButton';

const STAKE_PRESETS = [10, 25, 100, 500];

interface Props {
  open: boolean;
  onClose: () => void;
  initialSide: 'YES' | 'NO';
  yesProb: number;
  marketId: string;
  marketTitle: string;
  /** Optional override of side after the sheet opens (toggle button). */
  resolved?: boolean;
}

export function TgBuySheet({
  open,
  onClose,
  initialSide,
  yesProb,
  marketId,
  marketTitle,
  resolved = false,
}: Props) {
  const positions = usePositions();
  const toast = useToast();
  const [side, setSide] = useState<'YES' | 'NO'>(initialSide);
  const [stake, setStake] = useState<number>(25);
  const [confirming, setConfirming] = useState(false);

  // Re-sync when the parent re-opens with a different starting side.
  useEffect(() => {
    if (open) setSide(initialSide);
  }, [open, initialSide]);

  // Lock body scroll while open. TG WebApp doesn't auto-handle this
  // because the sheet is a regular HTML element from its POV.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const price = side === 'YES' ? yesProb : 1 - yesProb;
  const cents = Math.round(price * 100);
  const shares = useMemo(
    () => (price > 0.005 && price < 0.995 ? Math.max(1, Math.round(stake / price)) : 0),
    [price, stake]
  );
  const maxReturn = useMemo(() => shares * 1.0, [shares]);

  // Wire the TG MainButton to confirm the bet — exactly the right
  // surface for a one-tap commit. Hides automatically on close (the
  // hook's FILO unmount restores the parent's "Buy YES ¢41" CTA).
  useTgMainButton(
    open && !resolved
      ? {
          text: confirming
            ? 'Confirming…'
            : `Confirm · ${side} ${shares} shares · $${stake}`,
          onClick: handleConfirm,
          color: side === 'YES' ? '#33D17A' : '#F66565',
          textColor: '#05060A',
          disabled: confirming || stake <= 0 || shares <= 0,
          loading: confirming,
        }
      : null
  );

  function handleConfirm() {
    if (confirming) return;
    if (price <= 0 || price >= 1) {
      haptics.warn();
      toast.push({
        kind: 'trade',
        title: 'Price out of range',
        body: 'Try the other side.',
      });
      return;
    }
    setConfirming(true);
    haptics.tap();

    // Simulate ~600ms commit latency to mimic on-chain confirmation
    // shape. The fixture-only positions store resolves immediately.
    window.setTimeout(() => {
      try {
        positions.buy({ marketId, side, shares, price });
        haptics.commit();
        toast.push({
          kind: 'trade',
          title: `${side} · ${shares} shares placed`,
          body: marketTitle,
          amount: `-$${stake.toFixed(2)}`,
          cta: { href: '/portfolio', label: 'View' },
        });
        setConfirming(false);
        onClose();
      } catch (err) {
        setConfirming(false);
        haptics.warn();
        toast.push({
          kind: 'trade',
          title: 'Could not place trade',
          body: err instanceof Error ? err.message : 'Try again',
        });
      }
    }, 600);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tg-buy-sheet-title"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/70 backdrop-blur-sm"
      />

      {/* sheet */}
      <div className="relative w-full max-w-md rounded-t-3xl border-t border-x border-white/10 bg-ink-800 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* drag handle */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
              Place a bet
            </div>
            <h2
              id="tg-buy-sheet-title"
              className="mt-0.5 line-clamp-2 font-display text-lg leading-tight text-bone"
            >
              {marketTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink-900 text-bone-muted hover:text-bone"
          >
            ✕
          </button>
        </div>

        {/* YES / NO toggle */}
        <div className="grid grid-cols-2 gap-2">
          {(['YES', 'NO'] as const).map((s) => {
            const p = s === 'YES' ? yesProb : 1 - yesProb;
            const active = side === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  haptics.selectImpact();
                  setSide(s);
                }}
                aria-pressed={active}
                className={clsx(
                  'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition active:scale-[0.98]',
                  s === 'YES'
                    ? active
                      ? 'border-yes bg-yes-soft text-yes'
                      : 'border-yes/30 bg-ink-900 text-yes hover:bg-yes-soft/60'
                    : active
                    ? 'border-no bg-no-soft text-no'
                    : 'border-no/30 bg-ink-900 text-no hover:bg-no-soft/60'
                )}
              >
                <span className="text-sm font-bold uppercase tracking-widest">
                  {s}
                </span>
                <span className="font-mono text-base tabular-nums">
                  ¢{Math.round(p * 100)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stake presets */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            <span>Stake</span>
            <span className="font-mono text-bone">${stake.toFixed(0)}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {STAKE_PRESETS.map((s) => {
              const active = stake === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    haptics.selectImpact();
                    setStake(s);
                  }}
                  aria-pressed={active}
                  className={clsx(
                    'rounded-lg border px-3 py-2 text-sm font-semibold tabular-nums transition active:scale-[0.96]',
                    active
                      ? 'border-volt bg-volt/15 text-volt'
                      : 'border-white/10 bg-ink-900 text-bone hover:border-white/20'
                  )}
                >
                  ${s}
                </button>
              );
            })}
          </div>
          <input
            type="range"
            min={1}
            max={1000}
            step={1}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            aria-label="Custom stake"
            className="mt-3 w-full accent-volt"
          />
        </div>

        {/* Cost breakdown */}
        <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-white/5 bg-ink-900 p-3 text-center">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
              Shares
            </dt>
            <dd className="mt-0.5 font-mono text-base font-bold tabular-nums text-bone">
              {shares.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
              Avg price
            </dt>
            <dd className="mt-0.5 font-mono text-base font-bold tabular-nums text-bone">
              ¢{cents}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
              Max return
            </dt>
            <dd className="mt-0.5 font-mono text-base font-bold tabular-nums text-volt">
              ${maxReturn.toFixed(0)}
            </dd>
          </div>
        </dl>

        {resolved && (
          <p className="mt-3 rounded-lg bg-no-soft/40 px-3 py-2 text-center text-xs text-no">
            Market resolved. Trading is closed.
          </p>
        )}

        {/*
         * The sheet relies on TG's MainButton (shown by useTgMainButton
         * above) for the primary commit action. We deliberately don't
         * render an in-sheet button — duplicating the CTA would
         * fragment user attention. On the off chance the user is in
         * an old TG client without MainButton support (TG < 6.1, very
         * rare in 2026), they can still close the sheet and use the
         * OrderBook on the right rail.
         */}
        <p className="mt-3 text-center text-[11px] text-bone-muted">
          Tap the green action button below to confirm.
        </p>
      </div>
    </div>
  );
}
