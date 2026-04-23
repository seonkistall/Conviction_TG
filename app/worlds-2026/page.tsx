import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoVideo } from '@/components/AutoVideo';
import { LiveMarketGrid } from '@/components/LiveMarketGrid';
import { MARKETS, getMarket } from '@/lib/markets';
import { formatUSD, pct } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Worlds 2026 · Conviction',
  description:
    'LCK vs LPL — price every storyline of the 2026 League of Legends World Championship. Team futures, player props, parlays. Priced by AI, graded by a 23-source evidence swarm.',
  openGraph: {
    title: 'Worlds 2026 · Conviction',
    description: 'LCK vs LPL — trade every storyline of Worlds 2026.',
    images: ['/og-image.png'],
  },
};

/** Inline outcome row — compact seed card for the LCK/LPL bracket view. */
function Seed({
  label,
  prob,
  color,
}: {
  label: string;
  prob: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: color ?? '#7C5CFF' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-bone">
            {label}
          </span>
          <span className="font-mono text-sm tabular-nums text-bone">
            ¢{Math.round(prob * 100)}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-900">
          <div
            className="h-full"
            style={{
              width: `${prob * 100}%`,
              background: color ?? '#7C5CFF',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** Worlds 2026 Hub — LCK vs LPL bracket, consolidated esports markets, player props. */
export default function Worlds2026Page() {
  const worldsWinner = getMarket('mkt_worlds_winner_2026')!;
  const t1Binary = getMarket('mkt_t1_worlds_2026')!;
  const lckSpring = getMarket('mkt_lck_spring_2026')!;
  const lplSpring = getMarket('mkt_lpl_spring_2026')!;
  const fakerMVP = getMarket('mkt_faker_worlds_mvp')!;
  const knightKDA = getMarket('mkt_knight_kda_worlds')!;

  const lckTeams =
    worldsWinner.outcomes?.filter((o) => ['t1', 'gen', 'hle'].includes(o.id)) ??
    [];
  const lplTeams =
    worldsWinner.outcomes?.filter((o) => ['blg', 'tes'].includes(o.id)) ?? [];

  const lckVolume = MARKETS.filter(
    (m) =>
      m.category === 'Esports' &&
      m.region === 'KR' &&
      (m.tags.includes('LCK') ||
        m.tags.includes('Faker') ||
        m.tags.includes('T1')),
  ).reduce((a, m) => a + m.volume, 0);

  const lplVolume = MARKETS.filter(
    (m) => m.category === 'Esports' && m.region === 'CN',
  ).reduce((a, m) => a + m.volume, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-bone-muted">
        <Link href="/" className="hover:text-bone">
          Markets
        </Link>
        <span>·</span>
        <Link href="/feed" className="hover:text-bone">
          Esports
        </Link>
        <span>·</span>
        <span className="text-bone">Worlds 2026</span>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-800">
        <div className="absolute inset-0 opacity-40">
          <AutoVideo media={worldsWinner.media} fit="cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-transparent" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-volt">
              <span className="live-dot" />
              Live · November 2026 · Paris / Beijing co-hosted
            </div>
            <h1 className="mt-3 font-display text-4xl leading-[0.95] text-bone md:text-6xl">
              Worlds 2026
              <br />
              <span className="italic text-conviction">LCK vs LPL.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-bone-muted md:text-base">
              Every storyline of the 2026 League of Legends World Championship,
              priced. Team futures · region rivalries · Faker + Knight player
              props · parlays that touch both leagues. Audio on, mute off —
              this is the feed.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-volt/50 bg-volt/10 px-2.5 py-1 font-mono uppercase tracking-widest text-volt">
                T1 · Faker
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono uppercase tracking-widest text-bone-muted">
                JDG · Knight
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono uppercase tracking-widest text-bone-muted">
                BLG · Ruler
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:w-[360px]">
            <div className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
              <div className="text-[10px] uppercase tracking-widest text-bone-muted">
                LCK volume
              </div>
              <div className="mt-1 font-mono text-2xl tabular-nums text-bone">
                {formatUSD(lckVolume)}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
              <div className="text-[10px] uppercase tracking-widest text-bone-muted">
                LPL volume
              </div>
              <div className="mt-1 font-mono text-2xl tabular-nums text-bone">
                {formatUSD(lplVolume)}
              </div>
            </div>
            <div className="col-span-2 rounded-xl border border-white/10 bg-ink-900/60 p-3">
              <div className="text-[10px] uppercase tracking-widest text-bone-muted">
                Top-of-book · Summoner&apos;s Cup
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-xl tabular-nums text-volt">
                  T1 · {pct(worldsWinner.outcomes?.[0]?.prob ?? 0)}
                </span>
                <span className="font-mono text-xs text-bone-muted">
                  {worldsWinner.traders.toLocaleString()} traders
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LCK vs LPL bracket */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">LCK seeds</h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
              Korea
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {lckTeams.map((o) => (
              <Seed
                key={o.id}
                label={o.label}
                prob={o.prob}
                color={o.color}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-bone-muted">
            <span>LCK Spring champion prop ·</span>
            <Link
              href={`/markets/${lckSpring.slug}`}
              className="font-semibold text-conviction hover:text-bone"
            >
              Trade LCK Spring →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">LPL seeds</h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
              China
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {lplTeams.map((o) => (
              <Seed
                key={o.id}
                label={o.label}
                prob={o.prob}
                color={o.color}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-bone-muted">
            <span>LPL Spring champion prop ·</span>
            <Link
              href={`/markets/${lplSpring.slug}`}
              className="font-semibold text-conviction hover:text-bone"
            >
              Trade LPL Spring →
            </Link>
          </div>
        </div>
      </section>

      {/* Player props */}
      <section className="mt-10">
        <h2 className="font-display text-3xl">Player props</h2>
        <p className="mt-1 max-w-xl text-sm text-bone-muted">
          Graded by a 23-source evidence swarm — official Riot draft logs,
          Leaguepedia KDA, patch-meta priors.
        </p>
        <LiveMarketGrid
          markets={[fakerMVP, knightKDA]}
          size="wide"
          className="mt-4 grid gap-4 md:grid-cols-2"
        />
      </section>

      {/* Featured championship markets */}
      <section className="mt-10">
        <h2 className="font-display text-3xl">Championship markets</h2>
        <LiveMarketGrid
          markets={[worldsWinner, t1Binary, lckSpring]}
          size="wide"
          className="mt-4 grid gap-4 md:grid-cols-3"
        />
      </section>

      {/* Narrative index callout */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐉</span>
          <div>
            <div className="font-display text-xl text-bone">
              Build a Worlds 2026 parlay
            </div>
            <div className="text-xs text-bone-muted">
              Stack LCK Spring · LPL Spring · Faker MVP · Worlds Winner — all
              correlated, all on one ticket. Multiplier compounds.
            </div>
          </div>
          <Link
            href="/feed"
            className="ml-auto hidden rounded-md bg-volt px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-volt-dark md:inline-block"
          >
            Open feed →
          </Link>
        </div>
      </section>
    </div>
  );
}
