'use client';

import { useT } from '@/lib/i18n';

export function HowItWorks() {
  const t = useT();
  return (
    <section id="how" className="mx-auto max-w-[1440px] px-6 pt-16 sm:pt-20">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 className="display-xl text-4xl text-bone sm:text-5xl md:text-6xl">
            {t('hp.how_h')}
            <br />
            <span className="italic text-volt">{t('hp.how_h2')}</span>
          </h2>
        </div>
        <div className="md:col-span-8">
          <div className="grid gap-6 md:grid-cols-3">
            <Step n="01" title={t('hp.step_1_t')} desc={t('hp.step_1_d')} />
            <Step n="02" title={t('hp.step_2_t')} desc={t('hp.step_2_d')} />
            <Step n="03" title={t('hp.step_3_t')} desc={t('hp.step_3_d')} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800 p-6">
      <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-volt">
        {n}
      </div>
      <h3 className="mt-3 font-display text-2xl text-bone">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-bone-muted">{desc}</p>
    </div>
  );
}
