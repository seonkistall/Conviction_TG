'use client';

import clsx from 'clsx';
import { useI18n } from '@/lib/i18n';

export function LangToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-white/10 bg-ink-800 p-0.5 text-[11px] font-semibold">
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={clsx(
          'rounded-full px-2.5 py-1 transition',
          locale === 'en' ? 'bg-white/10 text-bone' : 'text-bone-muted hover:text-bone'
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('ko')}
        className={clsx(
          'rounded-full px-2.5 py-1 transition',
          locale === 'ko' ? 'bg-white/10 text-bone' : 'text-bone-muted hover:text-bone'
        )}
      >
        KO
      </button>
    </div>
  );
}
