import Link from 'next/link';
import clsx from 'clsx';
import { TRADERS, MARKETS } from '@/lib/markets';
import { formatUSD, pct } from '@/lib/format';
import { MarketCard } from '@/components/MarketCard';

const REGION_LABEL: Record<string, string> = {
  KR: '🇰🇷 Korea',
  JP: '🇯🇵 Japan',
  SEA: '🌴 SEA',
  APAC: '🌏 APAC',
  GLOBAL: '🌐 Global',
};

const BADGE_LABEL: Record<string, string> = {
  oracle: '🔮 Oracle',
  culture: '💜 Culture Nerd',
  sniper: '🎯 Sniper',
  whale: '🐋 Whale',
};

export default function LeaderboardPage() {
  const top = TRADERS;
  const hotMarkets = [...MARKETS]
    .sort((a, b) => b.traders - a.traders)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/5 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-volt">
            April · 2026 · Season 02
          </div>
          <h1 className="mt-3 display-xl text-5xl text-bone md:text-7xl">
            APAC's sharpest.
          </h1>
          <p className="mt-3 max-w-2xl text-bone-muted">
            Conviction's leaderboard is ranked by 30-day P&L, not just volume.
            Winning $1 on a contrarian call counts more than churning whales.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-800 p-1 text-xs">
          {['30D', '90D', 'Season', 'All-time'].map((t, i) => (
            <button
              key={t}
              className={clsx(
                'rounded-full px-3 py-1 font-semibold transition',
                i === 0
                  ? 'bg-white/10 text-bone'
                  : 'text-bone-muted hover:text-bone'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {top.slice(0, 3).map((t, i) => (
          <div
            key={t.id}
            className={clsx(
              'relative overflow-hidden rounded-3xl border p-6',
              i === 0 && 'border-volt/40 bg-gradient-to-br from-volt/10 to-ink-800',
              i === 1 && 'border-conviction/40 bg-gradient-to-br from-conviction/10 to-ink-800',
              i === 2 && 'border-white/10 bg-ink-800'
            )}
          >
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="font-mono text-5xl font-bold text-bone">
                  #{i + 1}
                </div>
                <div className="text-6xl">{t.avatar}</div>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                  {REGION_LABEL[t.region]}
                </div>
                <h3 className="font-display text-3xl text-bone">@{t.handle}</h3>
                {t.badge && (
                  <span className="mt-2 inline-block rounded-full border border-white/10 bg-ink-900 px-2.5 py-1 text-[11px] text-bone">
                    {BADGE_LABEL[t.badge]}
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Mini k="P&L 30d" v={`+${formatUSD(t.pnl30d)}`} accent="text-volt" />
                <Mini k="Winrate" v={pct(t.winRate)} />
                <Mini k="Streak" v={`${t.streak}W`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-ink-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-900 text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            <tr>
              <Th className="w-12">Rank</Th>
              <Th>Trader</Th>
              <Th>Region</Th>
              <Th>Badge</Th>
              <Th className="text-right">P&L 30d</Th>
              <Th className="text-right">Winrate</Th>
              <Th className="text-right">Volume</Th>
              <Th className="text-right">Streak</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {top.map((t, i) => (
              <tr key={t.id} className="hover:bg-ink-700/50">
                <td className="p-4 font-mono text-bone-muted">#{i + 1}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xl">
                      {t.avatar}
                    </span>
                    <span className="font-medium text-bone">@{t.handle}</span>
                  </div>
                </td>
                <td className="p-4 text-bone-muted">
                  {REGION_LABEL[t.region]}
                </td>
                <td className="p-4">
                  {t.badge ? (
                    <span className="rounded-full border border-white/10 bg-ink-900 px-2 py-1 text-[11px] text-bone">
                      {BADGE_LABEL[t.badge]}
                    </span>
                  ) : (
                    <span className="text-bone-muted">—</span>
                  )}
                </td>
                <td className="p-4 text-right font-mono text-volt tabular-nums">
                  +{formatUSD(t.pnl30d)}
                </td>
                <td className="p-4 text-right font-mono tabular-nums text-bone">
                  {pct(t.winRate)}
                </td>
                <td className="p-4 text-right font-mono tabular-nums text-bone-muted">
                  {formatUSD(t.volume30d)}
                </td>
                <td className="p-4 text-right font-mono tabular-nums text-bone">
                  {t.streak}W
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hot markets */}
      <section className="mt-16">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-4xl text-bone">Hot markets 🔥</h2>
          <Link href="/" className="text-sm text-bone-muted hover:text-bone">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotMarkets.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      </section>

      {/* Rising predictors */}
      <section className="mt-16 mb-8 grid gap-6 md:grid-cols-3">
        <InsightCard
          title="Rising predictor of the week"
          body="@sea.contrarian called 3 K-pop comebacks before HYBE confirmed. 59% winrate on low-volume markets — pure edge, no volume flex."
        />
        <InsightCard
          title="Biggest upset"
          body="Parasite sequel market resolved NO at ¢09 after 72 hours of Cannes rumors. Smart money faded early — +142% ROI for @oracle.seoul."
        />
        <InsightCard
          title="AI vs Humans"
          body="Conviction Oracle beat the median trader on 68% of K-Drama markets this month. Sports is still a human game (54/46)."
        />
      </section>
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

function Mini({ k, v, accent }: { k: string; v: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
        {k}
      </div>
      <div
        className={`mt-1 font-mono text-base font-bold tabular-nums ${
          accent || 'text-bone'
        }`}
      >
        {v}
      </div>
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-volt">
        {title}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-bone">{body}</p>
    </div>
  );
}
