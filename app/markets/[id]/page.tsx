import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MARKETS, getMarket } from '@/lib/markets';
import { formatUSD, pct, timeUntil } from '@/lib/format';
import { AutoVideo } from '@/components/AutoVideo';
import { OrderBook } from '@/components/OrderBook';
import { OutcomeBar } from '@/components/OutcomeBar';
import { EdgeBadge } from '@/components/EdgeBadge';
import { PriceChart } from '@/components/PriceChart';
import { AIOracleCard } from '@/components/AIOracleCard';
import { MarketCard } from '@/components/MarketCard';

export function generateStaticParams() {
  return MARKETS.map((m) => ({ id: m.slug }));
}

export default function MarketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const m = getMarket(params.id);
  if (!m) return notFound();

  const related = MARKETS.filter(
    (x) => x.id !== m.id && x.category === m.category
  ).slice(0, 4);

  const seed = m.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-bone-muted">
        <Link href="/" className="hover:text-bone">
          Markets
        </Link>
        <span>/</span>
        <Link
          href={`/?category=${m.category}`}
          className="hover:text-bone"
        >
          {m.category}
        </Link>
        <span>/</span>
        <span className="text-bone">{m.slug}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Left column — video + chart + details */}
        <div className="space-y-6 md:col-span-8">
          {/* Hero video */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10">
            <div className="aspect-[16/9]">
              <AutoVideo
                media={m.media}
                fit="cover"
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 card-gradient" />
            </div>
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-ink-900/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-bone backdrop-blur">
                  {m.category}
                </span>
                {m.kind === 'multi' && (
                  <span className="inline-flex items-center rounded-full bg-conviction/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-conviction backdrop-blur">
                    {m.outcomes?.length}-way
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/80 px-2.5 py-1 text-[11px] text-bone-muted backdrop-blur">
                  <span className="live-dot" />
                  Live
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-ink-900/80 px-2.5 py-1 text-[11px] text-bone-muted backdrop-blur">
                  Closes in {timeUntil(m.endsAt)}
                </span>
                {typeof m.edgePP === 'number' && m.edgePP >= 5 && (
                  <EdgeBadge pp={m.edgePP} size="md" />
                )}
              </div>
              <button className="rounded-full border border-white/10 bg-ink-900/80 px-3 py-1.5 text-xs font-semibold text-bone backdrop-blur hover:bg-ink-900">
                Share
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h1 className="font-display text-3xl leading-[1.05] text-bone md:text-5xl">
                {m.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {m.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-ink-900/70 px-2.5 py-1 text-[11px] text-bone-muted backdrop-blur"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Yes probability" value={pct(m.yesProb)} accent="text-volt" />
            <Stat label="Volume" value={formatUSD(m.volume)} />
            <Stat label="Liquidity" value={formatUSD(m.liquidity)} />
            <Stat label="Traders" value={m.traders.toLocaleString()} />
          </div>

          {/* Price chart */}
          <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl text-bone">Price history</h3>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900 p-1 text-[11px]">
                {['1D', '1W', '1M', 'ALL'].map((r, i) => (
                  <button
                    key={r}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      i === 2 ? 'bg-white/10 text-bone' : 'text-bone-muted hover:text-bone'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 chart-grid-bg">
              <PriceChart seed={seed} days={30} />
            </div>
          </div>

          {/* Resolution criteria */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
              <h3 className="font-display text-xl text-bone">Resolution criteria</h3>
              <p className="mt-3 text-sm leading-relaxed text-bone-muted">
                {m.description}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
              <h3 className="font-display text-xl text-bone">Timeline</h3>
              <ol className="mt-3 space-y-3 text-sm">
                <TimelineItem
                  dot="bg-volt"
                  label="Trading opened"
                  value="Apr 02, 2026"
                />
                <TimelineItem
                  dot="bg-bone-muted"
                  label="Trading ends"
                  value={new Date(m.endsAt).toLocaleString()}
                />
                <TimelineItem
                  dot="border border-bone-muted"
                  label="Resolution"
                  value={new Date(m.resolvesAt).toLocaleString()}
                />
              </ol>
            </div>
          </div>

          {/* Recent trades */}
          <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-2xl text-bone">Recent trades</h3>
              <span className="text-[11px] text-bone-muted">Live · websocket</span>
            </div>
            <div className="divide-y divide-white/5">
              {mockTrades(m.yesProb).map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{t.avatar}</span>
                    <span className="text-bone">{t.handle}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        t.side === 'YES'
                          ? 'bg-yes-soft text-yes'
                          : 'bg-no-soft text-no'
                      }`}
                    >
                      {t.side}
                    </span>
                    <span className="font-mono text-bone-muted">
                      {t.shares} shares @ ¢{t.price}
                    </span>
                  </div>
                  <span className="font-mono text-bone-muted">{t.ago}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail — sticky */}
        <div className="md:col-span-4">
          <div className="sticky top-24 space-y-6">
            {m.kind === 'multi' ? (
              <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-xl text-bone">Outcomes</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
                    {m.outcomes?.length}-way · click to add to parlay
                  </span>
                </div>
                <OutcomeBar market={m} />
                <p className="mt-4 text-[11px] leading-relaxed text-bone-muted">
                  Multi-outcome markets settle on the single winning outcome.
                  Field covers any result not explicitly listed.
                </p>
              </div>
            ) : (
              <OrderBook yesProb={m.yesProb} />
            )}
            <AIOracleCard market={m} />
          </div>
        </div>
      </div>

      {/* Related */}
      <section className="mt-16">
        <h3 className="mb-4 font-display text-3xl text-bone">
          More {m.category}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((r) => (
            <MarketCard key={r.id} market={r} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-800 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
        {label}
      </div>
      <div className={`mt-1 font-mono text-2xl font-bold tabular-nums ${accent || 'text-bone'}`}>
        {value}
      </div>
    </div>
  );
}

function TimelineItem({
  dot,
  label,
  value,
}: {
  dot: string;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
          {label}
        </div>
        <div className="text-bone">{value}</div>
      </div>
    </li>
  );
}

function mockTrades(p: number) {
  const avatars = ['🧠', '🎌', '🐋', '🎮', '💜', '🟧', '📺', '🗼', '⚾'];
  const handles = [
    'oracle.seoul',
    'bias.jp',
    'whale.apac',
    'faker.fanboy',
    'idol.scout',
    'btc.maxi.hk',
    'drama.nerd',
    'tokyo.takes',
    'kbo.quant',
  ];
  return Array.from({ length: 8 }).map((_, i) => {
    const side = Math.random() > 0.45 ? 'YES' : 'NO';
    const price = Math.round((side === 'YES' ? p : 1 - p) * 100 + (Math.random() - 0.5) * 6);
    return {
      avatar: avatars[i % avatars.length],
      handle: handles[i % handles.length],
      side: side as 'YES' | 'NO',
      shares: Math.round(50 + Math.random() * 900),
      price,
      ago: `${Math.ceil(Math.random() * 58) + 1}s ago`,
    };
  });
}
