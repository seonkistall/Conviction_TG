import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AI_TRADERS,
  MARKETS,
  getAITrader,
} from '@/lib/markets';
import { formatUSD, pct } from '@/lib/format';
import { PriceChart } from '@/components/PriceChart';
import { CopyTradeButton } from '@/components/CopyTradeButton';
import { JsonLd } from '@/components/JsonLd';

const SITE_URL = 'https://conviction-fe.vercel.app';

interface Props {
  params: { handle: string };
}

export function generateStaticParams() {
  return AI_TRADERS.map((t) => ({ handle: t.handle }));
}

export function generateMetadata({ params }: Props): Metadata {
  const trader = getAITrader(params.handle);
  if (!trader) return { title: 'Trader not found · Conviction' };
  const title = `@${trader.handle} · ${trader.model} agent · Conviction`;
  const description = `${trader.strategy} · ${pct(trader.winRate)} win rate · +${formatUSD(trader.pnl30d)} (30d) · ${trader.followers.toLocaleString()} followers on Conviction.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/traders/${trader.handle}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/traders/${trader.handle}`,
    },
  };
}

const MODEL_TINT: Record<string, string> = {
  'Conviction-v2': 'text-volt border-volt/40 bg-volt/5',
  'Allora-KR': 'text-conviction border-conviction/40 bg-conviction/5',
  'Qwen3-32B': 'text-[#FF8AB4] border-[#FF8AB4]/40 bg-[#FF8AB4]/5',
  'Sonnet-4.6': 'text-[#C47A00] border-[#C47A00]/40 bg-[#C47A00]/5',
};

// Deterministic "pick history" generated from trader handle + AI_TRADERS list.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function tradersPicks(handle: string) {
  const h = hashString(handle);
  return MARKETS.slice(0, 12).map((m, i) => {
    const r = ((h + i * 7919) % 1000) / 1000;
    const won = r < 0.68;
    const side = m.kind === 'multi' ? m.outcomes?.[0]?.label ?? 'YES' : r < 0.5 ? 'YES' : 'NO';
    const entry = 0.28 + ((h + i * 131) % 650) / 1000;
    const exit = won
      ? Math.min(0.97, entry + 0.08 + ((h + i * 29) % 300) / 1000)
      : Math.max(0.03, entry - 0.09 - ((h + i * 41) % 280) / 1000);
    const size = 200 + ((h + i * 11) % 3_800);
    const pnl = (exit - entry) * size * (side === 'NO' ? -1 : 1) * (won ? 1 : -1) * 2;
    return {
      market: m,
      side,
      entry,
      exit,
      size,
      pnl,
      won,
      daysAgo: i + 1,
    };
  });
}

export default function TraderDetailPage({ params }: Props) {
  const trader = getAITrader(params.handle);
  if (!trader) notFound();

  const picks = tradersPicks(trader.handle);
  const wonCount = picks.filter((p) => p.won).length;
  const seed = hashString(trader.handle) % 997;

  // JSON-LD: expose the agent as a Person with an additionalType of
  // SoftwareApplication — schema.org doesn't have a native "AI agent" type,
  // but crawlers (Google, Bing, LLM-indexers) understand the Person +
  // SoftwareApplication combo as "human-facing persona backed by software."
  // We include memberOf → Conviction Organization so the agent is discoverable
  // when the parent brand is searched.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    additionalType: 'https://schema.org/SoftwareApplication',
    name: `@${trader.handle}`,
    alternateName: trader.handle,
    identifier: trader.id,
    description: trader.strategy,
    url: `${SITE_URL}/traders/${trader.handle}`,
    image: `${SITE_URL}/og-image.png`,
    knowsAbout: [
      'prediction markets',
      'event derivatives',
      trader.region,
      trader.model,
    ],
    memberOf: {
      '@type': 'Organization',
      name: 'Conviction',
      url: SITE_URL,
    },
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 pt-6 md:pt-10">
      <JsonLd data={jsonLd} />
      {/* Back link */}
      <Link
        href="/#agentic"
        className="inline-flex items-center gap-1 text-xs text-bone-muted hover:text-bone"
      >
        ← All agentic traders
      </Link>

      {/* Header */}
      <header className="mt-4 flex flex-col gap-6 rounded-3xl border border-white/10 bg-ink-800 p-6 md:flex-row md:items-center md:p-8">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-ink-900 to-conviction/20 text-6xl">
          {trader.avatar}
          {trader.live && (
            <span className="absolute -right-2 -top-2 inline-flex items-center gap-1 rounded-full bg-yes-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yes shadow-lg">
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              LIVE
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest">
            <span
              className={`rounded-full border px-2 py-0.5 ${
                MODEL_TINT[trader.model] ?? 'text-bone-muted border-white/10'
              }`}
            >
              {trader.model}
            </span>
            <span className="rounded-full border border-white/10 bg-ink-900 px-2 py-0.5 text-bone-muted">
              {trader.region}
            </span>
            <span className="text-bone-muted">
              · {trader.followers.toLocaleString()} followers
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl text-bone md:text-5xl">
            @{trader.handle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-bone-muted md:text-base">
            {trader.strategy}
          </p>
        </div>

        <div className="shrink-0 md:min-w-[220px]">
          <CopyTradeButton handle={trader.handle} />
          <div className="mt-2 text-center text-[11px] text-bone-muted">
            Copies on-chain · 0.2% fee to bot
          </div>
        </div>
      </header>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="30d PnL" value={`+${formatUSD(trader.pnl30d)}`} accent="text-volt" />
        <Kpi label="Win rate" value={pct(trader.winRate)} />
        <Kpi label="AUM" value={formatUSD(trader.aum)} />
        <Kpi label="Followers" value={trader.followers.toLocaleString()} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-12">
        {/* PnL curve */}
        <section className="md:col-span-8">
          <div className="rounded-3xl border border-white/10 bg-ink-800 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                  30-day PnL curve
                </div>
                <h2 className="mt-1 font-display text-2xl text-bone">
                  {trader.model} · autonomous on-chain
                </h2>
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-volt">
                +{formatUSD(trader.pnl30d)}
              </div>
            </div>
            <div className="mt-5 h-64 chart-grid-bg">
              <PriceChart seed={seed} days={30} stroke="#C6FF3D" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-bone-muted">
              <span>
                Sharpe · <span className="font-mono text-bone">{(1.4 + (seed % 40) / 100).toFixed(2)}</span>
              </span>
              <span>
                Max drawdown · <span className="font-mono text-no">−{((seed % 18) + 5).toFixed(1)}%</span>
              </span>
              <span>
                Avg trade · <span className="font-mono text-bone">{formatUSD(trader.aum / (picks.length * 8))}</span>
              </span>
              <span>
                Turnover · <span className="font-mono text-bone">{(2 + (seed % 35) / 10).toFixed(1)}× / week</span>
              </span>
            </div>
          </div>

          {/* Recent picks */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-ink-800 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-bone">Recent picks</h3>
              <span className="text-xs text-bone-muted">
                {wonCount}/{picks.length} resolved winners
              </span>
            </div>
            <div className="mt-4 divide-y divide-white/5">
              {picks.map((p) => (
                <Link
                  key={p.market.id}
                  href={`/markets/${p.market.slug}`}
                  className="flex items-center gap-3 py-3 text-sm hover:bg-ink-700/30"
                >
                  <img
                    src={p.market.media.poster}
                    alt=""
                    className="h-10 w-10 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-bone">{p.market.title}</div>
                    <div className="mt-0.5 text-[11px] text-bone-muted">
                      {p.market.category} · {p.daysAgo}d ago
                    </div>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      p.side === 'YES'
                        ? 'bg-yes-soft text-yes'
                        : p.side === 'NO'
                        ? 'bg-no-soft text-no'
                        : 'bg-conviction/20 text-conviction'
                    }`}
                  >
                    {p.side}
                  </span>
                  <div className="hidden font-mono text-xs tabular-nums text-bone-muted md:block">
                    ¢{Math.round(p.entry * 100)} → ¢{Math.round(p.exit * 100)}
                  </div>
                  <div
                    className={`w-20 text-right font-mono text-sm tabular-nums ${
                      p.pnl >= 0 ? 'text-yes' : 'text-no'
                    }`}
                  >
                    {p.pnl >= 0 ? '+' : ''}
                    {formatUSD(p.pnl)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Side rail */}
        <aside className="space-y-6 md:col-span-4">
          <div className="rounded-3xl border border-white/10 bg-ink-800 p-6">
            <h3 className="font-display text-xl text-bone">Strategy signals</h3>
            <ul className="mt-4 space-y-2">
              {strategyBullets(trader).map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 rounded-xl border border-white/5 bg-ink-900/50 p-3 text-xs leading-relaxed text-bone-muted"
                >
                  <span className="mt-0.5 text-volt">▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-ink-800 p-6">
            <h3 className="font-display text-xl text-bone">Stack</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Base model" v={trader.model} />
              <Row k="Retrievers" v={trader.model === 'Allora-KR' ? '12 scrapers' : '23 scrapers'} />
              <Row k="Judge" v="Sonnet-4.6" />
              <Row k="On-chain" v="HOGC Oracle · base" />
              <Row k="Restake" v="12h cadence" />
            </dl>
          </div>

          <div className="rounded-3xl border border-conviction/30 bg-conviction/5 p-6">
            <h3 className="font-display text-xl text-bone">Copy-trade terms</h3>
            <ul className="mt-3 space-y-1.5 text-xs text-bone-muted">
              <li>· Mirror allocation up to your cap</li>
              <li>· 0.2% of gross PnL to bot operator</li>
              <li>· Stop any time · no lock-up</li>
              <li>· Evidence bundle shared on every pick</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function strategyBullets(trader: { handle: string; model: string }): string[] {
  switch (trader.handle) {
    case 'ai.oracle.kr':
      return [
        'Fuses Weverse DM heat, Naver fan cafés, Melon chart velocity.',
        'Trades K-pop comeback and award-show markets 6–48h ahead.',
        'Auto-stops on MV takedown or HYBE press moves.',
      ];
    case 'allora.lck':
      return [
        'Draft-state + patch-metric quant with Allora KR oracle.',
        'Weights LCK, LPL, LEC series with team-form priors.',
        'Flags gold-diff swing >1.5k as live risk event.',
      ];
    case 'qwen.drama':
      return [
        'Netflix/Wavve retention curves + Naver rating sentiment.',
        'Specializes in mid-run K-drama cliffhanger markets.',
        'Drops exposure if fan-site boycott signal triggers.',
      ];
    case 'sonnet.macro':
      return [
        'Reads BOJ, PBOC, BOK policy deltas in real time.',
        'Cross-validates BTC / KRW / JPY / CNH macro markets.',
        'Backstops with Brave News + Reuters RAG over 90d window.',
      ];
    case 'ai.vibe.jp':
      return [
        'J-Pop + anime sentiment on Weibo, 2ch, Pixiv crossfeed.',
        'Trades Oricon, Oscon, voice-actor markets weekly.',
        'Offline on holidays — reactivates automatically.',
      ];
    default:
      return ['Conviction-v2 default stack — cultural & macro hybrid.'];
  }
}

function Kpi({
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
      <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
        {label}
      </div>
      <div
        className={`mt-1.5 font-mono text-2xl font-bold tabular-nums ${
          accent ?? 'text-bone'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <dt className="text-bone-muted">{k}</dt>
      <dd className="font-mono text-bone">{v}</dd>
    </div>
  );
}
