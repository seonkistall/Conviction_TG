'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * v2.11 — Desktop left vertical nav for /feed (and future immersive
 * surfaces).
 *
 * Dev feedback #4: "웹버전에서는 feed에서도 틱톡처럼 세로형 숏츠 기반으로
 * 하고 네비게이션 바도 세로로 두면 어떨까 해요. 노트북 양쪽으로 커서를
 * 왔다갔다하니 조금 어려운 느낌."
 *
 * On non-immersive routes, the site uses a top Header (nav bar, search,
 * clock cluster, Connect button). On /feed we hide Header entirely — the
 * card owns the viewport — but the user still needs a way to navigate.
 * This SideRail is the desktop answer:
 *   - Fixed 72px column on the left edge, 100dvh.
 *   - Icon + micro-label buttons (Home, Feed, Markets, Ranks, AI/Methodology).
 *   - Active item gets the volt treatment; others are muted bone on hover.
 *
 * Hidden on mobile via `hidden md:flex`. Mobile /feed keeps the full
 * immersion we locked in at v2.10 (no chrome, pure shorts). This rail is
 * specifically for the laptop problem — desktop was forcing the cursor
 * to sweep the full viewport width to click a top nav item.
 *
 * Home link appends `?desktop=1` so clicking Home from /feed on a desktop
 * user (who bypasses the mobile→/feed middleware by UA anyway) is an
 * explicit, query-tagged request for the landing page. It also means the
 * Home link works identically in a mobile-emulation dev tool without
 * trapping the user in a /feed → / → /feed redirect loop.
 */
export function SideRail() {
  const path = usePathname() ?? '/';

  const items: Array<{
    href: string;
    label: string;
    match: (p: string) => boolean;
    icon: React.ReactNode;
  }> = [
    {
      href: '/?desktop=1',
      label: 'Home',
      match: (p) => p === '/',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12 12 3l9 9" />
          <path d="M5 10v10h14V10" />
        </svg>
      ),
    },
    {
      href: '/feed',
      label: 'Feed',
      match: (p) => p === '/feed' || p.startsWith('/feed/'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="6 4 20 12 6 20 6 4" />
        </svg>
      ),
    },
    {
      href: '/markets/new',
      label: 'Propose',
      match: (p) => p.startsWith('/markets/new'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
    },
    {
      href: '/leaderboard',
      label: 'Ranks',
      match: (p) => p.startsWith('/leaderboard') || p.startsWith('/traders'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21V10" />
          <path d="M12 21V4" />
          <path d="M16 21V14" />
          <path d="M4 21h16" />
        </svg>
      ),
    },
    {
      href: '/methodology',
      label: 'AI',
      match: (p) => p.startsWith('/methodology'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M4 12H2M22 12h-2M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83" />
        </svg>
      ),
    },
    {
      href: '/portfolio',
      label: 'Book',
      match: (p) => p.startsWith('/portfolio') || p.startsWith('/parlays'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="14" rx="2.5" />
          <path d="M3 10h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed left-0 top-0 z-40 hidden h-[100dvh] w-[72px] flex-col items-center border-r border-white/10 bg-ink-900/80 px-2 py-4 backdrop-blur-xl md:flex"
      aria-label="Primary desktop"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
    >
      <Link
        href="/?desktop=1"
        className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-volt text-ink-900 transition hover:brightness-110"
        aria-label="Conviction home"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L22 20 H2 Z" />
        </svg>
      </Link>

      <ul className="flex w-full flex-col gap-1">
        {items.map((it) => {
          const active = it.match(path);
          return (
            <li key={it.href} className="flex justify-center">
              <Link
                href={it.href}
                className={clsx(
                  'flex w-full flex-col items-center gap-1 rounded-lg py-2 transition',
                  active
                    ? 'bg-white/10 text-volt'
                    : 'text-bone-muted hover:bg-white/5 hover:text-bone'
                )}
              >
                {it.icon}
                <span className="text-[9px] font-semibold uppercase tracking-widest">
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={["mt-auto flex w-full flex-col gap-2 pb-2", path.includes("/feed") ? "items-center" : "items-start"].join(" ")}>
        <button
          type="button"
          className={
            ["rounded-md bg-volt px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-900 transition hover:bg-volt-dark",
            path.includes("/feed") ? "[writing-mode:vertical-rl] [text-orientation:upright] w-8" : "w-auto"].join(" ")
          }
        >
          Connect
        </button>
      </div>
    </nav>
  );
}
