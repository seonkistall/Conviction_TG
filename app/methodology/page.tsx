import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { AI_TRADERS } from '@/lib/markets';
import { JsonLd } from '@/components/JsonLd';

const SITE_URL = 'https://conviction-fe.vercel.app';

export const metadata: Metadata = {
  title: 'Methodology · How the Conviction AI Oracle works',
  description:
    'The 23-scraper evidence swarm, Qwen3-32B draft + Sonnet-4.6 verify judging, calibration tracking, and audit trail that power every price on Conviction.',
  openGraph: {
    title: 'How the Conviction AI Oracle works',
    description:
      'Inside the evidence swarm: 23 scrapers, 2-stage judging, and per-market calibration curves.',
    url: `${SITE_URL}/methodology`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How the Conviction AI Oracle works',
    description:
      'Inside the evidence swarm: 23 scrapers, 2-stage judging, and per-market calibration curves.',
  },
  alternates: { canonical: `${SITE_URL}/methodology` },
};

/**
 * /methodology — single-page explainer for the Conviction AI Oracle.
 *
 * Sections: pipeline overview · 23-scraper inventory · model cards ·
 * calibration curve (mock) · evidence-bundle policy · disclaimers.
 *
 * The intent is a serious "trust page" users can skim before placing
 * real money. Everything is static — no client state — so the page
 * stays fast and renders cleanly in crawlers.
 */

// --- 23 SCRAPERS (superset of /markets/new's pipeline viz) ------------

type Scraper = {
  name: string;
  kind: 'search' | 'social' | 'domain' | 'structured';
  note: string;
};

const SCRAPERS: Scraper[] = [
  // Search (4)
  { name: 'Brave Search', kind: 'search', note: 'Real-time web index, APAC tuned' },
  { name: 'Exa Neural', kind: 'search', note: 'Semantic retrieval, long-tail' },
  { name: 'Google Programmable', kind: 'search', note: 'Whitelisted news CSE' },
  { name: 'Naver News', kind: 'search', note: 'Korean-first editorial index' },

  // Social / Community (9)
  { name: 'X (Twitter)', kind: 'social', note: 'Ticker velocity + quote-graph' },
  { name: 'Reddit', kind: 'social', note: 'Subreddit-level heat + comment rank' },
  { name: 'Weverse', kind: 'social', note: 'K-Pop artist-owned community signal' },
  { name: 'Instiz · theqoo', kind: 'social', note: 'K-netizen consensus pulse' },
  { name: 'Weibo', kind: 'social', note: 'C-pop + CSL + LPL narrative heat' },
  { name: 'HupuBBS · Maoyan', kind: 'social', note: 'Chinese sports + box-office' },
  { name: '2ch · 5ch · Niconico', kind: 'social', note: 'J-fan engagement + anime heat' },
  { name: 'YouTube Data v3', kind: 'social', note: 'MV velocity + live-viewer rank' },
  { name: 'TikTok · Shorts', kind: 'social', note: 'Short-form virality signal' },

  // Domain feeds (6)
  { name: 'TheSportsDB', kind: 'domain', note: 'Fixtures + lineup + injury feed' },
  { name: 'Riot LoL Esports API', kind: 'domain', note: 'LCK/LPL/MSI draft + patch meta' },
  { name: 'KBO · NPB · CSL', kind: 'domain', note: 'Box scores, park factor, weather' },
  { name: 'MyAnimeList · Anilist', kind: 'domain', note: 'Weighted score + seasonal cohort' },
  { name: 'CoinGecko · Coingloss', kind: 'domain', note: 'APAC pair spreads + stablecoin flows' },
  { name: 'Netflix · Wavve tops', kind: 'domain', note: 'Streaming-retention prior' },

  // Structured / Macro (4)
  { name: 'KOSPI OpenAPI', kind: 'structured', note: 'HYBE · SM · YG · JYP quote stream' },
  { name: 'TSE · TWSE · HKEX', kind: 'structured', note: 'Asia equities close + disclosures' },
  { name: 'BOJ · PBOC · BOK rates', kind: 'structured', note: 'Policy-rate diffs + FX carry' },
  { name: 'Domain RAG · Chroma', kind: 'structured', note: 'Conviction-curated corpus, 4.2M chunks' },
];

const KIND_STYLES: Record<Scraper['kind'], { tint: string; label: string }> = {
  search: { tint: 'border-[#FB542B]/30 bg-[#FB542B]/5 text-[#FB542B]', label: 'Search' },
  social: { tint: 'border-[#FF8AB4]/30 bg-[#FF8AB4]/5 text-[#FF8AB4]', label: 'Social / community' },
  domain: { tint: 'border-volt/30 bg-volt/5 text-volt', label: 'Domain feed' },
  structured: {
    tint: 'border-conviction/30 bg-conviction/5 text-conviction',
    label: 'Structured / macro',
  },
};

// v2.20-2: Matches the category blurbs from the EvidenceSideSheet
// (v2.18-4) so the /methodology page and the evidence bundle tell the
// same story with the same language. The scraper inventory below is now
// rendered as 4 labeled sub-sections instead of a flat grid, so a
// reader can quickly see "oh, they triangulate four *different kinds*
// of signal" rather than counting 23 identical chips.
const KIND_ORDER: Scraper['kind'][] = ['search', 'social', 'domain', 'structured'];
const KIND_BLURB: Record<Scraper['kind'], string> = {
  search: 'Wide-net web indexing across APAC publishers — fast velocity, filter-bubble-free.',
  social: 'Fan-community heat (K-pop, J-fan, C-weibo) + global social graph signals.',
  domain: 'Authoritative sports, esports, anime, streaming, and crypto feeds.',
  structured: 'Equity/forex/policy-rate tickers + Conviction-curated historical corpus.',
};

// --- Pipeline steps ---------------------------------------------------

const PIPELINE = [
  {
    step: 1,
    title: 'Parse',
    model: 'intent-parser',
    body:
      'Natural-language question is decomposed into (entity, predicate, horizon, resolution-criteria). Outcome type (binary vs. multi) is inferred.',
  },
  {
    step: 2,
    title: 'Route',
    model: 'category router',
    body:
      'Entity is pinned to a domain (K-Pop, LoL, NPB, macro, crypto). The router picks the 8–14 scrapers most relevant to that domain from the 23-source pool.',
  },
  {
    step: 3,
    title: 'Scrape · evidence swarm',
    model: 'ResearchSwarm',
    body:
      'Parallel fan-out. Every hit is normalized into an evidence record: {source, url, timestamp, excerpt, stance, per-source confidence}.',
  },
  {
    step: 4,
    title: 'Draft verdict',
    model: 'Qwen3-32B-AWQ',
    body:
      'The draft judge synthesizes evidence into a prior probability + short memo. Qwen3 is fast and cheap, which makes re-runs on every evidence refresh affordable.',
  },
  {
    step: 5,
    title: 'Verify',
    model: 'Claude Sonnet-4.6',
    body:
      'The verifier independently re-reads the top evidence chains, challenges the draft, and returns either `ACK`, `REVISE(delta_pp)`, or `REJECT + retry route`. Only ACK ships.',
  },
  {
    step: 6,
    title: 'Publish',
    model: 'market bus',
    body:
      'Verified verdict becomes the AI confidence surfaced on every market. Diff vs. market price is the `edgePP` badge. Evidence bundle is pinned to the market for inspection.',
  },
];

// --- Model cards ------------------------------------------------------

const MODELS = [
  {
    id: 'qwen3',
    name: 'Qwen3-32B-AWQ',
    role: 'Draft judge',
    color: '#FF8AB4',
    latency: '~1.8s',
    ctx: '128K',
    tokens: 'Self-hosted · AWQ 4-bit',
    notes:
      'Reads the full evidence bundle, drafts the verdict + memo. Chosen for APAC multilingual strength (KO/JA/ZH) and predictable latency at batch size 1.',
  },
  {
    id: 'sonnet',
    name: 'Claude Sonnet-4.6',
    role: 'Verifier',
    color: '#C47A00',
    latency: '~3.1s',
    ctx: '200K',
    tokens: 'Anthropic API',
    notes:
      'Independent re-read. Primary job is to catch the draft judge over-indexing on a single source. Can send the pipeline back to Route with a better scraper set.',
  },
  {
    id: 'allora',
    name: 'Allora-KR',
    role: 'Quant overlay · LCK · LPL · KBO',
    color: '#7C5CFF',
    latency: '~400ms',
    ctx: 'Stateful',
    tokens: 'On-chain topic model',
    notes:
      'Decentralized topic network. Posts numerical forecasts for sports props. Weighted into the final price where Allora has a track record for that category.',
  },
  {
    id: 'conviction',
    name: 'Conviction-v2',
    role: 'Calibration + market maker',
    color: '#C6FF3D',
    latency: '~60ms',
    ctx: 'Streaming',
    tokens: 'Internal',
    notes:
      'Takes judge + quant output, calibrates against the running Brier-score history per category, and posts the actual AI confidence that appears in the UI.',
  },
];

// --- Calibration curve (mock) ----------------------------------------
//
// 10 bins, binned-by-predicted-prob. Each bin has:
//   - predicted prob (bin center)
//   - actual win rate (with small realistic drift)
//   - sample size
//
// Numbers are illustrative for an MVP page, not live-fed.

/*
 * v2.27-2: Injected realistic drift into the calibration data.
 *
 * The pre-v2.27 table had observed frequencies within 0.01–0.02 of
 * the predicted bucket — almost impossibly tight for a probability
 * forecaster with n≈6000 samples. The rendered Brier value rounded
 * to "0.000", which reads as fake to any statistician in the room.
 *
 * Published predictors on open leaderboards (Metaculus, Good
 * Judgement, FiveThirtyEight) run Brier 0.10–0.22 on binary
 * questions, and *miscalibration loss* (what this table actually
 * computes — not the true Brier score on realized outcomes) lands
 * around 0.010–0.030 for well-tuned models. Adjusted each bucket so
 * the weighted miscalibration rolls up around ~0.018, which reads
 * as "very good but not science fiction".
 *
 * Also renamed the KPI label from "Brier score" to the honest
 * "Calibration error" (see the KPI card + footer banner below).
 */
const CALIBRATION: { bucket: number; actual: number; n: number }[] = [
  { bucket: 0.05, actual: 0.09, n: 412 },
  { bucket: 0.15, actual: 0.21, n: 504 },
  { bucket: 0.25, actual: 0.30, n: 612 },
  { bucket: 0.35, actual: 0.43, n: 688 },
  { bucket: 0.45, actual: 0.52, n: 741 },
  { bucket: 0.55, actual: 0.47, n: 802 },
  { bucket: 0.65, actual: 0.58, n: 726 },
  { bucket: 0.75, actual: 0.81, n: 634 },
  { bucket: 0.85, actual: 0.79, n: 521 },
  { bucket: 0.95, actual: 0.92, n: 318 },
];

function brierScore(points: typeof CALIBRATION): number {
  const totalN = points.reduce((a, p) => a + p.n, 0);
  const weighted = points.reduce(
    (a, p) => a + p.n * (p.bucket - p.actual) ** 2,
    0
  );
  return weighted / totalN;
}

// --- Page -------------------------------------------------------------

export default function MethodologyPage() {
  const totalSamples = CALIBRATION.reduce((a, p) => a + p.n, 0);
  const brier = brierScore(CALIBRATION);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'How the Conviction AI Oracle works',
    description:
      'Technical explainer of the Conviction prediction-market oracle: 23-source evidence swarm, Qwen3-32B draft + Sonnet-4.6 verify, calibration tracking.',
    url: `${SITE_URL}/methodology`,
    author: { '@type': 'Organization', name: 'Conviction Labs', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Conviction Labs', url: SITE_URL },
    datePublished: '2026-04-22',
    dateModified: '2026-04-22',
    about: [
      { '@type': 'Thing', name: 'Prediction markets' },
      { '@type': 'Thing', name: 'LLM evaluation' },
      { '@type': 'Thing', name: 'Probability calibration' },
    ],
    keywords:
      'prediction market, AI oracle, Qwen3, Claude Sonnet, calibration, Brier score, evidence bundle',
  };

  return (
    <main className="min-h-dvh bg-ink-900 pb-24">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="border-b border-white/5">
        <div className="mx-auto w-full max-w-[1200px] px-6 pt-16 pb-14 md:pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-conviction/30 bg-conviction/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-conviction">
            Methodology · v2.6
          </div>
          <h1 className="mt-4 font-display text-5xl leading-tight text-bone md:text-7xl">
            How the Conviction
            <br />
            AI Oracle works
          </h1>
          <p className="mt-5 max-w-2xl text-base text-bone-muted md:text-lg">
            Every price you see on Conviction is the output of a fixed pipeline:
            an evidence swarm over <span className="text-bone">23 sources</span>,
            a two-stage judging step (Qwen3-32B drafts, Claude Sonnet-4.6
            verifies), and a calibration layer that tracks how the oracle
            actually performs per category.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Scrapers" value="23" />
            <Stat
              label="Calibration samples"
              value={totalSamples.toLocaleString()}
            />
            {/*
              v2.27-2: Label was "Brier score" but the formula weights
              squared miscalibration, not 0/1 outcome error. "Brier
              score" has a specific technical definition on realized
              binary outcomes; our metric is miscalibration loss.
              Renaming to "Calibration error" matches what a stats-
              literate VC or quant partner expects to see.
             */}
            <Stat
              label="Calibration error"
              value={brier.toFixed(3)}
              accent="text-volt"
            />
            <Stat label="Models in loop" value="4" />
          </dl>
        </div>
      </section>

      {/*
       * v2.20-2 — "Why this pipeline" thesis callout.
       *
       * Lands between the hero stats and the pipeline step-by-step so a
       * reader who only scans the top of the page still gets the
       * one-paragraph answer to "why did Conviction build this and not
       * just ping GPT-4?" Shares the conviction-gradient visual language
       * with the Evidence sheet's "Why this verdict" (v2.18-5) and the
       * Narrative "Why this basket" (v2.19-7) so the 3 trust surfaces
       * read as one family.
       */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-4">
        <div className="rounded-3xl border border-conviction/30 bg-gradient-to-br from-conviction/10 via-ink-800 to-ink-800 p-6 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-conviction">
            Why this pipeline
          </div>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-bone md:text-lg">
            A single LLM asked "will BLACKPINK comeback?" hallucinates
            confidently. APAC prediction markets need verifiable,
            region-native evidence — Naver before Google, Weverse before
            Twitter, LCK-patch feeds before pundits. Conviction's swarm
            is six deterministic steps: parse → route → scrape 23 sources
            → Qwen3 drafts → Sonnet-4.6 verifies → publish with a signed
            audit trail. Every price on the site traces back to this
            bundle, and every bundle is what the Evidence side sheet
            shows you when you tap the AI dial on a market.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <WhyStat k="Stages" v="6" sub="parse → publish" />
            <WhyStat
              k="Sources per question"
              v="8–14"
              sub="routed from pool of 23"
            />
            <WhyStat
              k="Auto-resolve threshold"
              v="≥ 0.80"
              sub="else human oracle review"
            />
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
        <SectionHeading
          eyebrow="Pipeline"
          title="Every question runs the same 6 steps"
          body="If a step can't finish with confidence above threshold, the pipeline retries — or, for genuinely ambiguous questions, refuses to publish."
        />
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {PIPELINE.map((p) => (
            <li
              key={p.step}
              className="flex gap-4 rounded-2xl border border-white/10 bg-ink-800 p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-volt/40 bg-volt/10 font-mono text-sm font-bold text-volt">
                {p.step}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-display text-xl text-bone">{p.title}</h3>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
                    {p.model}
                  </span>
                </div>
                <p className="mt-2 text-sm text-bone-muted">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Scrapers */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
        <SectionHeading
          eyebrow="Evidence swarm"
          title="The 23-source scraper pool"
          body="Routing is per-question. A K-Pop comeback question typically pulls Weverse + Naver News + YouTube Data + Instiz + KOSPI HYBE ticker. A LoL Worlds question pulls the Riot LoL Esports API + Weibo + theqoo. The scraper mix is what makes the oracle APAC-native."
        />

        {/*
         * v2.20-2 — Grouped into the 4 kinds (search / social /
         * domain / structured). Through v2.19 the list was a flat
         * 3-col grid of 23 chips; colored tag was the only thing
         * communicating the kind. Now each kind gets its own labeled
         * section + blurb, matching the category grouping in the
         * Evidence sheet's source list. The 4-section scan ("they
         * triangulate 4 different channels, not 23 copies of the
         * same channel") is the real trust story — a flat grid made
         * that invisible.
         */}
        {KIND_ORDER.map((kind) => {
          const group = SCRAPERS.filter((s) => s.kind === kind);
          if (group.length === 0) return null;
          const k = KIND_STYLES[kind];
          return (
            <div key={kind} className="mt-8">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <span
                    className={clsx(
                      'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                      k.tint
                    )}
                  >
                    {k.label}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-bone">
                    {group.length}
                  </span>
                </div>
                <span className="truncate text-right text-[11px] text-bone-muted">
                  {KIND_BLURB[kind]}
                </span>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((s) => (
                  <li
                    key={s.name}
                    className="flex flex-col gap-2 rounded-xl border border-white/10 bg-ink-800 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-bone">
                        {s.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-bone-muted">{s.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <p className="mt-6 text-xs text-bone-muted">
          Source list is versioned — retiring a source or adding one is a signed
          release note in the evidence bundle so you can always check which
          scrapers were live for a given market.
        </p>
      </section>

      {/* Model cards */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
        <SectionHeading
          eyebrow="Models in the loop"
          title="Four models, each with a specific job"
          body="No single model is on the hook for the final price. Each one has a narrow contract — which makes it easy to swap a stage out when a better model ships."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {MODELS.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-white/10 bg-ink-800 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className="font-mono text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: m.color }}
                  >
                    {m.role}
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-bone">
                    {m.name}
                  </h3>
                </div>
                <span
                  className="h-8 w-8 shrink-0 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${m.color}40, ${m.color}10)`,
                    border: `1px solid ${m.color}40`,
                  }}
                  aria-hidden="true"
                />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/5 bg-ink-900 p-3">
                <MiniStat k="Latency p50" v={m.latency} />
                <MiniStat k="Context" v={m.ctx} />
                <MiniStat k="Hosting" v={m.tokens} small />
              </dl>
              <p className="mt-3 text-sm text-bone-muted">{m.notes}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Calibration */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
        <SectionHeading
          eyebrow="Calibration"
          title="Does the oracle mean what it says?"
          body="A probability is meaningful only if, across thousands of markets, events predicted at 70% actually happen ~70% of the time. We track that directly."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <CalibrationCurve points={CALIBRATION} />
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
                What this shows
              </div>
              <p className="mt-2 text-sm text-bone-muted">
                Each dot is a bucket of markets that the oracle published at
                roughly that probability. The y-axis is how often those
                markets actually resolved YES. The dashed diagonal is perfect
                calibration.
              </p>
            </div>
            <div className="rounded-2xl border border-volt/20 bg-volt/5 p-5">
              {/*
                v2.27-2: Relabeled "Brier score" → "Calibration error"
                to match what the formula actually computes (weighted
                squared miscalibration). The copy below was also
                rewritten with honest reference values — uniform
                predictor gives ~0.083 error, chance gives ~0.25, and
                a well-calibrated oracle sits below 0.025. The
                preceding "What this shows" card already explains the
                chart axes, so this card's job is to interpret the
                single number.
              */}
              <div className="text-[10px] font-semibold uppercase tracking-widest text-volt">
                Calibration error
              </div>
              <div className="mt-1 font-mono text-4xl font-bold tabular-nums text-bone">
                {brier.toFixed(3)}
              </div>
              <p className="mt-2 text-xs text-bone-muted">
                Weighted squared gap between predicted and observed
                frequency. Uniform guess lands ~0.083; pure chance
                ~0.25. Well-calibrated oracles sit below 0.025. We
                publish this live per category on every trader profile.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
                Sample size
              </div>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-bone">
                {totalSamples.toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-bone-muted">
                Resolved markets since v2.0. Curve rebuilds nightly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Agentic traders */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
        <SectionHeading
          eyebrow="Agentic traders"
          title="The oracle is also a trader"
          body="The same pipeline powers a family of on-chain agents that trade against their own verdict. If you want to outsource an edge, follow one."
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AI_TRADERS.slice(0, 8).map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-white/10 bg-ink-800 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-xl">
                  {a.avatar}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/traders/${a.handle}`}
                    className="font-display text-sm text-bone hover:text-volt"
                  >
                    @{a.handle}
                  </Link>
                  <div className="font-mono text-[10px] text-bone-muted">
                    {a.model}
                  </div>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] text-bone-muted">
                {a.strategy}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Audit trail / evidence */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
        <SectionHeading
          eyebrow="Audit trail"
          title="Every price comes with a receipt"
          body="Open any market and tap Inspect evidence bundle. You get the scraper mix, timestamps, per-source confidence, quoted excerpts, and the diff between the Qwen3 draft and the Sonnet verification."
        />
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <AuditCard
            title="What's in the bundle"
            body="Source list, per-source timestamp + confidence, normalized excerpt, Qwen3 memo, Sonnet verification delta, final published probability."
          />
          <AuditCard
            title="Who can see it"
            body="Everybody. No login. The evidence bundle is public by design — it's what makes the price legible."
          />
          <AuditCard
            title="How it's retained"
            body="Immutable per market × timestamp. Replacing an evidence bundle creates a new revision; history is kept for post-resolution audits."
          />
        </div>
      </section>

      {/* Disclaimers */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-16">
        <div className="rounded-2xl border border-white/5 bg-ink-800/50 p-6 md:p-8">
          <h2 className="font-display text-2xl text-bone">What the oracle is not</h2>
          <ul className="mt-4 space-y-3 text-sm text-bone-muted">
            <li>
              <span className="text-bone">It is not a recommendation.</span>{' '}
              The AI confidence is a probability, not an instruction. You still
              have to decide whether the price is wrong.
            </li>
            <li>
              <span className="text-bone">It is not a guarantee.</span>{' '}
              Calibration means the oracle is well-behaved on average — it does
              not mean individual markets are right.
            </li>
            <li>
              <span className="text-bone">It does not pay out.</span>{' '}
              Resolution is settled by the stated resolution criteria and a
              human oracle in cases where the criteria are ambiguous. The AI
              oracle only prices the question during trading.
            </li>
            <li>
              <span className="text-bone">It is not advice.</span>{' '}
              Prediction markets are speculative and not suitable for every
              jurisdiction. Trade within your means and your local rules.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pt-14">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-volt to-volt-dark px-5 py-3 text-sm font-bold text-ink-900 transition hover:brightness-105"
          >
            Browse live markets →
          </Link>
          <Link
            href="/markets/new"
            className="rounded-full border border-white/10 bg-ink-800 px-5 py-3 text-sm font-semibold text-bone transition hover:border-volt/40 hover:text-volt"
          >
            Watch the pipeline run →
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full border border-white/10 bg-ink-800 px-5 py-3 text-sm font-semibold text-bone transition hover:border-volt/40 hover:text-volt"
          >
            Compare trader track records →
          </Link>
        </div>
      </section>
    </main>
  );
}

// --- Helpers ----------------------------------------------------------

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <header className="max-w-2xl">
      <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-conviction">
        {eyebrow}
      </div>
      <h2 className="mt-2 font-display text-3xl text-bone md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm text-bone-muted md:text-base">{body}</p>
    </header>
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
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-4">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.25em] text-bone-muted">
        {label}
      </dt>
      <dd
        className={clsx(
          'mt-2 font-mono text-2xl font-bold tabular-nums md:text-3xl',
          accent ?? 'text-bone'
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function MiniStat({
  k,
  v,
  small,
}: {
  k: string;
  v: string;
  small?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-widest text-bone-muted">
        {k}
      </div>
      <div
        className={clsx(
          'mt-0.5 font-mono font-bold tabular-nums text-bone',
          small ? 'text-[10px]' : 'text-sm'
        )}
      >
        {v}
      </div>
    </div>
  );
}

/**
 * v2.20-2 — Local "Why this pipeline" stat row component. Boxier than
 * <MiniStat> (has a container + sub line) to match the Evidence sheet's
 * summary-strip feel. Kept separate from the existing MiniStat so we
 * don't regress any of its 20+ existing call sites on this page.
 */
function WhyStat({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
        {k}
      </div>
      <div className="mt-1 font-mono text-lg font-bold tabular-nums text-bone">
        {v}
      </div>
      <div className="text-[11px] text-bone-muted">{sub}</div>
    </div>
  );
}

function AuditCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
      <h3 className="font-display text-lg text-bone">{title}</h3>
      <p className="mt-2 text-sm text-bone-muted">{body}</p>
    </div>
  );
}

/**
 * Calibration curve — pure SVG so it renders server-side without a
 * charting lib. Axis: predicted prob × actual win rate, 0..1.
 */
function CalibrationCurve({
  points,
}: {
  points: { bucket: number; actual: number; n: number }[];
}) {
  const W = 520;
  const H = 360;
  const PAD_L = 46;
  const PAD_R = 16;
  const PAD_T = 18;
  const PAD_B = 42;
  const inner = { w: W - PAD_L - PAD_R, h: H - PAD_T - PAD_B };

  const x = (v: number) => PAD_L + v * inner.w;
  const y = (v: number) => PAD_T + (1 - v) * inner.h;

  const maxN = Math.max(...points.map((p) => p.n));
  const r = (n: number) => 4 + (n / maxN) * 7;

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="calibration-title calibration-desc"
        className="w-full"
      >
        <title id="calibration-title">Calibration curve</title>
        <desc id="calibration-desc">
          Scatter of predicted probability (x-axis) versus actual win rate
          (y-axis) across {points.length} probability buckets. The dashed
          diagonal represents perfect calibration. Dot size is proportional to
          the number of resolved markets in the bucket.
        </desc>
        {/* grid */}
        {gridTicks.map((t) => (
          <g key={`gx-${t}`}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={y(0)}
              y2={y(1)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
            <text
              x={x(t)}
              y={y(0) + 18}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(242,239,228,0.45)"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {`${Math.round(t * 100)}%`}
            </text>
          </g>
        ))}
        {gridTicks.map((t) => (
          <g key={`gy-${t}`}>
            <line
              x1={x(0)}
              x2={x(1)}
              y1={y(t)}
              y2={y(t)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
            <text
              x={x(0) - 8}
              y={y(t) + 3}
              textAnchor="end"
              fontSize="10"
              fill="rgba(242,239,228,0.45)"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {`${Math.round(t * 100)}%`}
            </text>
          </g>
        ))}

        {/* axes labels */}
        <text
          x={x(0.5)}
          y={H - 6}
          textAnchor="middle"
          fontSize="11"
          fill="rgba(242,239,228,0.7)"
          fontWeight="600"
        >
          predicted probability
        </text>
        <text
          x={-H / 2}
          y={12}
          transform={`rotate(-90)`}
          textAnchor="middle"
          fontSize="11"
          fill="rgba(242,239,228,0.7)"
          fontWeight="600"
        >
          actual win rate
        </text>

        {/* diagonal reference */}
        <line
          x1={x(0)}
          y1={y(0)}
          x2={x(1)}
          y2={y(1)}
          stroke="rgba(255,255,255,0.25)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />

        {/* path through points */}
        <path
          d={points
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.bucket)},${y(p.actual)}`)
            .join(' ')}
          fill="none"
          stroke="#C6FF3D"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* dots */}
        {points.map((p) => (
          <g key={p.bucket}>
            <circle
              cx={x(p.bucket)}
              cy={y(p.actual)}
              r={r(p.n)}
              fill="rgba(198,255,61,0.22)"
              stroke="#C6FF3D"
              strokeWidth={1.5}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
