'use client';

import clsx from 'clsx';
import { useEffect } from 'react';
import type { EvidenceBundle } from '@/lib/types';
import { useT } from '@/lib/i18n';

interface Props {
  bundle: EvidenceBundle | null;
  open: boolean;
  onClose: () => void;
}

const PROVIDER_TINT: Record<string, string> = {
  Brave: 'bg-[#FB542B]/15 text-[#FB542B]',
  Exa: 'bg-conviction/20 text-conviction',
  CoinGecko: 'bg-[#8DC647]/15 text-[#8DC647]',
  TheSportsDB: 'bg-volt/15 text-volt',
  Naver: 'bg-[#03C75A]/15 text-[#03C75A]',
  Weverse: 'bg-[#FF8AB4]/15 text-[#FF8AB4]',
  RAG: 'bg-white/10 text-bone',
};

// v2.17 — Native `title` hover tooltip explaining *why* each source is in
// the APAC swarm. Pre-v2.17 the side sheet listed provider names with no
// context — users saw "Brave · Exa · CoinGecko · Naver · Weverse" and had
// no way to know whether these were credible or ad hoc. The one-line
// explanation per source anchors the value prop without adding UI weight.
const PROVIDER_WHY: Record<string, string> = {
  Brave: 'Privacy-first web index — goes wide across APAC publishers without filter bubbles.',
  Exa: 'Semantic neural search — pulls long-tail primary sources Google buries.',
  CoinGecko: 'Crypto market data — BTC / ETH / APAC altcoin pricing + listings.',
  TheSportsDB: 'Sports roster, fixture, and historical result feed (NPB, KBO, LCK, LPL, K-League).',
  Naver: 'Korea-first search — captures Korean-language signal Google misses.',
  Weverse: 'K-pop + J-pop fan-community heat — comeback sentiment the press lags on.',
  RAG: 'Retrieval-augmented generation over our own historical market + resolution corpus.',
};

// v2.18-4 — Provider → category classification. The swarm's narrative
// ("23-source evidence") lands flat when the side sheet shows 4-7
// anonymous provider chips in a vertical list. Grouping them into four
// semantic buckets makes the breadth legible at a glance: "this verdict
// triangulated web search + community sentiment + authoritative market
// data + our own historical RAG, not just one channel."
type ProviderCategory = 'Web' | 'Community' | 'Market data' | 'RAG';
const PROVIDER_CATEGORY: Record<string, ProviderCategory> = {
  Brave: 'Web',
  Exa: 'Web',
  Naver: 'Web',
  Weverse: 'Community',
  CoinGecko: 'Market data',
  TheSportsDB: 'Market data',
  RAG: 'RAG',
};
const CATEGORY_ORDER: ProviderCategory[] = [
  'Web',
  'Community',
  'Market data',
  'RAG',
];
const CATEGORY_BLURB: Record<ProviderCategory, string> = {
  Web: 'Wide-net search across public APAC publishers',
  Community: 'Fan-community sentiment signals (K-pop, J-pop, esports)',
  'Market data': 'Authoritative sports, crypto, financial feeds',
  RAG: 'Historical market + resolution corpus (ChromaDB)',
};

// v2.18-3 — small human-readable "time ago" used in the summary strip.
// Rounds to the nearest sensible unit; deliberately simple because we
// only render one value at a time.
function timeAgo(isoOrMs: string | number): string {
  const t = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
  if (!Number.isFinite(t)) return '—';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function EvidenceSideSheet({ bundle, open, onClose }: Props) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 transition',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      aria-hidden={!open}
    >
      <div
        className={clsx(
          'absolute inset-0 sheet-overlay transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      {/*
       * v2.19-6 — Responsive sheet shape.
       *
       * Pre-v2.19 the sheet was a full-width right-side slide-in on every
       * viewport, including phones — which meant it covered the whole
       * mobile screen with a right-edge shadow that made no sense for
       * thumb dismissal. Modern mobile convention (TikTok, Twitter,
       * native iOS/Android sheets) is a bottom-sheet with a draggable
       * top handle + tap-outside backdrop.
       *
       * We now render:
       *   - Mobile (< md): bottom sheet at 85dvh max-height with a
       *     rounded top, 10×1.5 drag handle at the top, slide-up from
       *     `translate-y-full`. Swipe-down dismissal is delegated to
       *     native overscroll (the sheet is its own scroll container,
       *     so pulling past top fires the FeedDetailSheet pattern).
       *   - Desktop (md+): unchanged — right-side slide-in, full
       *     height, 520px wide.
       *
       * The transform classes branch on the breakpoint; the overlay
       * backdrop already covered both cases.
       */}
      <aside
        className={clsx(
          // Base
          'absolute overflow-y-auto bg-ink-900 shadow-2xl transition-transform duration-300',
          // Mobile shape: bottom sheet
          'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl border-t border-white/10 p-5 pb-[calc(env(safe-area-inset-bottom,0)+1rem)]',
          // Desktop shape: right-side, full height (overrides bottom-sheet props)
          'md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-[520px] md:max-h-none md:rounded-none md:border-l md:border-t-0 md:p-6 md:pb-6',
          // Transform — slide direction varies by breakpoint
          open
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-full md:translate-y-0'
        )}
      >
        {/* Mobile-only drag handle — visual affordance; swipe dismissal
            delegated to native overscroll since the sheet is its own
            scroll container. */}
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15 md:hidden"
        />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-conviction">
              {t('evidence.title')}
            </div>
            <h2 className="mt-1 font-display text-3xl text-bone">
              {bundle?.verdict === 'YES'
                ? '✓ YES · Likely'
                : bundle?.verdict === 'NO'
                ? '✗ NO · Unlikely'
                : '◎ INCONCLUSIVE'}
            </h2>
            {bundle && (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-bone-muted">
                <span>
                  {t('evidence.judged')}:{' '}
                  <span className="text-bone">{bundle.judgedBy}</span>
                </span>
                <span>·</span>
                <span>
                  {t('ai.confidence')}:{' '}
                  <span className="font-mono text-volt">
                    {Math.round(bundle.confidence * 100)}%
                  </span>
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-bone-muted hover:text-bone"
            aria-label={t('evidence.close')}
          >
            ✕
          </button>
        </div>

        {!bundle ? (
          <p className="mt-8 text-sm text-bone-muted">
            No evidence bundle available yet for this market.
          </p>
        ) : (
          <>
            {/*
             * v2.18-5 — Reasoning is the punchline of the whole side sheet:
             * it's the one-paragraph "WHY did the AI land on this verdict."
             * Promoted to a bigger, higher-contrast callout so it lands
             * before the user's eyes drift to the provider list.
             */}
            <section className="mt-6 rounded-2xl border border-conviction/30 bg-gradient-to-br from-conviction/10 via-ink-800 to-ink-800 p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-conviction">
                Why this verdict
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-bone">
                {bundle.reasoning}
              </p>
            </section>

            {/*
             * v2.18-3 — Source summary strip. Surfaces the three facts
             * that anchor the "23-source evidence swarm" value prop in
             * numbers the user can actually see:
             *   - Total source count (for THIS bundle).
             *   - Average per-source confidence.
             *   - Freshness (most recently retrieved signal).
             */}
            <section className="mt-6">
              {(() => {
                const n = bundle.sources.length;
                const avgConf = n
                  ? Math.round(
                      (bundle.sources.reduce(
                        (a, s) => a + s.confidence,
                        0
                      ) /
                        n) *
                        100
                    )
                  : 0;
                const latestMs = n
                  ? bundle.sources.reduce(
                      (acc, s) => {
                        const t = Date.parse(s.retrievedAt);
                        return Number.isFinite(t) && t > acc ? t : acc;
                      },
                      0
                    )
                  : 0;
                return (
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-ink-800 p-3">
                    <SummaryStat
                      label="Sources"
                      value={`${n}`}
                      sub="active this bundle"
                    />
                    <SummaryStat
                      label="Avg conf."
                      value={`${avgConf}%`}
                      sub="across sources"
                      accent={
                        avgConf >= 80
                          ? 'text-yes'
                          : avgConf >= 60
                            ? 'text-volt'
                            : 'text-bone'
                      }
                    />
                    <SummaryStat
                      label="Latest"
                      value={latestMs ? timeAgo(latestMs) : '—'}
                      sub="retrieved"
                    />
                  </div>
                );
              })()}
            </section>

            {/*
             * v2.18-4 — Source list, grouped by provider category. Each
             * category gets a 1-line blurb below the header so the user
             * understands WHY four categories of source complement each
             * other rather than looking like a grab-bag.
             */}
            <section className="mt-6">
              <h3 className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                <span>{t('evidence.sources')}</span>
                <span className="font-mono text-bone">
                  {bundle.sources.length}
                </span>
              </h3>

              {CATEGORY_ORDER.map((cat) => {
                const group = bundle.sources.filter(
                  (s) =>
                    (PROVIDER_CATEGORY[s.provider] ?? 'Web') === cat
                );
                if (group.length === 0) return null;
                return (
                  <div key={cat} className="mb-4">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-bone">
                          {cat}
                        </span>
                        <span className="font-mono text-[10px] tabular-nums text-bone-muted">
                          {group.length}
                        </span>
                      </div>
                      <span className="truncate text-[10px] text-bone-muted">
                        {CATEGORY_BLURB[cat]}
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {group.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-xl border border-white/10 bg-ink-800 p-4"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={clsx(
                                'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest',
                                PROVIDER_TINT[s.provider] ??
                                  'bg-white/10 text-bone'
                              )}
                              title={PROVIDER_WHY[s.provider] ?? s.provider}
                            >
                              {s.provider}
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                              <ConfidenceDot v={s.confidence} />
                              <span className="font-mono text-[11px] tabular-nums text-bone">
                                {Math.round(s.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm font-medium text-bone">
                            {s.title}
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed text-bone-muted">
                            "{s.excerpt}"
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-conviction hover:underline"
                            >
                              {s.url}
                            </a>
                            <span className="font-mono text-bone-muted">
                              {t('evidence.retrieved')}{' '}
                              {timeAgo(s.retrievedAt)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-ink-900 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
        {label}
      </div>
      <div className={clsx('mt-0.5 font-mono text-lg font-bold tabular-nums', accent ?? 'text-bone')}>
        {value}
      </div>
      <div className="text-[10px] text-bone-muted">{sub}</div>
    </div>
  );
}

function ConfidenceDot({ v }: { v: number }) {
  const color = v >= 0.8 ? '#22C55E' : v >= 0.6 ? '#C6FF3D' : v >= 0.4 ? '#F59E0B' : '#EF4444';
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className="inline-block h-full w-full rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
    </span>
  );
}
