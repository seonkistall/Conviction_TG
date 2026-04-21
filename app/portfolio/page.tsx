import Link from 'next/link';
import {
  PORTFOLIO,
  ACTIVITY,
  CURRENT_USER,
  MARKETS,
  getMarket,
} from '@/lib/markets';
import { formatUSD, pct } from '@/lib/format';
import { PriceChart } from '@/components/PriceChart';
import { ParlayTickets } from '@/components/ParlayTickets';

export default function PortfolioPage() {
  const totalPnL = PORTFOLIO.reduce((a, p) => a + p.pnl, 0);
  const totalValue =
    PORTFOLIO.reduce((a, p) => a + p.shares * p.currentPrice, 0) +
    CURRENT_USER.available;

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
          sub={`${PORTFOLIO.length} active positions`}
          accent={totalPnL >= 0 ? 'text-yes' : 'text-no'}
        />
        <BigStat
          label="Available"
          value={formatUSD(CURRENT_USER.available)}
          sub="KRW · JPY · USDT on-ramps live"
        />
        <BigStat
          label="All-time P&L"
          value={`+${formatUSD(CURRENT_USER.pnlAllTime)}`}
          sub="Winrate 63% · 142 trades"
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
              Sorted by · P&L ↓
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-ink-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-900 text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                <tr>
                  <Th>Market</Th>
                  <Th>Side</Th>
                  <Th className="text-right">Shares</Th>
                  <Th className="text-right">Avg · Now</Th>
                  <Th className="text-right">P&L</Th>
                  <Th className="w-10"></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {PORTFOLIO.map((p) => {
                  const mk = getMarket(p.marketId) ?? MARKETS[0];
                  const pnlPct = (p.currentPrice / p.avgPrice - 1) * 100;
                  return (
                    <tr key={p.marketId} className="hover:bg-ink-700/50">
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
                        {p.shares}
                      </td>
                      <td className="p-4 text-right font-mono text-sm tabular-nums text-bone-muted">
                        ¢{Math.round(p.avgPrice * 100)} →{' '}
                        <span className="text-bone">¢{Math.round(p.currentPrice * 100)}</span>
                      </td>
                      <td
                        className={`p-4 text-right font-mono tabular-nums ${
                          p.pnl >= 0 ? 'text-yes' : 'text-no'
                        }`}
                      >
                        {p.pnl >= 0 ? '+' : ''}
                        ${p.pnl.toFixed(2)}
                        <div className="text-[11px] opacity-70">
                          {pnlPct >= 0 ? '+' : ''}
                          {pnlPct.toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button className="rounded-md border border-white/10 bg-ink-900 px-2.5 py-1 text-[11px] text-bone hover:bg-ink-700">
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity */}
        <div className="md:col-span-4">
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
