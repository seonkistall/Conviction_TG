import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMarket } from '@/lib/markets';
import {
  decodeSharePayload,
  pnlFromPayload,
  tokenFingerprint,
} from '@/lib/shareToken';

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
  // v2.28 hotfix: format as `-$232` (sign before $) instead of `$-232`
  // (sign after $). Same format as the visual OG card so the page
  // <title>, og:title, and OG image agree across every share surface.
  const sign = pnlUsd >= 0 ? '+' : '-';
  const absUsd = Math.abs(pnlUsd).toFixed(0);
  const handle = payload.h ? `@${payload.h}` : '@trader';
  return {
    title: `${handle} ${sign}$${absUsd} on ${m?.title ?? 'a market'} · Conviction`,
    description: `${handle} is ${sign}$${absUsd} on ${payload.s} ${payload.sh} shares. Trade the same APAC narrative on Conviction.`,
    openGraph: {
      title: `${handle} ${sign}$${absUsd} · ${m?.title ?? 'Conviction'}`,
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
  // v2.28 hotfix: losses get an explicit '-' prefix. Critical for the
  // OG card thumbnail in social feeds (red color alone isn't enough)
  // and matches what screen readers verbalize.
  const sign = isWin ? '+' : '-';
  const handle = payload.h ? `@${payload.h}` : '@trader';
  // v2.29-3: tip vs position branch. See OG image renderer for the
  // matching logic — both surfaces must agree so the page hero and
  // the OG preview tell the same story.
  const isTip = payload.k === 'tip' || payload.sh === 0;
  const stanceCents = Math.round(payload.cp * 100);

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
        {/*
         * Header band.
         *
         * v2.29-2: shows the receipt fingerprint next to the brand.
         * The hover/click hint below explains what it is in plain
         * English so the badge isn't mystery jargon — important for
         * trust in a pre-launch product where users don't yet have
         * received-wisdom about Conviction's verification model.
         */}
        <div className="flex items-center justify-between bg-ink-900/80 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-volt text-base font-bold tracking-widest">
              CONVICTION
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              title="Receipt fingerprint — a hash of this share's contents. Changes if anything is altered."
              className="rounded-md bg-volt/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-volt"
            >
              VERIFIED · {tokenFingerprint(params.token)}
            </span>
          </div>
        </div>

        {/*
         * Hero — branches on tip vs position.
         *
         * v2.29-3: tips have no P&L, so we lead with the stance:
         *   "ENDORSES YES @ ¢62"
         * The volt color on YES, white on NO mirrors the YES/NO
         * semantic mapping used throughout the app.
         */}
        {isTip ? (
          <div className="px-6 py-7 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
              {handle} · ENDORSES
            </div>
            <div className="mt-3 flex items-baseline justify-center gap-3">
              <span
                className={`font-display text-6xl font-extrabold tracking-tight ${
                  payload.s === 'YES' ? 'text-yes' : 'text-bone'
                }`}
              >
                {payload.s}
              </span>
              <span className="font-mono text-3xl tabular-nums text-bone-muted">
                @ ¢{stanceCents}
              </span>
            </div>
          </div>
        ) : (
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
              {Math.abs(pnlPct).toFixed(1)}%
            </div>
          </div>
        )}

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

        {/* Avg / now strip — hidden in tip mode (no entry to show). */}
        {!isTip && <div className="grid grid-cols-2 border-t border-white/5 bg-ink-900/40 px-5 py-3 text-center">
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
        </div>}

        {/*
         * CTA — the conversion.
         *
         * v2.28-3: Deep-link to /feed?m=<slug>&s=<side> so the lander
         * drops directly into the immersive feed with the order sheet
         * already open and pre-picked to the same side the sharer was
         * on. Shortest path from "I clicked a friend's link" to "I
         * place a YES at ¢62". Detail page link kept as a sub-CTA for
         * users who want to read first.
         */}
        <Link
          href={`/feed?m=${m.slug}&s=${
            payload.s === 'YES' || payload.s === 'NO' ? payload.s : 'YES'
          }`}
          className="block bg-volt px-5 py-4 text-center text-sm font-bold text-ink-900 transition hover:bg-volt-dark"
        >
          Trade {payload.s === 'NO' ? 'NO' : 'YES'} on this market →
        </Link>
        <Link
          href={`/markets/${m.slug}`}
          className="block border-t border-white/10 bg-ink-900 px-5 py-3 text-center text-xs text-bone-muted transition hover:text-bone"
        >
          Read full market detail
        </Link>
      </div>

      {/*
       * v2.29-4 — IG / Threads / 1:1 image link.
       *
       * IG and Threads don't scrape OG cards — the user posts an
       * image directly. This row offers the 1:1 (1080×1080) variant
       * served by the og-square route handler. Opens in a new tab so
       * the user can right-click → Save Image (desktop) or long-press
       * → Download (mobile). Marked rel=external for SEO sanity.
       */}
      <div className="mt-4 flex w-full max-w-xs items-center justify-center gap-3 text-[11px] uppercase tracking-widest text-bone-muted">
        <a
          href={`/share/p/${params.token}/og-square`}
          target="_blank"
          rel="noopener noreferrer external"
          className="rounded-full border border-white/10 bg-ink-800 px-3 py-1.5 hover:bg-ink-700 hover:text-bone"
        >
          ↓ Save IG / Threads image
        </a>
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
