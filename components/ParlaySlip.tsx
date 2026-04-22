'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useParlay } from '@/lib/parlay';
import { useT } from '@/lib/i18n';
import { getMarket } from '@/lib/markets';
import { formatUSD } from '@/lib/format';

export function ParlaySlip() {
  const {
    legs,
    stake,
    open,
    placing,
    receipt,
    setStake,
    remove,
    clear,
    toggle,
    place,
    dismissReceipt,
    multiplier,
    impliedProb,
    maxPayout,
  } = useParlay();
  const t = useT();
  const count = legs.length;

  return (
    <>
      {/* Floating trigger — bottom-right */}
      <button
        type="button"
        onClick={() => toggle()}
        className={clsx(
          'fixed bottom-20 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-3 font-semibold shadow-2xl transition md:bottom-6 md:right-6',
          count > 0
            ? 'bg-gradient-to-r from-volt to-volt-dark text-ink-900 hover:brightness-105'
            : 'border border-white/10 bg-ink-800 text-bone-muted hover:text-bone'
        )}
        aria-label="Open parlay slip"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
        </svg>
        <span className="text-sm">{t('parlay.title')}</span>
        {count > 0 && (
          <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1.5 text-[11px] font-bold text-volt">
            {count}
          </span>
        )}
      </button>

      {/* Drawer */}
      <div
        className={clsx(
          'fixed inset-0 z-50 transition',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!open}
      >
        <div
          className={clsx(
            'absolute inset-0 sheet-overlay transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => (placing ? null : toggle(false))}
        />
        <aside
          className={clsx(
            'absolute bottom-0 right-0 flex h-[90dvh] w-full flex-col rounded-t-3xl border-t border-white/10 bg-ink-900 p-6 shadow-2xl transition-transform duration-300 md:top-0 md:h-auto md:w-[420px] md:rounded-l-3xl md:rounded-tr-none md:border-l md:border-t-0',
            open ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'
          )}
        >
          {receipt ? (
            <ReceiptScreen />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-conviction">
                    {count} {t('parlay.legs')}
                  </div>
                  <h3 className="font-display text-3xl text-bone">
                    {t('parlay.title')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(false)}
                  disabled={placing}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-bone-muted hover:text-bone disabled:opacity-40"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {count === 0 ? (
                <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
                  <div className="text-5xl">🎯</div>
                  <p className="mt-4 max-w-xs text-sm text-bone-muted">
                    {t('parlay.empty')}
                  </p>
                </div>
              ) : (
                <div className="mt-5 flex-1 overflow-y-auto pr-1">
                  <ul className="space-y-2">
                    {legs.map((leg) => {
                      const m = getMarket(leg.marketId);
                      const outcomeLabel =
                        m?.kind === 'multi'
                          ? m.outcomes?.find((o) => o.id === leg.pick)?.label ?? leg.pick
                          : leg.pick;
                      return (
                        <li
                          key={leg.marketId}
                          className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink-800 p-3"
                        >
                          {m && (
                            <img
                              src={m.media.poster}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-md object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-xs text-bone">
                              {m?.title ?? leg.marketId}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={clsx(
                                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                                  leg.pick === 'YES'
                                    ? 'bg-yes-soft text-yes'
                                    : leg.pick === 'NO'
                                    ? 'bg-no-soft text-no'
                                    : 'bg-conviction/20 text-conviction'
                                )}
                              >
                                {outcomeLabel}
                              </span>
                              <span className="font-mono text-[11px] tabular-nums text-bone-muted">
                                ¢{Math.round(leg.price * 100)}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(leg.marketId)}
                            disabled={placing}
                            className="text-bone-muted hover:text-no disabled:opacity-40"
                            aria-label="Remove leg"
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Stake input */}
                  <div className="mt-5 rounded-xl border border-white/10 bg-ink-800 p-4">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                      {t('parlay.stake')}
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-mono text-bone-muted">$</span>
                      <input
                        type="number"
                        min={1}
                        value={stake}
                        disabled={placing}
                        onChange={(e) => setStake(Number(e.target.value) || 0)}
                        className="w-full bg-transparent font-mono text-3xl font-bold tabular-nums text-bone focus:outline-none"
                      />
                    </div>
                    <div className="mt-2 flex gap-1">
                      {[10, 25, 100, 500].map((v) => (
                        <button
                          key={v}
                          type="button"
                          disabled={placing}
                          onClick={() => setStake(v)}
                          className="flex-1 rounded-md border border-white/10 bg-ink-900 px-2 py-1 text-[11px] font-mono text-bone-muted hover:text-bone disabled:opacity-40"
                        >
                          ${v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-4 space-y-2 rounded-xl border border-volt/30 bg-volt/5 p-4">
                    <Row
                      label={t('parlay.mult')}
                      value={`${multiplier.toFixed(2)}×`}
                      accent="text-volt"
                    />
                    <Row
                      label="Implied probability"
                      value={`${(impliedProb * 100).toFixed(2)}%`}
                    />
                    <Row
                      label={t('parlay.payout')}
                      value={formatUSD(maxPayout)}
                      accent="text-volt"
                      large
                    />
                  </div>
                </div>
              )}

              {/* Footer actions */}
              {count > 0 && (
                <div className="mt-4 flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={clear}
                    disabled={placing}
                    className="rounded-full border border-white/10 bg-ink-800 px-4 py-3 text-sm font-semibold text-bone-muted hover:text-bone disabled:opacity-40"
                  >
                    {t('parlay.clear')}
                  </button>
                  <button
                    type="button"
                    onClick={place}
                    disabled={placing}
                    className={clsx(
                      'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-ink-900 transition',
                      placing
                        ? 'bg-volt/50 cursor-wait'
                        : 'bg-gradient-to-r from-volt to-volt-dark hover:brightness-105'
                    )}
                  >
                    {placing ? (
                      <>
                        <Spinner />
                        <span>{t('parlay.placing')}</span>
                      </>
                    ) : (
                      <span>
                        {t('parlay.place')} · {formatUSD(maxPayout)}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  );

  function ReceiptScreen() {
    if (!receipt) return null;
    const shortHash = `${receipt.txHash.slice(0, 10)}…${receipt.txHash.slice(-6)}`;
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-volt">
              ✓ {t('parlay.placed')}
            </div>
            <h3 className="font-display text-3xl text-bone">
              {formatUSD(receipt.maxPayout)}
            </h3>
          </div>
          <button
            type="button"
            onClick={dismissReceipt}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-bone-muted hover:text-bone"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Success animation */}
        <div className="mt-6 flex items-center justify-center">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-volt/20" />
            <div className="absolute inset-2 rounded-full border-2 border-volt/40" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-volt text-ink-900">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Ticket details */}
        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-ink-800 p-4">
          <Row
            label={`${receipt.legs.length} ${t('parlay.legs')}`}
            value={`${receipt.multiplier.toFixed(2)}×`}
            accent="text-volt"
          />
          <Row label={t('parlay.stake')} value={formatUSD(receipt.stake)} />
          <Row
            label={t('parlay.payout')}
            value={formatUSD(receipt.maxPayout)}
            accent="text-volt"
          />
          <div className="my-2 h-px bg-white/10" />
          <Row label={t('parlay.tx')} value={shortHash} mono />
          <Row
            label={t('parlay.block')}
            value={`#${receipt.blockNum.toLocaleString()}`}
            mono
          />
        </div>

        {/* Legs list compact */}
        <ul className="mt-4 space-y-2 overflow-y-auto pr-1">
          {receipt.legs.map((leg) => {
            const m = getMarket(leg.marketId);
            const label =
              m?.kind === 'multi'
                ? m.outcomes?.find((o) => o.id === leg.pick)?.label ?? leg.pick
                : leg.pick;
            return (
              <li
                key={leg.marketId}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-ink-900/60 px-3 py-2 text-xs"
              >
                <span
                  className={clsx(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                    leg.pick === 'YES'
                      ? 'bg-yes-soft text-yes'
                      : leg.pick === 'NO'
                      ? 'bg-no-soft text-no'
                      : 'bg-conviction/20 text-conviction'
                  )}
                >
                  {label}
                </span>
                <span className="line-clamp-1 flex-1 text-bone-muted">
                  {m?.title ?? leg.marketId}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-bone">
                  ¢{Math.round(leg.price * 100)}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Footer actions */}
        <div className="mt-4 flex gap-2 pt-4">
          <button
            type="button"
            onClick={dismissReceipt}
            className="rounded-full border border-white/10 bg-ink-800 px-4 py-3 text-sm font-semibold text-bone-muted hover:text-bone"
          >
            {t('parlay.place_another')}
          </button>
          <Link
            href={receipt.sharePath}
            onClick={dismissReceipt}
            className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-volt to-volt-dark px-4 py-3 text-sm font-bold text-ink-900 hover:brightness-105"
          >
            {t('parlay.view_receipt')}
          </Link>
        </div>
      </div>
    );
  }
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
    </svg>
  );
}

function Row({
  label,
  value,
  accent,
  large,
  mono,
}: {
  label: string;
  value: string;
  accent?: string;
  large?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-bone-muted">{label}</span>
      <span
        className={clsx(
          'tabular-nums',
          mono ? 'font-mono text-xs' : 'font-mono font-bold',
          large ? 'text-2xl' : 'text-base',
          accent ?? 'text-bone'
        )}
      >
        {value}
      </span>
    </div>
  );
}
