'use client';

import { useState } from 'react';
import type { Market } from '@/lib/types';
import { EVIDENCE_BUNDLES } from '@/lib/markets';
import { EvidenceSideSheet } from './EvidenceSideSheet';
import { EdgeBadge } from './EdgeBadge';
import { useT } from '@/lib/i18n';

/**
 * "Conviction AI Oracle" panel — matches the Deep-Research memo pipeline:
 * 23 scrapers → ResearchSwarm (Brave/Exa/CoinGecko/TheSportsDB/RAG) →
 * Qwen3-32B-AWQ → Claude Sonnet verify. The "Inspect evidence bundle" button
 * opens a full side-sheet with sources, excerpts, and per-source confidence.
 */
/**
 * v2.17 — `autoOpen` boots the evidence side sheet on mount. Used when
 * the user arrived with `?evidence=open` in the URL (clicking the
 * confidence dial on a MarketCard surfaces the AI rationale without
 * scrolling the whole detail page).
 */
export function AIOracleCard({
  market,
  autoOpen = false,
}: {
  market: Market;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const t = useT();
  const conf = Math.round(market.aiConfidence * 100);
  const diff = Math.round((market.aiConfidence - market.yesProb) * 100);
  const bundle = EVIDENCE_BUNDLES[market.id] ?? null;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-conviction/30 bg-gradient-to-br from-conviction/10 via-ink-800 to-ink-800 p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-conviction/30 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-conviction text-[10px] font-bold text-white">
                AI
              </span>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-bone-muted">
                {t('ai.title')}
              </h3>
            </div>
            {market.edgePP && market.edgePP >= 5 && <EdgeBadge pp={market.edgePP} />}
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="font-mono text-5xl font-bold tabular-nums text-bone">
              {conf}
              <span className="text-xl text-bone-muted">%</span>
            </span>
            <span className={`pb-2 text-sm font-semibold ${diff > 0 ? 'text-yes' : diff < 0 ? 'text-no' : 'text-bone-muted'}`}>
              {diff > 0 ? '+' : ''}
              {diff}pp {t('ai.vs_market')}
            </span>
          </div>
          <p className="mt-2 text-xs text-bone-muted">
            AI evidence swarm sees{' '}
            <span className="text-bone">
              {market.aiTrend === 'up' ? 'rising' : market.aiTrend === 'down' ? 'fading' : 'flat'}
            </span>{' '}
            signal. {t('ai.subtitle')}.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Source label="Brave" hits="42" />
            <Source label="Exa" hits="31" />
            <Source label="RAG" hits="118" />
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-ink-900 py-2.5 text-xs font-semibold text-bone hover:bg-ink-700"
          >
            {t('ai.inspect')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </button>
        </div>
      </div>

      <EvidenceSideSheet bundle={bundle} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Source({ label, hits }: { label: string; hits: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900 p-2 text-center">
      <div className="font-mono text-sm font-bold text-bone">{hits}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
        {label}
      </div>
    </div>
  );
}
