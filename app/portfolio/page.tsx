'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ACTIVITY,
  CURRENT_USER,
  MARKETS,
  getMarket,
  priceHistory,
} from '@/lib/markets';
import { formatUSD } from '@/lib/format';
import { PriceChart } from '@/components/PriceChart';
import { ParlayTickets } from '@/components/ParlayTickets';
import { Sparkline } from '@/components/Sparkline';
import { HotPositions } from '@/components/HotPositions';
import { usePositions } from '@/lib/positions';
import { useToast } from '@/lib/toast';

export default function PortfolioPage() {
  const { positions, closed, hydrated, close } = usePositions();
  const { push } = useToast();

  // While the positions provider is still hydrating from localStorage we
  // deliberately render the stat row + table using an empty list (and show
  // a subtle "syncing…" hint) — this avoids a flash of seed values for
  // returning users who have a different set of trades in their browser.
  const totalPnL = useMemo(
    () => positions.reduce((a, p) => a + p.pnl, 0),
    [positions]
  );
  const totalValue = useMemo(
    () =>
      positions.reduce((a, p) => a + p.shares * p.currentPrice, 0) +
      CURRENT_USER.available,
    [positions]
  );
  const realizedPnL = useMemo(
    () => closed.reduce((a, f) => a + f.pnl, 0),
    [closed]
  );

  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-conviction/20 text-3xl">
              {CURRENT_USER.avatar}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                Logged in as
              </div>
              <h1 className="font-display text-4xl text-bone">
                @{CURRENT_USER.handle}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full border border-white/10 bg-ink-800 px-5 py-2.5 text-sm font-semibold text-bone hover:bg-ink-700">
            Deposit
          </button>
          <button className="rounded-full bg-volt px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-volt-dark">
            Withdraw
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <BigStat
          label="Portfolio value"
          value={formatUSD(totalValue)}
          sub={`+${formatUSD(CURRENT_USER.pnl30d)} · 30d`}
          accent="text-volt"
        />
        <BigStat
          label="Open P&L"
          value={`${totalPnL >= 0 ? '+' : ''}${formatUSD(totalPnL)}`}
          sub={`${positions.length} active positions${
            hydrated ? '' : ' · syncing…'
          }`}
          accent={totalPnL >= 0 ? 'text-yes' : 'text-no'}
        />
        <BigStat
          label="Available"
          value={formatUSD(CURRENT_USER.available)}
          sub="KRW · JPY · USDT on-ramps live"
        />
        <BigStat
          label="Realized P&L"
          value={`${realizedPnL >= 0 ? '+' : ''}${formatUSD(realizedPnL)}`}
          sub={`${closed.length} closed · session`}
          accent={realizedPnL >= 0 ? 'text-yes' : 'text-no'}
        />
      </div>

      {/* PnL chart */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-ink-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl text-bone">Net worth · 30 days</h3>
            <p className="text-sm text-bone-muted">
              Includes open positions marked to current price.
            </p>
          </div>
          <div className="font-mono text-3xl font-bold tabular-nums text-volt">
            +{formatUSD(CURRENT_USER.pnl30d)}
          </div>
        </div>
        <div className="mt-5 h-64 chart-grid-bg">
          <PriceChart seed={77} days={30} stroke="#C6FF3D" />
        </div>
      </div>

      {/* Parlay tickets ledger */}
      <ParlayTickets />

      <div className="mt-8 grid gap-8 md:grid-cols-12">
        {/* Positions */}
        <div className="md:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-3xl text-bone">Open positions</h3>
            <div className="text-xs text-bone-muted">
              {positions.length > 0
                ? 'Sorted by · P&L ↓'
                : hydrated
                ? 'No open positions yet'
                : 'Syncing…'}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-ink-800">
            {positions.length === 0 && hydrated ? (
              <EmptyState />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-900 text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                  <tr>
                    <Th>Market</Th>
                    <Th>Side</Th>
                    <Th className="text-right">Shares</Th>
                    <Th className="text-right">Avg · Now</Th>
                    <Th className="hidden text-right md:table-cell">
                      Trend · 14d
                    </Th>
                    <Th className="text-right">P&L</Th>
                    <Th className="w-10"></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {positions
                    .slice()
                    .sort((a, b) => b.pnl - a.pnl)
                    .map((p) => {
                      const mk = getMarket(p.marketId) ?? MARKETS[0];
                      // Use the live market's yesProb as the mark price so
                      // "now" reflects the app's current state rather than
                      // the stale currentPrice we wrote at buy time.
                      const mark =
                        p.side === 'YES' ? mk.yesProb : 1 - mk.yesProb;
                      const livePnl = p.shares * (mark - p.avgPrice);
                      const pnlPct = (mark / p.avgPrice - 1) * 100;
                      // 14-day trend series — seeded from the market's
                      // yesProb and flipped for NO positions so "up" on the
                      // sparkline visually corresponds to the user winning.
                      const rawSeries = priceHistory(mk.yesProb * 100, 14);
                      const series =
                        p.side === 'YES' ? rawSeries : rawSeries.map((v) => 1 - v);
                      const dir: 'up' | 'down' | 'flat' =
                        Math.abs(mark - p.avgPrice) < 0.005
                          ? 'flat'
                          : mark > p.avgPrice
                          ? 'up'
                          : 'down';
                      return (
                        <tr
                          key={`${p.marketId}-${p.side}`}
                          className="hover:bg-ink-700/50"
                        >
                          <td className="p-4">
                            <Link
                              href={`/markets/${mk.slug}`}
                              className="flex items-center gap-3"
                            >
                              <img
                                src={mk.media.poster}
                                alt=""
                                className="h-10 w-10 rounded-md object-cover"
                              />
                              <div>
                                <div className="font-medium text-bone line-clamp-1">
                                  {mk.title}
                                </div>
                                <div className="text-[11px] text-bone-muted">
                                  {mk.category}
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-widest ${
                                p.side === 'YES'
                                  ? 'bg-yes-soft text-yes'
                                  : 'bg-no-soft text-no'
                              }`}
                            >
                              {p.side}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono tabular-nums text-bone">
                            {p.shares.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-mono text-sm tabular-nums text-bone-muted">
                            ¢{Math.round(p.avgPrice * 100)} →{' '}
                            <span className="text-bone">
                              ¢{Math.round(mark * 100)}
                            </span>
                          </td>
                          <td className="hidden p-4 text-right md:table-cell">
                            <span className="inline-block align-middle">
                              <Sparkline
                                data={series}
                                baseline={p.avgPrice}
                                direction={dir}
                                width={90}
                                height={26}
                              />
                            </span>
                          </td>
                          <td
                            className={`p-4 text-right font-mono tabular-nums ${
                              livePnl >= 0 ? 'text-yes' : 'text-no'
                            }`}
                          >
                            {livePnl >= 0 ? '+' : ''}
                            ${livePnl.toFixed(2)}
                            <div className="text-[11px] opacity-70">
                              {pnlPct >= 0 ? '+' : ''}
                              {pnlPct.toFixed(1)}%
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                close(p.marketId, p.side, mark);
                                push({
                                  kind: 'trade',
                                  title: `Closed ${p.side} · ${p.shares.toLocaleString()} shares`,
                                  body: `${mk.title} · Realized ${
                                    livePnl >= 0 ? '+' : ''
                                  }$${livePnl.toFixed(2)}`,
                                  amount: `¢${Math.round(mark * 100)}`,
                                });
                              }}
                              className="rounded-md border border-white/10 bg-ink-900 px-2.5 py-1 text-[11px] text-bone hover:bg-ink-700"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>

          {/* Closed positions (realized) — lightweight, only if non-empty */}
          {closed.length > 0 && (
            <div className="mt-6">
              <h4 className="font-display text-xl text-bone">
                Recently closed
              </h4>
              <ul className="mt-3 space-y-2">
                {closed.slice(0, 5).map((f) => {
                  const mk = getMarket(f.marketId);
                  return (
                    <li
                      key={`${f.marketId}-${f.side}-${f.closedAt}`}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-ink-800 p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-bone">
                          {mk?.title ?? f.marketId}
                        </div>
                        <div className="text-[11px] text-bone-muted">
                          {f.side} · {f.shares.toLocaleString()} @ ¢
                          {Math.round(f.avgPrice * 100)} → ¢
                          {Math.round(f.closePrice * 100)}
                        </div>
                      </div>
                      <div
                        className={`font-mono tabular-nums ${
                          f.pnl >= 0 ? 'text-yes' : 'text-no'
                        }`}
                      >
                        {f.pnl >= 0 ? '+' : ''}${f.pnl.toFixed(2)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Activity column — Hot positions first, then raw activity feed. */}
        <div className="md:col-span-4 space-y-6">
          <HotPositions />
          <h3 className="font-display text-3xl text-bone">Activity</h3>
          <ul className="mt-4 space-y-3">
            {ACTIVITY.map((a) => {
              const mk = a.marketId ? getMarket(a.marketId) : null;
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-white/5 bg-ink-800 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                        a.type === 'trade'
                          ? 'bg-volt/20 text-volt'
                          : a.type === 'resolve'
                          ? 'bg-yes-soft text-yes'
                          : a.type === 'create'
                          ? 'bg-conviction/20 text-conviction'
                          : 'bg-white/10 text-bone'
                      }`}
                    >
                      {a.type === 'trade'
                        ? '⇌'
                        : a.type === 'resolve'
                        ? '✓'
                        : a.type === 'create'
                        ? '＋'
                        : '◎'}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm text-bone">{a.detail}</div>
                      {mk && (
                        <Link
                          href={`/markets/${mk.slug}`}
                          className="mt-1 block text-[11px] text-bone-muted line-clamp-1 hover:text-bone"
                        >
                          ↳ {mk.title}
                        </Link>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-bone-muted">
                        <span>{new Date(a.at).toLocaleString()}</span>
                        {a.amount && (
                          <span className="font-mono text-bone">
                            ${a.amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
        {label}
      </div>
      <div
        className={`mt-2 font-mono text-3xl font-bold tabular-nums ${
          accent || 'text-bone'
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-bone-muted">{sub}</div>}
    </div>
  );
}

function Th({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={`p-4 font-semibold ${className}`}>{children}</th>;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="text-3xl">🗂️</div>
      <div className="font-display text-xl text-bone">
        No positions yet
      </div>
      <p className="max-w-sm text-sm text-bone-muted">
        Tap YES or NO on any market to add it to a parlay, or open a market
        and place a direct trade. Your positions will appear here and
        persist in this browser.
      </p>
      <Link
        href="/feed"
        className="mt-1 rounded-full bg-volt px-5 py-2 text-sm font-semibold text-ink-900 hover:bg-volt-dark"
      >
        Browse the feed →
      </Link>
    </div>
  );
}
