'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { DEBUT_EVENTS, getMarket } from '@/lib/markets';
import { useT } from '@/lib/i18n';

const COMPANY_TINT: Record<string, string> = {
  HYBE: 'bg-[#7C5CFF]/15 text-conviction border-conviction/30',
  SM: 'bg-[#FF8AB4]/15 text-[#FF8AB4] border-[#FF8AB4]/30',
  YG: 'bg-[#000]/60 text-bone border-white/20',
  JYP: 'bg-[#C6FF3D]/15 text-volt border-volt/30',
  ADOR: 'bg-[#AFE1E8]/15 text-[#AFE1E8] border-[#AFE1E8]/30',
  Other: 'bg-white/5 text-bone-muted border-white/10',
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = d.toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
  return { day, month };
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(diff / 86_400_000));
}

export function DebutCalendar() {
  const t = useT();
  return (
    <section className="mx-auto max-w-[1440px] px-6 pt-16">
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FF8AB4]/30 bg-[#FF8AB4]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-[#FF8AB4]">
          K-Culture · Debut Radar
        </div>
        <h2 className="mt-3 font-display text-4xl text-bone md:text-5xl">
          {t('debut.title')}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-bone-muted">{t('debut.sub')}</p>
      </div>

      {/* Horizontal timeline */}
      <div className="relative -mx-6 overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4 px-6">
          {DEBUT_EVENTS.map((d) => {
            const { day, month } = fmtDate(d.dropsAt);
            const n = daysUntil(d.dropsAt);
            const linked = d.marketId ? getMarket(d.marketId) : null;
            return (
              <div
                key={d.id}
                className="relative w-[280px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-ink-800"
              >
                {/* Poster */}
                <div className="relative aspect-[4/5]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${d.poster})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-transparent" />

                  {/* Date chip (top left) */}
                  <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-white/15 bg-ink-900/70 backdrop-blur">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-bone-muted">
                      {month}
                    </span>
                    <span className="font-display text-xl font-bold leading-none text-bone">
                      {day}
                    </span>
                  </div>

                  {/* Company chip */}
                  <span
                    className={clsx(
                      'absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest backdrop-blur',
                      COMPANY_TINT[d.company] ?? COMPANY_TINT.Other
                    )}
                  >
                    {d.company}
                  </span>

                  {/* Countdown */}
                  <span className="absolute bottom-3 left-3 rounded-full bg-ink-900/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-bone backdrop-blur">
                    T−{n}d
                  </span>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="font-display text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                    {d.artist}
                  </div>
                  <h3 className="mt-1 line-clamp-2 font-display text-lg text-bone">
                    {d.title}
                  </h3>

                  {/* Heat bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest">
                      <span className="text-bone-muted">Anticipation</span>
                      <span className="font-mono text-bone">
                        {Math.round(d.heat * 100)}
                      </span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-ink-900">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${d.heat * 100}%`,
                          background:
                            'linear-gradient(90deg, #FF8AB4 0%, #7C5CFF 60%, #C6FF3D 100%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4">
                    {linked ? (
                      <Link
                        href={`/markets/${linked.slug}`}
                        className="flex items-center justify-between rounded-full bg-volt px-3 py-2 text-xs font-semibold text-ink-900 transition hover:bg-volt-dark"
                      >
                        <span>{t('debut.view_market')}</span>
                        <span className="font-mono">
                          ¢{Math.round(linked.yesProb * 100)}
                        </span>
                      </Link>
                    ) : (
                      <Link
                        href="/markets/new"
                        className="flex items-center justify-between rounded-full border border-white/10 bg-ink-900 px-3 py-2 text-xs font-semibold text-bone transition hover:bg-ink-700"
                      >
                        <span>{t('debut.create_market')}</span>
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
