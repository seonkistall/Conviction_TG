import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { notFound } from 'next/navigation';
import { getMarket } from '@/lib/markets';
import { decodeSharedParlay, computePayout } from '@/lib/parlayShare';
import { formatUSD } from '@/lib/format';
import { ShareStrip } from '@/components/ShareStrip';
import { JsonLd } from '@/components/JsonLd';

const SITE_URL = 'https://conviction-fe.vercel.app';

/**
 * /parlays/[id] — shareable Parlay Receipt.
 *
 * The canonical URL is /parlays/<id>?d=<base64url payload>. The server
 * decodes the payload, re-hydrates each leg against the static MARKETS
 * table, and renders a public read-only receipt.
 *
 * If `?d=` is missing or malformed we treat the ticket as "not found"
 * because there is no backend to look it up from. This keeps the route
 * pure-static-friendly while letting the receipt travel across origins.
 */

interface PageProps {
  params: { id: string };
  searchParams: { d?: string };
}

function shared(searchParams: PageProps['searchParams']) {
  if (!searchParams.d) return null;
  return decodeSharedParlay(searchParams.d);
}

export function generateMetadata({
  params,
  searchParams,
}: PageProps): Metadata {
  const p = shared(searchParams);
  if (!p) {
    return {
      title: 'Parlay · Conviction',
      robots: { index: false, follow: false },
    };
  }
  const { multiplier, maxPayout } = computePayout(p);
  const titles = p.legs
    .map((l) => {
      const m = getMarket(l.marketId);
      return m?.title ?? l.marketId;
    })
    .slice(0, 3)
    .join(' · ');
  const title = `${p.legs.length}-leg parlay · ${multiplier.toFixed(2)}× · ${formatUSD(
    maxPayout
  )}`;
  const description = `${titles}${p.legs.length > 3 ? ' · …' : ''}`;
  const url = `${SITE_URL}/parlays/${params.id}?d=${searchParams.d}`;
  return {
    title: `${title} · Conviction`,
    description,
    // opengraph-image.tsx in this folder handles image generation
    openGraph: {
      title,
      description,
      url,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function ParlayReceiptPage({ params, searchParams }: PageProps) {
  const p = shared(searchParams);
  if (!p) return notFound();

  const { multiplier, impliedProb, maxPayout } = computePayout(p);
  const placed = new Date(p.placedAt);
  const shareUrl = `${SITE_URL}/parlays/${params.id}?d=${searchParams.d}`;
  const twitterIntent = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(
    `I just built a ${p.legs.length}-leg ${multiplier.toFixed(
      2
    )}× parlay on Conviction →`
  )}`;

  // Expose the ticket as a basic CreativeWork for crawlers. Prediction-market
  // tickets don't have a native Schema.org type so we stay conservative.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: `Conviction Parlay · ${p.legs.length} legs · ${multiplier.toFixed(
      2
    )}×`,
    url: shareUrl,
    datePublished: placed.toISOString(),
    creator: {
      '@type': 'Organization',
      name: 'Conviction',
      url: SITE_URL,
    },
  };

  return (
    <main className="min-h-dvh bg-ink-900 pb-16">
      <JsonLd data={jsonLd} />

      {/* Header strip */}
      <div className="border-b border-white/5 bg-ink-900/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-volt"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-volt" />
            Conviction
          </Link>
          <Link
            href="/portfolio"
            className="text-xs font-semibold text-bone-muted hover:text-bone"
          >
            My tickets →
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 pt-10 md:px-6 md:pt-14">
        {/* Hero summary */}
        <section className="rounded-3xl border border-volt/20 bg-gradient-to-br from-ink-800 via-ink-800 to-ink-900 p-6 md:p-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-volt">
                ✓ Parlay placed · receipt
              </div>
              <h1 className="mt-2 font-display text-4xl leading-tight text-bone md:text-5xl">
                {p.legs.length}-leg parlay at{' '}
                <span className="text-volt">{multiplier.toFixed(2)}×</span>
              </h1>
              <div className="mt-2 font-mono text-[11px] text-bone-muted">
                Ticket {params.id} · placed {placed.toLocaleDateString()}{' '}
                {placed.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-volt/20 bg-volt/5 px-5 py-4 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-bone-muted">
                Max payout
              </div>
              <div className="mt-1 font-mono text-4xl font-bold tabular-nums text-volt">
                {formatUSD(maxPayout)}
              </div>
              <div className="mt-0.5 text-[11px] text-bone-muted">
                on {formatUSD(p.stake)} stake
              </div>
            </div>
          </div>

          {/* Stat row */}
          <dl className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-ink-900/60 p-4 text-center md:gap-4">
            <Stat
              label="Combined multiplier"
              value={`${multiplier.toFixed(2)}×`}
              accent="text-volt"
            />
            <Stat
              label="Implied probability"
              value={`${(impliedProb * 100).toFixed(2)}%`}
            />
            <Stat label="Stake" value={formatUSD(p.stake)} />
          </dl>

          {/* Share strip */}
          <ShareStrip shareUrl={shareUrl} twitterIntent={twitterIntent} />
        </section>

        {/* Legs */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-bone">
            {p.legs.length} legs
          </h2>
          <ul className="mt-4 space-y-3">
            {p.legs.map((leg, i) => {
              const m = getMarket(leg.marketId);
              const label =
                m?.kind === 'multi'
                  ? m.outcomes?.find((o) => o.id === leg.pick)?.label ?? leg.pick
                  : leg.pick;
              const decimalOdds = leg.price > 0 ? 1 / leg.price : 0;
              return (
                <li
                  key={`${leg.marketId}-${i}`}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-ink-800 p-4 md:p-5"
                >
                  {m && (
                    <img
                      src={m.media.poster}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover md:h-20 md:w-20"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={clsx(
                          'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                          leg.pick === 'YES'
                            ? 'bg-yes-soft text-yes'
                            : leg.pick === 'NO'
                            ? 'bg-no-soft text-no'
                            : 'bg-conviction/20 text-conviction'
                        )}
                      >
                        {label}
                      </span>
                      {m && (
                        <span className="text-[10px] uppercase tracking-widest text-bone-muted">
                          {m.category} · {m.region}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-bone md:text-base">
                      {m ? (
                        <Link
                          href={`/markets/${m.slug}`}
                          className="transition hover:text-volt"
                        >
                          {m.title}
                        </Link>
                      ) : (
                        leg.marketId
                      )}
                    </div>
                    {m?.endsAt && (
                      <div className="mt-1 text-[11px] text-bone-muted">
                        Resolves {new Date(m.endsAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xl font-bold tabular-nums text-bone">
                      ¢{Math.round(leg.price * 100)}
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-bone-muted">
                      {decimalOdds.toFixed(2)}×
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Footer context */}
        <section className="mt-10 rounded-2xl border border-white/5 bg-ink-800/40 p-5 text-xs text-bone-muted">
          <p>
            Parlay legs resolve independently. All legs must resolve in the
            trader&apos;s favor for the ticket to pay out the combined
            multiplier. Prices shown are the entry prices at placement.
          </p>
          <p className="mt-2">
            This receipt is encoded in the URL — no login required to view.
          </p>
        </section>
      </div>
    </main>
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
    <div className="flex flex-col items-center">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.25em] text-bone-muted">
        {label}
      </dt>
      <dd
        className={clsx(
          'mt-1 font-mono text-lg font-bold tabular-nums md:text-xl',
          accent ?? 'text-bone'
        )}
      >
        {value}
      </dd>
    </div>
  );
}
