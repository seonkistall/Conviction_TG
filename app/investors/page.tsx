import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_BETA_EMAIL } from '@/lib/constants';

/**
 * v2.25 — /investors landing page.
 *
 * Prior to v2.25 there was no dedicated surface for Tier-1 VCs who
 * click through the Twitter bio. This page exists to:
 *
 *   1. Recite the one-liner pitch (APAC-native, AI-powered,
 *      permissionless prediction market) in a form optimized for
 *      partner evaluation rather than end-user traffic.
 *   2. Surface the key traction stats (markets live, beta waitlist,
 *      Oracle accuracy) without the Hero noise around them.
 *   3. Route to the beta inbox for an intro / deck request.
 *
 * Intentionally minimal: investors skim. Anything more than a single
 * scroll past the fold is friction. The product demo is the landing
 * page itself — this page is the napkin in between.
 */
export const metadata: Metadata = {
  title: 'Conviction · Investors',
  description:
    'APAC-native, AI-powered permissionless prediction market. Seeking Tier-1 seed partners.',
  robots: { index: true, follow: true },
};

const TRACTION = [
  { k: 'Live markets', v: '37', note: 'spanning KR/JP/CN/IN/SEA + macro' },
  { k: 'AI Oracle accuracy', v: '99.8%', note: 'across 500+ resolved markets' },
  { k: 'Evidence sources', v: '23', note: 'Naver, Weverse, Weibo, Pixiv, more' },
  { k: 'Beta waitlist', v: 'open', note: 'mailto:beta@conviction.trade' },
];

const DIFF = [
  {
    h: 'APAC-native, not APAC-adapted',
    b: 'Every scraper in the Oracle pool (Naver, Weverse, Weibo, Pixiv, Instiz, YouTube Data) is tuned for a specific APAC source. Polymarket and Kalshi index US politics + ESPN. We index K-pop comebacks, LCK vs LPL, NPB, Bollywood openings, anime ratings — the narratives APAC cares about, at the fidelity they care about.',
  },
  {
    h: 'Permissionless market creation',
    b: 'Any user can propose a market in 45 seconds through the AI wizard at /markets/new. A 13-scraper panel grades the proposal for resolvability, evidence availability, and ambiguity before it ships. This is the moat — users surface narratives faster than any centralized curation team can, and the AI cost per proposal is below $0.10.',
  },
  {
    h: 'AI-first oracle',
    b: 'Markets settle against a 23-source evidence swarm with a human-oracle safety net. One disputed resolution in 500+ closed markets. The system itself is productized at /methodology — transparent by design so users build trust with the Oracle rather than the team.',
  },
];

export default function InvestorsPage() {
  const deckMailto = `mailto:${BRAND_BETA_EMAIL}?subject=${encodeURIComponent(
    'Deck request · [fund name]'
  )}&body=${encodeURIComponent(
    [
      'Hi Conviction team,',
      '',
      'Interested in the deck + a 20-min intro call. A few details:',
      '  · Fund:',
      '  · Typical check size:',
      '  · Portfolio relevant to APAC prediction markets:',
      '',
      'Happy to schedule via Calendly or email.',
      '',
      'Best,',
    ].join('\n')
  )}`;

  return (
    <main className="mx-auto max-w-[960px] px-6 py-16">
      {/* Hero */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-volt">
          🌏 Tier-1 · Seed round · APAC focus
        </div>
        <h1 className="mt-4 font-display text-4xl leading-[1.05] text-bone md:text-6xl">
          The APAC-native prediction market.
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-bone-muted md:text-xl">
          K-pop comebacks, LCK vs LPL, NPB, Bollywood openings, anime ratings,
          APAC macro — every narrative that moves 4 billion people, priced
          live, resolved by a 23-source AI swarm.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={deckMailto}
            className="rounded-full bg-volt px-5 py-3 text-sm font-bold text-ink-900 transition hover:bg-volt-dark"
          >
            Request deck + intro →
          </a>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-ink-800 px-5 py-3 text-sm font-semibold text-bone transition hover:bg-ink-700"
          >
            See product live
          </Link>
          <Link
            href="/methodology"
            className="rounded-full border border-white/10 bg-ink-800 px-5 py-3 text-sm font-semibold text-bone transition hover:bg-ink-700"
          >
            How the Oracle works
          </Link>
        </div>
      </div>

      {/* Traction */}
      <section className="mt-16 border-t border-white/5 pt-10">
        <h2 className="font-display text-2xl text-bone">Traction · April 2026</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {TRACTION.map((t) => (
            <div
              key={t.k}
              className="rounded-2xl border border-white/10 bg-ink-800 p-4"
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
                {t.k}
              </div>
              <div className="mt-1 font-mono text-3xl font-bold text-bone">
                {t.v}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-bone-muted">
                {t.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiation */}
      <section className="mt-16 border-t border-white/5 pt-10">
        <h2 className="font-display text-2xl text-bone">
          Why APAC, why now, why us
        </h2>
        <div className="mt-5 space-y-5">
          {DIFF.map((d) => (
            <div
              key={d.h}
              className="rounded-2xl border border-white/10 bg-ink-800 p-5"
            >
              <h3 className="font-display text-lg text-bone">{d.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bone-muted">
                {d.b}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mt-16 rounded-3xl border border-volt/30 bg-gradient-to-br from-conviction/10 via-ink-800 to-ink-900 p-8 text-center">
        <h2 className="font-display text-3xl text-bone md:text-4xl">
          Seed round opens Q3 2026.
        </h2>
        <p className="mt-2 text-sm text-bone-muted md:text-base">
          We&apos;re looking for Tier-1 seed partners with APAC consumer, crypto
          infrastructure, or prediction-market portfolio experience.
        </p>
        <a
          href={deckMailto}
          className="mt-5 inline-block rounded-full bg-volt px-6 py-3 text-sm font-bold text-ink-900 hover:bg-volt-dark"
        >
          Request the deck →
        </a>
      </section>
    </main>
  );
}
