'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { AI_TRADERS } from '@/lib/markets';
import { formatUSD, pct } from '@/lib/format';
import { useT } from '@/lib/i18n';

const MODEL_TINT: Record<string, string> = {
  'Conviction-v2': 'text-volt',
  'Allora-KR': 'text-conviction',
  'Qwen3-32B': 'text-[#FF8AB4]',
  'Sonnet-4.6': 'text-[#C47A00]',
};

export function AgenticTraders() {
  const t = useT();
  return (
    <section className="mx-auto max-w-[1440px] px-6 pt-16">
      <div className="mb-5 flex items-baseline justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-conviction/30 bg-conviction/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-conviction">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-conviction opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-conviction" />
            </span>
            Conviction × Allora
          </div>
          <h2 className="mt-3 font-display text-4xl text-bone md:text-5xl">
            {t('agentic.title')}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-bone-muted">
            {t('agentic.sub')}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {AI_TRADERS.map((a) => (
          <Link
            key={a.id}
            href={`/traders/${a.handle}`}
            className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-ink-800 p-5 transition hover:border-conviction/40 hover:bg-ink-700/60"
          >
            {a.live && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-yes-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yes">
                <span className="live-dot" style={{ width: 6, height: 6 }} />
                LIVE
              </span>
            )}
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900 text-2xl">
                {a.avatar}
              </span>
              <div>
                <div className="font-display text-xl text-bone group-hover:text-volt">@{a.handle}</div>
                <div className={clsx('font-mono text-[11px] font-semibold', MODEL_TINT[a.model])}>
                  {a.model}
                </div>
              </div>
            </div>
            <p className="mt-3 min-h-[40px] text-xs leading-relaxed text-bone-muted">
              {a.strategy}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <Mini k="P&L 30d" v={`+${formatUSD(a.pnl30d)}`} accent="text-volt" />
              <Mini k="Wins" v={pct(a.winRate)} />
              <Mini k={t('agentic.aum')} v={formatUSD(a.aum)} />
            </div>
            <div className="mt-4 w-full rounded-full border border-white/10 bg-ink-900 py-2 text-center text-xs font-semibold text-bone group-hover:bg-volt group-hover:text-ink-900">
              {t('agentic.follow')} · {a.followers.toLocaleString()}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Mini({ k, v, accent }: { k: string; v: string; accent?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-ink-900 p-2">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-bone-muted">
        {k}
      </div>
      <div
        className={clsx(
          'mt-1 font-mono text-[11px] font-bold tabular-nums',
          accent ?? 'text-bone'
        )}
      >
        {v}
      </div>
    </div>
  );
}
