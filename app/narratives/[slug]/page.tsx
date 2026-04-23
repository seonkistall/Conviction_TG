import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoVideo } from '@/components/AutoVideo';
import { LiveMarketGrid } from '@/components/LiveMarketGrid';
import { JsonLd } from '@/components/JsonLd';
import { PriceChart } from '@/components/PriceChart';
import {
  AI_TRADERS,
  NARRATIVE_INDICES,
  TRADERS,
  getMarket,
} from '@/lib/markets';
import { formatUSD } from '@/lib/format';
import type { AITrader, Trader } from '@/lib/types';

const SITE_URL = 'https://conviction-fe.vercel.app';

/**
 * /narratives/[slug] — narrative-index detail.
 *
 * Renders for any slug in NARRATIVE_INDICES. The narrative is essentially
 * a curated basket of markets, so we surface:
 *   1. Hero — the narrative video, headline, basket price/24h change
 *   2. Component markets — each weighted leg as a MarketCard
 *   3. Related traders — AI + human traders whose strategy maps to this thesis
 */

export async function generateStaticParams() {
  return NARRATIVE_INDICES.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const nx = NARRATIVE_INDICES.find((n) => n.slug === params.slug);
  if (!nx) return { title: 'Narrative not found · Conviction' };
  return {
    title: `${nx.title} · Conviction Index`,
    description: nx.blurb,
    // NOTE: openGraph.images / twitter.images are intentionally omitted —
    // ./opengraph-image.tsx + ./twitter-image.tsx render a branded 1200×630
    // PNG per narrative slug, and the file-based convention only wins when
    // images are not explicitly set in generateMetadata.
    openGraph: {
      title: nx.title,
      description: nx.blurb,
    },
    twitter: {
      card: 'summary_large_image',
      title: nx.title,
      description: nx.blurb,
    },
  };
}

/**
 * Curated AI trader handles per narrative — heuristically the best AI quants
 * whose strategy/region overlaps with the narrative thesis.
 */
const NARRATIVE_TO_AI_HANDLES: Record<string, string[]> = {
  'kpop-big4-2026': ['ai.oracle.kr', 'qwen.drama', 'ai.vibe.jp'],
  'lck-dominance-2026': ['allora.lck', 'ai.oracle.kr', 'lpl.scout'],
  'lpl-rising-2026': ['lpl.scout', 'allora.lck', 'sonnet.macro'],
  'japan-heat-2026': ['anime.signal.jp', 'npb.analytics', 'ai.vibe.jp'],
  'china-macro-2026': ['sonnet.macro', 'lpl.scout', 'ai.vibe.jp'],
  'hallyu-goes-global-2027': ['ai.oracle.kr', 'qwen.drama', 'ai.vibe.jp'],
};

const NARRATIVE_TO_HUMAN_HANDLES: Record<string, string[]> = {
  'kpop-big4-2026': ['idol.scout', 'oracle.seoul', 'whale.apac'],
  'lck-dominance-2026': ['faker.fanboy', 'oracle.seoul', 'whale.apac'],
  'lpl-rising-2026': ['shanghai.dragon', 'faker.fanboy', 'whale.apac'],
  'japan-heat-2026': ['osaka.tiger', 'mappa.maxi', 'tokyo.takes'],
  'china-macro-2026': ['shanghai.dragon', 'whale.apac', 'btc.maxi.hk'],
  'hallyu-goes-global-2027': ['oracle.seoul', 'idol.scout', 'drama.nerd'],
};

function getAis(slug: string): AITrader[] {
  const handles = NARRATIVE_TO_AI_HANDLES[slug] ?? [];
  return handles
    .map((h) => AI_TRADERS.find((t) => t.handle === h))
    .filter((t): t is AITrader => Boolean(t));
}

function getHumans(slug: string): Trader[] {
  const handles = NARRATIVE_TO_HUMAN_HANDLES[slug] ?? [];
  return handles
    .map((h) => TRADERS.find((t) => t.handle === h))
    .filter((t): t is Trader => Boolean(t));
}

export default function NarrativePage({
  params,
}: {
  params: { slug: string };
}) {
  const nx = NARRATIVE_INDICES.find((n) => n.slug === params.slug);
  if (!nx) notFound();

  const legs = nx.legs
    .map((l) => ({ market: getMarket(l.marketId), weight: l.weight }))
    .filter((x): x is { market: NonNullable<ReturnType<typeof getMarket>>; weight: number } =>
      Boolean(x.market)
    );

  const aiTraders = getAis(nx.slug);
  const humanTraders = getHumans(nx.slug);

  const totalWeight = legs.reduce((s, l) => s + l.weight, 0);
  const totalVolume = legs.reduce((s, l) => s + l.market.volume, 0);
  const totalLiquidity = legs.reduce((s, l) => s + l.market.liquidity, 0);

  // Deterministic seed for the sparkline so SSR and CSR match.
  const chartSeed = nx.slug
    .split('')
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

  // Structured data: describe the narrative as a Schema.org FinancialProduct
  // basket. This gives search engines machine-readable context for price,
  // volume, and constituent markets.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: nx.title,
    description: nx.blurb,
    url: `${SITE_URL}/narratives/${nx.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'Conviction',
      url: SITE_URL,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: (nx.price).toFixed(4),
      availability: 'https://schema.org/InStock',
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: '24h change',
        value: `${nx.change24h.toFixed(2)}%`,
      },
      {
        '@type': 'PropertyValue',
        name: 'Basket volume',
        value: formatUSD(totalVolume),
      },
      {
        '@type': 'PropertyValue',
        name: 'Liquidity',
        value: formatUSD(totalLiquidity),
      },
    ],
    hasPart: legs.map(({ market, weight }) => ({
      '@type': 'FinancialProduct',
      name: market.title,
      url: `${SITE_URL}/markets/${market.slug}`,
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'weight',
        value: `${Math.round(weight * 100)}%`,
      },
    })),
  };

  return (
    <div className="bg-ink-900">
      <JsonLd data={jsonLd} />
      {/* ----- Hero ----- */}
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
        {nx.media && (
          <AutoVideo
            media={nx.media}
            className="absolute inset-0 h-full w-full"
            fit="cover"
            title={nx.title}
            priority
          />
        )}
        <div className="absolute inset-0 narrative-grad" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-6 pb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-volt w-fit">
            Narrative Index · Live
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-5xl text-bone md:text-7xl">
            <span className="mr-3 align-middle text-4xl md:text-6xl">
              {nx.emoji}
            </span>
            {nx.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-bone-muted md:text-lg">
            {nx.blurb}
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-bone-muted">
                Index price
              </div>
              <div className="mt-1 font-mono text-5xl font-bold tabular-nums text-bone">
                ¢{Math.round(nx.price * 100)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-bone-muted">
                24h
              </div>
              <div
                className={`mt-1 font-mono text-2xl tabular-nums ${
                  nx.change24h >= 0 ? 'text-yes' : 'text-no'
                }`}
              >
                {nx.change24h >= 0 ? '+' : ''}
                {nx.change24h.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-bone-muted">
                Basket volume
              </div>
              <div className="mt-1 font-mono text-2xl tabular-nums text-bone">
                {formatUSD(totalVolume)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-bone-muted">
                Liquidity
              </div>
              <div className="mt-1 font-mono text-2xl tabular-nums text-bone">
                {formatUSD(totalLiquidity)}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="rounded-full bg-volt px-6 py-3 text-sm font-semibold text-ink-900 hover:bg-volt-dark"
              >
                Trade Index
              </button>
              <Link
                href="/markets/new"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-bone hover:border-white/30"
              >
                Spawn variant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----- Basket price sparkline ----- */}
      <section className="mx-auto max-w-[1440px] px-6 pt-12">
        <div className="rounded-3xl border border-white/10 bg-ink-800 p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-bone-muted">
                Basket price · 30d
              </div>
              <div className="mt-1 font-display text-2xl text-bone">
                Conviction trajectory
              </div>
            </div>
            <div className="text-[11px] text-bone-muted">
              Mock · oracle feed · updated every 5m
            </div>
          </div>
          <div className="h-56 w-full">
            <PriceChart seed={chartSeed} days={30} />
          </div>
        </div>
      </section>

      {/* ----- Component markets ----- */}
      <section
        aria-labelledby="narrative-legs-heading"
        className="mx-auto max-w-[1440px] px-6 py-16"
      >
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-bone-muted">
              Basket constituents
            </div>
            <h2
              id="narrative-legs-heading"
              className="mt-1 font-display text-3xl text-bone md:text-4xl"
            >
              {legs.length} weighted markets
            </h2>
          </div>
          <div className="text-xs text-bone-muted">
            Total weight ·{' '}
            <span className="font-mono text-bone">
              {Math.round(totalWeight * 100)}%
            </span>
          </div>
        </div>

        <LiveMarketGrid
          markets={legs.map((l) => l.market)}
          size="md"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          decorators={Object.fromEntries(
            legs.map((l) => [
              l.market.id,
              <div
                key={l.market.id}
                className="absolute -top-3 left-3 z-10 rounded-full border border-volt/40 bg-ink-900/95 px-2 py-0.5 font-mono text-[11px] tabular-nums text-volt"
              >
                {Math.round(l.weight * 100)}% leg
              </div>,
            ])
          )}
        />
      </section>

      {/* ----- Related traders ----- */}
      {(aiTraders.length > 0 || humanTraders.length > 0) && (
        <section
          aria-labelledby="narrative-traders-heading"
          className="mx-auto max-w-[1440px] px-6 pb-24"
        >
          <div className="text-xs font-medium uppercase tracking-wider text-bone-muted">
            Conviction on this thesis
          </div>
          <h2
            id="narrative-traders-heading"
            className="mt-1 font-display text-3xl text-bone md:text-4xl"
          >
            Traders riding {nx.title}
          </h2>

          {aiTraders.length > 0 && (
            <>
              <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-volt">
                Agentic quants
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {aiTraders.map((t) => (
                  <Link
                    key={t.id}
                    href={`/traders/${t.handle}`}
                    className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-ink-800 p-5 hover:border-white/20"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-700 text-2xl">
                      {t.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-sm font-semibold text-bone group-hover:text-volt">
                          @{t.handle}
                        </span>
                        {t.live && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yes/10 px-1.5 py-0.5 text-[10px] text-yes">
                            <span className="live-dot" />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-bone-muted">
                        {t.model}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-bone-muted">
                        {t.strategy}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-[11px]">
                        <span className="font-mono tabular-nums text-yes">
                          +{formatUSD(t.pnl30d)}
                        </span>
                        <span className="text-bone-muted">
                          AUM{' '}
                          <span className="font-mono tabular-nums text-bone">
                            {formatUSD(t.aum)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {humanTraders.length > 0 && (
            <>
              <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-bone-muted">
                Human conviction
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {humanTraders.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ink-800 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-700 text-xl">
                      {t.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-sm text-bone">
                        @{t.handle}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-bone-muted">
                        <span className="font-mono tabular-nums text-yes">
                          +{formatUSD(t.pnl30d)}
                        </span>
                        <span>{Math.round(t.winRate * 100)}% win</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
