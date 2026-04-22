'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ParlayReceipt } from '@/lib/parlay';
import { readTickets } from '@/lib/parlay';
import { getMarket } from '@/lib/markets';
import { formatUSD } from '@/lib/format';
import { useT } from '@/lib/i18n';

function relativeTime(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 30) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function ParlayTickets() {
  const t = useT();
  const [tickets, setTickets] = useState<ParlayReceipt[]>([]);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    setTickets(readTickets());
    // Refresh on storage change (other tabs) + on window focus
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cv_tickets_v1') setTickets(readTickets());
    };
    const onFocus = () => setTickets(readTickets());
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      clearInterval(tick);
    };
  }, []);

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-3xl text-bone">
          {t('portfolio.tickets')}
        </h3>
        <span className="text-xs text-bone-muted">
          {mounted
            ? `${tickets.length} ${
                tickets.length === 1
                  ? t('portfolio.ticket_count_one')
                  : t('portfolio.ticket_count_many')
              }`
            : '—'}
        </span>
      </div>

      {!mounted ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-ink-800 p-8 text-center text-sm text-bone-muted">
          {t('portfolio.loading')}
        </div>
      ) : tickets.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-ink-800/40 p-10 text-center">
          <div className="text-4xl" aria-hidden="true">🎟️</div>
          <div className="font-display text-xl text-bone">No tickets yet</div>
          <p className="max-w-sm text-sm text-bone-muted">
            {t('portfolio.no_tickets')}
          </p>
          <Link
            href="/feed"
            className="mt-1 rounded-full bg-volt px-5 py-2 text-sm font-semibold text-ink-900 transition hover:bg-volt-dark"
          >
            Browse feed →
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {tickets.map((ticket) => (
            <li
              key={ticket.txHash}
              className="rounded-2xl border border-white/10 bg-ink-800 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                        ticket.status === 'OPEN'
                          ? 'bg-conviction/20 text-conviction'
                          : ticket.status === 'WON'
                          ? 'bg-yes-soft text-yes'
                          : 'bg-no-soft text-no'
                      )}
                    >
                      {ticket.status === 'OPEN'
                        ? t('portfolio.ticket_open')
                        : ticket.status === 'WON'
                        ? t('portfolio.ticket_won')
                        : t('portfolio.ticket_lost')}
                    </span>
                    <span className="text-[11px] text-bone-muted">
                      {ticket.legs.length} {t('parlay.legs')} · {ticket.multiplier.toFixed(2)}×
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-bone-muted">
                    {t('parlay.tx')} {ticket.txHash.slice(0, 10)}…{ticket.txHash.slice(-6)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-bone-muted">
                    {t('portfolio.ticket_to_win')}
                  </div>
                  <div className="font-mono text-xl font-bold tabular-nums text-volt">
                    {formatUSD(ticket.maxPayout)}
                  </div>
                  <div className="text-[11px] text-bone-muted">
                    {formatUSD(ticket.stake)} {t('portfolio.ticket_stake_suffix')}
                  </div>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                {ticket.legs.slice(0, 4).map((leg) => {
                  const m = getMarket(leg.marketId);
                  const label =
                    m?.kind === 'multi'
                      ? m.outcomes?.find((o) => o.id === leg.pick)?.label ?? leg.pick
                      : leg.pick;
                  return (
                    <li
                      key={leg.marketId}
                      className="flex items-center gap-2 rounded-lg bg-ink-900/50 px-2 py-1.5 text-xs"
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
                      {m ? (
                        <Link
                          href={`/markets/${m.slug}`}
                          className="line-clamp-1 flex-1 text-bone-muted hover:text-bone"
                        >
                          {m.title}
                        </Link>
                      ) : (
                        <span className="line-clamp-1 flex-1 text-bone-muted">
                          {leg.marketId}
                        </span>
                      )}
                      <span className="font-mono text-[11px] tabular-nums text-bone">
                        ¢{Math.round(leg.price * 100)}
                      </span>
                    </li>
                  );
                })}
                {ticket.legs.length > 4 && (
                  <li className="pl-2 text-[11px] text-bone-muted">
                    +{ticket.legs.length - 4} {t('portfolio.more_legs')}
                  </li>
                )}
              </ul>

              <div className="mt-3 flex items-center justify-between text-[11px] text-bone-muted">
                <span>
                  {t('portfolio.ticket_placed')} · {relativeTime(ticket.placedAt, now)}
                </span>
                <span className="font-mono">
                  {t('parlay.block')} #{ticket.blockNum.toLocaleString()}
                </span>
              </div>

              {ticket.sharePath && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link
                    href={ticket.sharePath}
                    className="rounded-full border border-white/10 bg-ink-900/60 px-3 py-1.5 text-[11px] font-semibold text-bone transition hover:border-volt/40 hover:text-volt"
                  >
                    {t('parlay.view_receipt')}
                  </Link>
                  <span className="font-mono text-[11px] text-bone-muted">
                    {ticket.id}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
