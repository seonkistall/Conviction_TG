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
      <aside
        className={clsx(
          'absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-white/10 bg-ink-900 p-6 shadow-2xl transition-transform duration-300 md:w-[520px]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
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
            {/* Reasoning */}
            <section className="mt-6 rounded-2xl border border-white/10 bg-ink-800 p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                {t('evidence.reasoning')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-bone">
                {bundle.reasoning}
              </p>
            </section>

            {/* Sources */}
            <section className="mt-6">
              <h3 className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                <span>{t('evidence.sources')}</span>
                <span className="font-mono text-bone">{bundle.sources.length}</span>
              </h3>
              <ul className="space-y-3">
                {bundle.sources.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-white/10 bg-ink-800 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest',
                          PROVIDER_TINT[s.provider] ?? 'bg-white/10 text-bone'
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
                        {new Date(s.retrievedAt).toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </aside>
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
