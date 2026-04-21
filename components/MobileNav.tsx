'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n';

type Item = {
  href: string;
  label: string;
  active: (pathname: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
  cta?: boolean;
};

export function MobileNav() {
  const pathname = usePathname() ?? '/';
  const t = useT();

  const items: Item[] = [
    {
      href: '/',
      label: t('mobnav.markets'),
      active: (p) => p === '/' || p.startsWith('/markets/') && p !== '/markets/new',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="7" height="7" rx="1.5" />
          <rect x="14" y="4" width="7" height="7" rx="1.5" />
          <rect x="3" y="13" width="7" height="7" rx="1.5" />
          <rect x="14" y="13" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      href: '/feed',
      label: t('mobnav.feed'),
      active: (p) => p.startsWith('/feed'),
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="6 4 20 12 6 20 6 4" fill={active ? 'currentColor' : 'none'} />
        </svg>
      ),
    },
    {
      href: '/markets/new',
      label: t('mobnav.propose'),
      active: (p) => p.startsWith('/markets/new'),
      cta: true,
      icon: () => (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
    },
    {
      href: '/portfolio',
      label: t('mobnav.portfolio'),
      active: (p) => p.startsWith('/portfolio'),
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="14" rx="2.5" />
          <path d="M3 10h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
    },
    {
      href: '/leaderboard',
      label: t('mobnav.leaderboard'),
      active: (p) => p.startsWith('/leaderboard') || p.startsWith('/traders'),
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21V10" />
          <path d="M12 21V4" />
          <path d="M16 21V14" />
          <path d="M4 21h16" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink-900/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary mobile"
    >
      <ul className="grid grid-cols-5 px-1 pb-1 pt-1.5">
        {items.map((it) => {
          const active = it.active(pathname);
          if (it.cta) {
            return (
              <li key={it.href} className="flex items-center justify-center">
                <Link
                  href={it.href}
                  className="flex h-11 w-11 -translate-y-2 items-center justify-center rounded-full bg-gradient-to-br from-volt to-volt-dark text-ink-900 shadow-lg shadow-volt/30"
                  aria-label={it.label}
                >
                  {it.icon(active)}
                </Link>
              </li>
            );
          }
          return (
            <li key={it.href} className="flex items-center justify-center">
              <Link
                href={it.href}
                className={clsx(
                  'flex w-full flex-col items-center gap-0.5 py-1 text-[10px] font-semibold uppercase tracking-widest transition',
                  active ? 'text-volt' : 'text-bone-muted hover:text-bone'
                )}
              >
                {it.icon(active)}
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
