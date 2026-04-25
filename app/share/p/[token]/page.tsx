import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMarket } from '@/lib/markets';
import { decodeSharePayload, pnlFromPayload } from '@/lib/shareToken';

/**
 * v2.28-2 — Public landing for a shared "conviction receipt".
 *
 * Why a dedicated page instead of just an OG card?
 * ------------------------------------------------
 * The OG card is what shows up *inside* X / Slack / KakaoTalk's
 * preview. But the moment a follower taps the link, they need a
 * mobile-friendly destination that converts the curiosity ("how
 * is @oracle.seoul up $4,200 on this?") into either:
 *   1) signing into Conviction and trading the same market, or
 *   2) silently bookmarking the link as proof.
 *
 * This page is intentionally short: the card itself is the headline,
 * the CTA below routes to /markets/[slug] with the share token still
 * in the path so the funnel is attributable later.
 *
 * Token is decoded server-side. If the catalog ever rotates the
 * referenced market out, we render a graceful "expired" card rather
 * than a 404 — the link's already in the wild and a hard error
 * would burn trust the share loop just earned.
 */

export const dynamic = 'force-dynamic'; // tokens are unique per share
export const revalidate = 0;

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props) {
  const payload = decodeSharePayload(params.token);
  if (!payload) {
    return {
      title: 'Conviction · Shared position',
      description: 'A shared conviction receipt on Conviction.',
    };
  }
  const m = getMarket(payload.m);
  const { pnlUsd } = pnlFromPayload(payload);
  const sign = pnlUsd >= 0 ? '+' : '';
  const handle = payload.h ? `@${payload.h}` : '@trader';
  return {
    title: `${handle} ${sign}$${pnlUsd.toFixed(0)} on ${m?.title ?? 'a market'} · Conviction`,
    description: `${handle} is ${sign}$${pnlUsd.toFixed(0)} on ${payload.s} ${payload.sh} shares. Trade the same APAC narrative on Conviction.`,
    openGraph: {
      title: `${handle} ${sign}$${pnlUsd.toFixed(0)} · ${m?.title ?? 'Conviction'}`,
      type: 'website',
    },
  };
}

export default function ShareReceiptPage({ params }: Props) {
  const payload = decodeSharePayload(params.token);
  if (!payload) {
    // Malformed token — the link was tampered with. Show a soft 404.
    return notFound();
  }
  const m = getMarket(payload.m);
  const { pnlUsd, pnlPct } = pnlFromPayload(payload);
  const isWin = pnlUsd >= 0;
  const sign = isWin ? '+' : '';
  const handle = payload.h ? `@${payload.h}` : '@trader';

  // Graceful expired state — market rotated out of the catalog.
  if (!m) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <div className="rounded-2xl border border-white/10 bg-ink-800 p-8">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            Conviction · Shared position
          </div>
          <h1 className="mt-3 font-display text-3xl text-bone">
            This receipt has expired
          </h1>
          <p className="mt-2 text-sm text-bone-muted">
            The market this position referred to is no longer in the
            catalog. The trader&apos;s P&amp;L on the snapshot was{' '}
            <span className={isWin ? 'text-yes' : 'text-no'}>
              {sign}${Math.abs(pnlUsd).toFixed(2)}
            </span>
            .
          </p>
          <Link
            href="/feed"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-volt px-5 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-volt-dark"
          >
            Browse live markets →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-5 py-8">
      <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-ink-800 to-ink-900 shadow-2xl">
        {/* Header band */}
        <div className="flex items-center justify-between bg-ink-900/80 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-volt text-base font-bold tracking-widest">
              CONVICTION
            </span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
            Shared receipt
          </span>
        </div>

        {/* P&L hero — the brag */}
        <div className="px-6 py-7 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
            {handle} · {payload.s} · {payload.sh.toLocaleString()} shares
          </div>
          <div
            className={`mt-3 font-mono text-6xl font-extrabold tracking-tight tabular-nums ${
              isWin ? 'text-yes' : 'text-no'
            }`}
          >
            {sign}${Math.abs(pnlUsd).toFixed(2)}
          </div>
          <div
            className={`mt-1 font-mono text-base tabular-nums ${
              isWin ? 'text-yes' : 'text-no'
            }`}
          >
            {sign}
            {pnlPct.toFixed(1)}%
          </div>
        </div>

        {/* Market reference */}
        <Link
          href={`/markets/${m.slug}`}
          className="block border-t border-white/10 bg-ink-900/40 px-5 py-4 transition hover:bg-ink-900/70"
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.media.poster}
              alt=""
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
                {m.category} · {m.region}
              </div>
              <div className="line-clamp-2 text-sm font-medium text-bone">
                {m.title}
              </div>
            </div>
            <div className="font-mono text-sm tabular-nums text-bone-muted">
              ¢{Math.round(m.yesProb * 100)}
            </div>
          </div>
        </Link>

        {/* Avg / now strip */}
        <div className="grid grid-cols-2 border-t border-white/5 bg-ink-900/40 px-5 py-3 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-bone-muted">
              Avg entry
            </div>
            <div className="mt-0.5 font-mono text-sm tabular-nums text-bone">
              ¢{Math.round(payload.ap * 100)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-bone-muted">
              Mark
            </div>
            <div className="mt-0.5 font-mono text-sm tabular-nums text-bone">
              ¢{Math.round(payload.cp * 100)}
            </div>
          </div>
        </div>

        {/* CTA — the conversion. */}
        <Link
          href={`/markets/${m.slug}`}
          className="block bg-volt px-5 py-4 text-center text-sm font-bold text-ink-900 transition hover:bg-volt-dark"
        >
          Trade the same market →
        </Link>
      </div>

      <p className="mt-5 max-w-xs text-center text-[11px] leading-relaxed text-bone-muted">
        Conviction is the prediction market for APAC narratives.{' '}
        <Link href="/feed" className="text-bone underline">
          Browse the feed
        </Link>{' '}
        to find your own conviction.
      </p>
    </main>
  );
}
