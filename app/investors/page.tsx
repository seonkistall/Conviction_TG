import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_BETA_EMAIL } from '@/lib/constants';

/**
 * v2.25 — /investors landing page.
 * v2.27-2 — Tier-1-ready hardening.
 *
 * Prior to v2.25 there was no dedicated surface for Tier-1 VCs who
 * click through the Twitter bio. This page exists to:
 *
 *   1. Recite the one-liner pitch (APAC-native, AI-powered,
 *      permissionless prediction market) in a form optimized for
 *      partner evaluation rather than end-user traffic.
 *   2. Surface the key traction stats honestly (no 500+ puffs).
 *   3. Answer the three standard VC diligence questions: team,
 *      competition, monetization.
 *   4. Route to the beta inbox for an intro / deck request.
 *
 * Intentionally dense but skimmable. Each section lands a concrete
 * fact or number — no marketing filler. The product demo is the
 * landing page itself; this page is the napkin in between.
 */
export const metadata: Metadata = {
  title: 'Conviction · Investors',
  description:
    'APAC-native, AI-powered permissionless prediction market. Seeking Tier-1 seed partners.',
  robots: { index: true, follow: true },
};

/*
 * v2.27-2: Honest traction.
 *
 * Old card set said "37 live markets · 99.8% across 500+ resolved".
 * Actual catalog is 41 markets with 3 live resolutions. A VC diligence
 * would catch this in 60s and flag "growth-metric inflation risk" on
 * the team. Replaced with:
 *   - 41 live markets (true count in lib/markets.ts)
 *   - 3 live resolutions (true — awaiting more catalog closings)
 *   - 99% backtest on n=500 historical events (methodology-backed)
 *   - 23 evidence sources (true — matches /methodology)
 *
 * "Backtest" is labeled explicitly so nobody confuses it with live
 * trading performance. Splitting backtest and live resolutions side-
 * by-side is the same transparency Polymarket/Kalshi use in their
 * own docs.
 */
const TRACTION = [
  { k: 'Live markets', v: '41', note: 'KR/JP/CN/IN/SEA + macro + crypto' },
  {
    k: 'Oracle backtest',
    v: '99%',
    note: 'on n=500 historical resolvable events',
  },
  {
    k: 'Live resolutions',
    v: '3/3',
    note: 'full sample will grow as catalog closes',
  },
  {
    k: 'Evidence sources',
    v: '23',
    note: 'Naver, Weverse, Weibo, Pixiv, YouTube, more',
  },
];

const DIFF = [
  {
    h: 'APAC-native, not APAC-adapted',
    b: 'Every scraper in the Oracle pool (Naver, Weverse, Weibo, Pixiv, Instiz, YouTube Data) is tuned for a specific APAC source. Polymarket and Kalshi index US politics + ESPN. We index K-pop comebacks, LCK vs LPL, NPB, Bollywood openings, anime ratings — the narratives APAC cares about, at the fidelity they care about.',
  },
  {
    h: 'Permissionless market creation',
    b: 'Any user can propose a market in ~45 seconds through the AI wizard at /markets/new. A 13-scraper panel grades the proposal for resolvability, evidence availability, and ambiguity before it ships. This is the moat — users surface narratives faster than any centralized curation team can, and the AI cost per proposal is below $0.10.',
  },
  {
    h: 'AI-first oracle, human safety net',
    b: 'Markets settle against a 23-source evidence swarm with a human-oracle final signoff. Zero disputes on the live sample (n=3) and 99% on a 500-event historical backtest. The full methodology is productized at /methodology — transparent by design so users build trust with the Oracle rather than the team.',
  },
];

/*
 * v2.27-2 — Competitive matrix. Tier-1 VCs ask "what about Polymarket?"
 * in the first five minutes of every prediction-market pitch. Having
 * the comparison pre-baked means you don't spend that time defending
 * — you spend it on what's next.
 *
 * Rows are the axes that matter: region fit, market type breadth,
 * creation model, resolution, crypto-rails. Filled with our
 * best-faith read as of April 2026.
 */
const COMPETITORS = [
  {
    axis: 'Primary region',
    conviction: 'APAC (KR · JP · CN · IN · SEA)',
    polymarket: 'US / Global-EN',
    kalshi: 'US (CFTC-regulated)',
  },
  {
    axis: 'Content focus',
    conviction: 'K-pop · LCK/LPL · NPB · Bollywood · anime · APAC macro',
    polymarket: 'US politics · crypto · ESPN sports',
    kalshi: 'US economics · weather · US politics',
  },
  {
    axis: 'Market creation',
    conviction: 'Permissionless via AI wizard (<45s)',
    polymarket: 'Curated team · ~days',
    kalshi: 'Regulated filing · ~weeks',
  },
  {
    axis: 'Oracle',
    conviction: '23-source AI swarm + human signoff',
    polymarket: 'UMA (DVM dispute)',
    kalshi: 'Internal manual',
  },
  {
    axis: 'Mobile-first UX',
    conviction: 'Vertical feed + 10s judgment loop',
    polymarket: 'Web-first, app retro-fit',
    kalshi: 'Web-first, app retro-fit',
  },
  {
    axis: 'Settlement',
    conviction: 'On-chain (HOGC) · roadmap',
    polymarket: 'Polygon',
    kalshi: 'Fiat only (CFTC)',
  },
];

/*
 * v2.27-2 — Monetization model. Every Tier-1 partner asks "how do you
 * make money?" within the first three minutes. Making this explicit
 * preempts 5+ min of defensive Q&A. Conviction's revenue math is
 * clean: take-rate on filled volume + small cut on on-chain settle.
 */
const MONETIZATION = [
  {
    line: 'Taker fee',
    pct: '2.0%',
    note: 'on matched order size, paid by the market-taker side',
  },
  {
    line: 'Settlement fee',
    pct: '0.3%',
    note: 'on on-chain settle via HOGC oracle, paid by winning position',
  },
  {
    line: 'Propose-a-market',
    pct: 'Free',
    note: 'AI wizard cost absorbed as a user-acquisition investment',
  },
  {
    line: 'Copy-trade revenue share',
    pct: '10%',
    note: 'on net agentic-trader P&L shared with the strategy author',
  },
];

/*
 * v2.27-2 — Founder section. VC pattern: team slide comes first in
 * every deck read. Placeholder today — populate with actual bios,
 * photos, LinkedIn links, and previous-exits/roles before first
 * partner meeting.
 */
const FOUNDERS = [
  {
    name: '[Founder 1 Name]',
    role: 'CEO · Product',
    bio: '[Previous role · exit · tenure at relevant APAC-consumer or fintech company]. Shipped [previous relevant product] to [scale]. [Hometown · grad school].',
    linkedin: 'https://linkedin.com/in/',
  },
  {
    name: '[Founder 2 Name]',
    role: 'CTO · Oracle',
    bio: '[Previous role in ML/LLM infra · scale they ran in production]. Built the 23-source evidence pipeline. [Publications or previous open-source].',
    linkedin: 'https://linkedin.com/in/',
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
        <p className="mt-1 text-sm text-bone-muted">
          Pre-launch. Every number below reproducible from our repo and{' '}
          <Link href="/methodology" className="text-volt hover:underline">
            methodology page
          </Link>
          .
        </p>
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

      {/* Competitive matrix */}
      <section className="mt-16 border-t border-white/5 pt-10">
        <h2 className="font-display text-2xl text-bone">
          Competitive landscape
        </h2>
        <p className="mt-1 text-sm text-bone-muted">
          Conviction is the first mover on APAC. Below: head-to-head vs.
          the two incumbents Tier-1 partners ask about in every meeting.
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-ink-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/60 text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
              <tr>
                <th className="px-4 py-3">Axis</th>
                <th className="px-4 py-3 text-volt">Conviction</th>
                <th className="px-4 py-3">Polymarket</th>
                <th className="px-4 py-3">Kalshi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {COMPETITORS.map((c) => (
                <tr key={c.axis} className="align-top">
                  <td className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                    {c.axis}
                  </td>
                  <td className="px-4 py-3 font-medium text-bone">
                    {c.conviction}
                  </td>
                  <td className="px-4 py-3 text-bone-muted">{c.polymarket}</td>
                  <td className="px-4 py-3 text-bone-muted">{c.kalshi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Monetization */}
      <section className="mt-16 border-t border-white/5 pt-10">
        <h2 className="font-display text-2xl text-bone">Revenue model</h2>
        <p className="mt-1 text-sm text-bone-muted">
          Transparent fee stack. Every dollar on the exchange is
          attributable to one of the four lines below; no hidden take,
          no gas-masking.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {MONETIZATION.map((m) => (
            <div
              key={m.line}
              className="rounded-2xl border border-white/10 bg-ink-800 p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-base text-bone">{m.line}</h3>
                <span className="font-mono text-lg font-bold text-volt">
                  {m.pct}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-bone-muted">
                {m.note}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-bone-muted/70">
          Taker-fee reference: Polymarket 2.0%, Kalshi 1.5–2.0%. Our
          on-chain settle fee is novel and backed by HOGC partnership
          (details under NDA).
        </p>
      </section>

      {/* Team */}
      <section className="mt-16 border-t border-white/5 pt-10">
        <h2 className="font-display text-2xl text-bone">Team</h2>
        <p className="mt-1 text-sm text-bone-muted">
          Placeholder bios — replace with actual founders, photos, and
          LinkedIn URLs before sending to any partner.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FOUNDERS.map((f) => (
            <div
              key={f.name}
              className="rounded-2xl border border-white/10 bg-ink-800 p-5"
            >
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-white/15 bg-ink-900 text-2xl"
                >
                  👤
                </div>
                <div>
                  <h3 className="font-display text-lg text-bone">{f.name}</h3>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-volt">
                    {f.role}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-bone-muted">
                {f.bio}
              </p>
              <a
                href={f.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-widest text-volt hover:underline"
              >
                LinkedIn →
              </a>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-bone-muted/70">
          Advisors, operators, and partner roster provided under NDA
          with the deck request.
        </p>
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
        <p className="mt-4 text-[11px] text-bone-muted/70">
          Deck available under NDA · No cold-send policy · APAC
          office hours Mon–Fri KST
        </p>
      </section>
    </main>
  );
}
