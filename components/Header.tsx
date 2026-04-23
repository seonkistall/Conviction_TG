'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useT } from '@/lib/i18n';
import { TimezoneCluster } from './TimezoneCluster';
import { ConnectModal } from './ConnectModal';

export function Header() {
  const t = useT();
  const path = usePathname();
  // v2.20-1: The Connect button had no onClick through v2.19 — same dead
  // CTA state the Hero had pre-v2.17. Now it surfaces a "sign-in coming
  // soon" modal with the roadmap (SSO + wallet + HOGC oracle) + a mailto
  // notify hook so evaluators see the intent without wondering why
  // nothing happened.
  const [connectOpen, setConnectOpen] = useState(false);

  // v2.21-7: Any component can open the Connect modal by dispatching
  // a `cv:connect:open` CustomEvent on window. Used by the Portfolio
  // page's demo Deposit/Withdraw CTAs so those buttons route into the
  // same "sign-in coming soon" surface as the Header button —
  // evaluators see one consistent expectation for money-movement.
  useEffect(() => {
    const onOpen = () => setConnectOpen(true);
    window.addEventListener('cv:connect:open', onOpen);
    return () => window.removeEventListener('cv:connect:open', onOpen);
  }, []);

  const NAV = [
    { label: t('nav.markets'), href: '/' },
    { label: t('nav.feed'), href: '/feed' },
    { label: t('nav.new'), href: '/markets/new' },
    { label: t('nav.methodology'), href: '/methodology' },
    { label: t('nav.leaderboard'), href: '/leaderboard' },
    { label: t('nav.portfolio'), href: '/portfolio' },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink-900/70 backdrop-blur-xl"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
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
          {/*
           * "Searchbar" is actually a button that opens the global
           * command palette (CommandPalette.tsx). We keep the search-
           * input aesthetic so users know it's searchable, but
           * clicking / tabbing into it dispatches a synthetic ⌘K event
           * so every entry point routes through one focus trap.
           */}
          {/*
           * v2.17 — Added a compact mobile/tablet search icon (<lg). The
           * full search bar only renders at lg+ (≥1024px) due to space
           * constraints, but through v2.16 sub-lg viewports had *no*
           * visible entry point into the command palette at all — ⌘K
           * was pure power-user lore you had to read the source to find.
           * Phones now see a 40x40 square icon button that dispatches
           * the same synthetic keydown.
           */}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true,
                })
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-ink-800 transition hover:border-white/20 lg:hidden"
            aria-label="Open search"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true,
                })
              )
            }
            className="hidden items-center gap-2 rounded-md border border-white/10 bg-ink-800 px-3 py-1.5 text-left transition hover:border-white/20 lg:flex"
            aria-label="Open search palette"
          >
            <SearchIcon />
            <span className="w-56 text-sm text-bone-muted/80 xl:w-72">
              {t('nav.search')}
            </span>
            <kbd className="rounded border border-white/10 px-1 text-[10px] text-bone-muted">
              ⌘K
            </kbd>
          </button>
          <TimezoneCluster />
          <button className="hidden items-center gap-2 rounded-md border border-white/10 bg-ink-800 px-3 py-1.5 text-sm text-bone hover:bg-ink-700 sm:flex">
            <span className="live-dot" />
            {t('nav.live')}
          </button>
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="rounded-md bg-volt px-4 py-1.5 text-sm font-semibold text-ink-900 transition hover:bg-volt-dark"
            aria-haspopup="dialog"
          >
            {t('nav.connect')}
          </button>
        </div>
      </div>
      <ConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} />
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
