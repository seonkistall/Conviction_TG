import type { Metadata } from 'next';
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
import { LiveMarketGrid } from '@/components/LiveMarketGrid';
import { JsonLd } from '@/components/JsonLd';
import { ResolvedBanner } from '@/components/ResolvedBanner';

const SITE_URL = 'https://conviction-fe.vercel.app';

export function generateStaticParams() {
  return MARKETS.map((m) => ({ id: m.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const m = getMarket(params.id);
  if (!m) return { title: 'Market not found · Conviction' };
  return {
    title: `${m.title} · Conviction`,
    description: m.description,
    // NOTE: we intentionally omit openGraph.images / twitter.images here so
    // Next's file-based convention (./opengraph-image.tsx + ./twitter-image.tsx)
    // wins — that route renders a branded 1200×630 PNG per slug.
    openGraph: {
      title: m.title,
      description: m.description,
      url: `${SITE_URL}/markets/${m.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
    },
    alternates: {
      canonical: `${SITE_URL}/markets/${m.slug}`,
    },
  };
}

export default function MarketDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { evidence?: string; side?: string };
}) {
  const m = getMarket(params.id);
  if (!m) return notFound();

  // v2.17 — When a user clicks the AI-confidence dial on a MarketCard
  // elsewhere in the app, we navigate here with `?evidence=open` so the
  // AIOracleCard boots with its side sheet already expanded. Avoids the
  // "click the dial, get dropped on the detail page, then hunt for the
  // Inspect button" hole we had before. `side=yes|no` is forwarded from
  // the Hero CTAs; individual trade components can pick it up from the
  // URL if they want to pre-select a side.
  const autoOpenEvidence = searchParams?.evidence === 'open';

  const related = MARKETS.filter(
    (x) => x.id !== m.id && x.category === m.category
  ).slice(0, 4);

  const seed = m.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  // JSON-LD: two-graph payload.
  //   1. Event: expose the market as a scheduled question with a YES-side
  //      Offer. Schema.org/Event is the closest native match for "question
  //      that resolves at time T"; additionalType hints at FinancialProduct.
  //   2. FAQPage: surface the resolution criteria as a Q&A entry so Google's
  //      rich results carousel can show "How does this resolve?" directly
  //      under our search result. Big SEO/trust win for a prediction market.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Event',
      additionalType: 'https://schema.org/FinancialProduct',
      name: m.title,
      description: m.description,
      url: `${SITE_URL}/markets/${m.slug}`,
      image: m.media.poster,
      startDate: new Date().toISOString(),
      endDate: m.endsAt,
      eventStatus:
        m.status === 'resolved'
          ? 'https://schema.org/EventCompleted'
          : 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: {
        '@type': 'VirtualLocation',
        url: SITE_URL,
      },
      organizer: {
        '@type': 'Organization',
        name: 'Conviction',
        url: SITE_URL,
      },
      offers: {
        '@type': 'Offer',
        name: `YES · ${m.title}`,
        priceCurrency: 'USD',
        price: m.yesProb.toFixed(4),
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/markets/${m.slug}`,
      },
      keywords: m.tags.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `How does "${m.title}" resolve?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${m.description} Trading closes at ${new Date(m.endsAt).toISOString()} and the market settles at ${new Date(m.resolvesAt).toISOString()} via Conviction's AI Oracle.`,
          },
        },
        {
          '@type': 'Question',
          name: 'What does the YES price mean?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `The YES side is currently trading at ${pct(m.yesProb)}, which the market is pricing as the probability the event resolves YES. 1 YES share pays $1 if the event occurs.`,
          },
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8">
      <JsonLd data={jsonLd} />
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

      <ResolvedBanner market={m} />

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
                priority
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
              <OrderBook
                yesProb={m.yesProb}
                marketId={m.id}
                marketTitle={m.title}
                marketSlug={m.slug}
                resolved={m.status === 'resolved'}
              />
            )}
            <AIOracleCard market={m} autoOpen={autoOpenEvidence} />
          </div>
        </div>
      </div>

      {/* v2.18-2 — Related markets.
       *
       * Added `id="related"` scroll anchor so the PostTradeCard's
       * "Find similar ↓" CTA can deep-link to this section without
       * requiring a router navigation — smooth scroll keeps the
       * just-placed position visible above the fold for a moment.
       *
       * Pulled the section head up with a stronger label ("More like
       * this · {category}") and a subtitle explaining what the grid
       * is, so returning users who scrolled down before buying still
       * understand this isn't another copy of the current market. */}
      <section id="related" className="mt-16 scroll-mt-24">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="font-display text-3xl text-bone">
              More like this · {m.category}
            </h3>
            <p className="mt-1 text-sm text-bone-muted">
              Same region + category. All tradable right now.
            </p>
          </div>
          <Link
            href="/"
            className="hidden rounded-full border border-white/10 bg-ink-800 px-3 py-1.5 text-[11px] font-semibold text-bone-muted hover:text-bone md:inline-flex"
          >
            All markets →
          </Link>
        </div>
        <LiveMarketGrid
          markets={related}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        />
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
