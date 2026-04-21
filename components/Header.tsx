'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useT } from '@/lib/i18n';
import { LangToggle } from './LangToggle';

export function Header() {
  const t = useT();
  const path = usePathname();

  const NAV = [
    { label: t('nav.markets'), href: '/' },
    { label: t('nav.feed'), href: '/feed' },
    { label: t('nav.new'), href: '/markets/new' },
    { label: t('nav.leaderboard'), href: '/leaderboard' },
    { label: t('nav.portfolio'), href: '/portfolio' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-volt text-ink-900">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 L22 20 H2 Z" fill="currentColor" />
            </svg>
          </span>
          <span className="font-display text-2xl tracking-tightest">Conviction</span>
          <span className="ml-1 hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-bone-muted sm:inline-block">
            APAC · Beta
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active =
              n.href === '/'
                ? path === '/'
                : path === n.href || path.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition',
                  active
                    ? 'bg-white/10 text-bone'
                    : 'text-bone-muted hover:bg-white/5 hover:text-bone'
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-ink-800 px-3 py-1.5 lg:flex">
            <SearchIcon />
            <input
              placeholder={t('nav.search')}
              className="w-56 bg-transparent text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none xl:w-72"
            />
            <kbd className="rounded border border-white/10 px-1 text-[10px] text-bone-muted">/</kbd>
          </div>
          <LangToggle />
          <button className="hidden items-center gap-2 rounded-md border border-white/10 bg-ink-800 px-3 py-1.5 text-sm text-bone hover:bg-ink-700 sm:flex">
            <span className="live-dot" />
            {t('nav.live')}
          </button>
          <button className="rounded-md bg-volt px-4 py-1.5 text-sm font-semibold text-ink-900 transition hover:bg-volt-dark">
            {t('nav.connect')}
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-bone-muted">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
