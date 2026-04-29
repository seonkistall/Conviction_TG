import Link from 'next/link';
import clsx from 'clsx';
import { TRADERS, AI_TRADERS, MARKETS } from '@/lib/markets';
import { formatUSD, pct } from '@/lib/format';
import { LiveMarketGrid } from '@/components/LiveMarketGrid';

/**
 * v2.20-6 — Agentic / Human / All filter for the leaderboard.
 *
 * Pre-v2.20 the leaderboard surfaced TRADERS (humans) only. AI_TRADERS
 * lived exclusively on /traders/[handle] detail + the AgenticTraders
 * home-section, with no leaderboard view — so a reader evaluating
 * "which quants should I copy?" vs "which humans are edging the AI?"
 * had no direct comparison surface.
 *
 * We now merge both arrays into a normalized `LeaderRow` and filter
 * via `?type=human|ai|all` (default all). Tabs are `<Link>`s so the
 * page stays fully static — no client handler needed. The AI label
 * and model surface in the table so rank #3 being an AI quant vs
 * rank #4 being a human narrative trader is legible at a glance.
 */
interface LeaderRow {
  id: string;
  handle: string;
  avatar: string;
  region: 'KR' | 'JP' | 'SEA' | 'APAC' | 'GLOBAL';
  pnl30d: number;
  winRate: number;
  isAi: boolean;
  // Only one of these will be meaningful per row — the table branches
  // off `isAi`.
  streak?: number;
  badge?: 'oracle' | 'culture' | 'sniper' | 'whale';
  volume30d?: number;
  model?: string;
  aum?: number;
  followers?: number;
}

type LeaderFilter = 'all' | 'human' | 'ai';

function buildRows(filter: LeaderFilter): LeaderRow[] {
  const humanRows: LeaderRow[] = TRADERS.map((t) => ({
    id: t.id,
    handle: t.handle,
    avatar: t.avatar,
    region: t.region,
    pnl30d: t.pnl30d,
    winRate: t.winRate,
    isAi: false,
    streak: t.streak,
    badge: t.badge,
    volume30d: t.volume30d,
  }));
  const aiRows: LeaderRow[] = AI_TRADERS.map((t) => ({
    id: t.id,
    handle: t.handle,
    avatar: t.avatar,
    region: t.region,
    pnl30d: t.pnl30d,
    winRate: t.winRate,
    isAi: true,
    model: t.model,
    aum: t.aum,
    followers: t.followers,
  }));
  const rows =
    filter === 'human' ? humanRows : filter === 'ai' ? aiRows : [...humanRows, ...aiRows];
  return rows.sort((a, b) => b.pnl30d - a.pnl30d);
}

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

export default function LeaderboardPage({
  searchParams,
}: {
  searchParams?: { type?: string };
}) {
  const filter: LeaderFilter =
    searchParams?.type === 'human'
      ? 'human'
      : searchParams?.type === 'ai'
        ? 'ai'
        : 'all';
  const top = buildRows(filter);
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
            Human traders and agentic quants compete on the same ladder.
          </p>
        </div>
        {/*
         * v2.20-6 — Segmented filter: All / Humans / Agentic. Links, not
         * buttons, so the page stays fully static-renderable. Active tab
         * is derived from the URL search param, so bookmarks and share
         * links preserve the view.
         */}
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-800 p-1 text-xs">
          {(
            [
              { label: '🌏 All', value: 'all', count: TRADERS.length + AI_TRADERS.length },
              { label: '🧑 Humans', value: 'human', count: TRADERS.length },
              { label: '🤖 Agentic', value: 'ai', count: AI_TRADERS.length },
            ] as const
          ).map((t) => {
            const active = filter === t.value;
            return (
              <Link
                key={t.value}
                href={t.value === 'all' ? '/leaderboard' : `/leaderboard?type=${t.value}`}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition',
                  active
                    ? 'bg-white/10 text-bone'
                    : 'text-bone-muted hover:text-bone'
                )}
              >
                <span>{t.label}</span>
                <span className="font-mono text-[10px] tabular-nums text-bone-muted">
                  {t.count}
                </span>
              </Link>
            );
          })}
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
                <h3 className="font-display text-3xl text-bone">
                  {t.isAi && (
                    <span
                      aria-label="Agentic trader"
                      className="mr-1"
                    >
                      🤖
                    </span>
                  )}
                  @{t.handle}
                </h3>
                {/* v2.20-6 — Badge row adapts to trader kind. Humans get
                    their existing badge chip; AI rows get a "Model · AI
                    agent" pill so the scan-read tells you "this is a
                    quant" without hunting. */}
                {t.isAi ? (
                  <span className="mt-2 inline-block rounded-full border border-conviction/40 bg-conviction/10 px-2.5 py-1 text-[11px] text-conviction">
                    🤖 {t.model} · AI agent
                  </span>
                ) : t.badge ? (
                  <span className="mt-2 inline-block rounded-full border border-white/10 bg-ink-900 px-2.5 py-1 text-[11px] text-bone">
                    {BADGE_LABEL[t.badge]}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Mini k="P&L 30d" v={`+${formatUSD(t.pnl30d)}`} accent="text-volt" />
                <Mini k="Winrate" v={pct(t.winRate)} />
                {t.isAi ? (
                  <Mini k="AUM" v={formatUSD(t.aum ?? 0) + "AUM"} />
                ) : (
                  <Mini k="Streak" v={`${t.streak ?? 0}W / ${(t.streak ?? 0) * 7}D`} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="relative mt-10 overflow-hidden rounded-2xl border border-white/10 bg-ink-800">
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full min-w-[760px] text-left text-sm md:min-w-0">
            <thead className="bg-ink-900 text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
              <tr>
                <Th className="sticky left-0 z-30 w-[72px] min-w-[72px] bg-ink-900 md:static md:w-12 md:min-w-0 md:z-auto md:bg-transparent">
                  Rank
                </Th>
                <Th className="sticky left-[72px] z-30 bg-ink-900 md:static md:left-auto md:z-auto md:bg-transparent">
                  Trader
                </Th>
                <Th>Region</Th>
                <Th>Kind / badge</Th>
                <Th className="text-right">P&L 30d</Th>
                <Th className="text-right">Winrate</Th>
                {/* v2.20-6: column heading adapts — when filtering to AI
                    only, we show AUM; human only, Volume; mixed, a
                    combined "Volume / AUM" header with per-row formatting. */}
                <Th className="text-right">
                  {filter === 'ai' ? 'AUM' : filter === 'human' ? 'Volume' : 'Volume / AUM'}
                </Th>
                <Th className="text-right">
                  {filter === 'ai' ? 'Followers' : filter === 'human' ? 'Streak' : 'Streak / Fol.'}
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {top.map((t, i) => (
                <tr
                  key={t.id}
                  className={clsx(
                    'hover:bg-ink-700/50',
                    t.isAi && 'bg-conviction/[0.04]'
                  )}
                >
                  <td
                    className={clsx(
                      'sticky left-0 z-10 w-[72px] min-w-[72px] p-2 md:p-4 font-mono text-bone-muted md:static md:w-auto md:min-w-0 md:z-auto',
                      t.isAi
                        ? 'bg-ink-800 [background:linear-gradient(rgba(124,92,255,0.04),rgba(124,92,255,0.04)),#0B0D14] md:bg-transparent md:bg-none'
                        : 'bg-ink-800 md:bg-transparent'
                    )}
                  >
                    #{i + 1}
                  </td>
                  <td
                    className={clsx(
                      'sticky left-[72px] z-10 p-2 md:p-4 md:static md:left-auto md:z-auto',
                      t.isAi
                        ? 'bg-ink-800 [background:linear-gradient(rgba(124,92,255,0.04),rgba(124,92,255,0.04)),#0B0D14] md:bg-transparent md:bg-none'
                        : 'bg-ink-800 md:bg-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xl">
                        {t.avatar}
                      </span>
                      {t.isAi ? (
                        <Link
                          href={`/traders/${t.handle}`}
                          className="font-medium text-bone hover:text-conviction"
                        >
                          🤖 @{t.handle}
                        </Link>
                      ) : (
                        <span className="font-medium text-bone">@{t.handle}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 md:p-4 text-bone-muted">
                    {REGION_LABEL[t.region]}
                  </td>
                  <td className="p-2 md:p-4">
                    {t.isAi ? (
                      <span className="rounded-full border border-conviction/40 bg-conviction/10 px-2 py-1 text-[11px] text-conviction">
                        🤖 {t.model}
                      </span>
                    ) : t.badge ? (
                      <span className="rounded-full border border-white/10 bg-ink-900 px-2 py-1 text-[11px] text-bone">
                        {BADGE_LABEL[t.badge]}
                      </span>
                    ) : (
                      <span className="text-bone-muted">—</span>
                    )}
                  </td>
                  <td className="p-2 md:p-4 text-right font-mono text-volt tabular-nums">
                    +{formatUSD(t.pnl30d)}
                  </td>
                  <td className="p-2 md:p-4 text-right font-mono tabular-nums text-bone">
                    {pct(t.winRate)}
                  </td>
                  <td className="p-2 md:p-4 text-right font-mono tabular-nums text-bone-muted">
                    {t.isAi ? formatUSD(t.aum ?? 0) : formatUSD(t.volume30d ?? 0)}
                  </td>
                  <td className="p-2 md:p-4 text-right font-mono tabular-nums text-bone">
                    {t.isAi
                      ? `${(t.followers ?? 0).toLocaleString()} Followers`
                      : `${t.streak ?? 0}W / ${(t.streak ?? 0) * 7}D`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-8 bg-gradient-to-l from-ink-800 to-transparent md:hidden" />
      </div>

      {/* Hot markets */}
      <section className="mt-16">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-4xl text-bone">Hot markets 🔥</h2>
          <Link href="/" className="text-sm text-bone-muted hover:text-bone">
            See all →
          </Link>
        </div>
        <LiveMarketGrid
          markets={hotMarkets}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        />
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
  return <th className={`p-2 md:p-4 font-semibold ${className}`}>{children}</th>;
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
