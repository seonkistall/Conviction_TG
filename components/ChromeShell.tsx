'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { SideRail } from './SideRail';

/**
 * v2.10 — Pathname-aware site chrome shell.
 * v2.11 — Added SideRail for desktop /feed.
 *
 * `/feed` is an immersive, TikTok-style surface: each card is a full-bleed
 * 100dvh video with tap/double-tap/swipe gestures. The global site chrome
 * (fixed Header 64px, mobile bottom-nav ~80px, Footer) was hiding real video
 * area AND colliding with Samsung Internet / Chrome Mobile browser chrome
 * bars, producing a visually "pushed down" experience on tall Android
 * portrait viewports (Galaxy S25 Ultra class, aspect ~0.45).
 *
 * On any /feed route we:
 *   - Skip rendering Header, Footer, and mobile bottom-nav.
 *   - Drop the `<main>` top/bottom padding that exists solely to make room
 *     for the two fixed chrome bars. Feed cards snap into the full dvh.
 *   - On desktop (md+), render the left vertical SideRail (72px) so the
 *     user can still navigate without the top Header. Mobile keeps full
 *     immersion because SideRail internally uses `hidden md:flex`.
 *   - Offset `<main>` by 72px on the left on desktop immersive routes so
 *     feed cards don't render under the rail.
 *
 * v2.22-1: ParlaySlip reference removed along with the rest of parlay.
 *
 * Detail pages like `/feed/market-slug` don't exist yet, but if they do
 * later we match on `/feed` exactly + prefix to stay forward-compatible.
 */
export function ChromeShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? '/';
  const immersive = path === '/feed' || path.startsWith('/feed/');

  return (
    <>
      {!immersive && <Header />}
      {immersive && <SideRail />}
      <main
        id="main-content"
        tabIndex={-1}
        className={
          immersive
            ? 'md:pl-[72px]' // desktop rail width offset; mobile gets nothing
            : 'pt-16 pb-24 md:pb-0'
        }
      >
        {children}
      </main>
      {!immersive && <Footer />}
      {!immersive && <MobileNav />}
    </>
  );
}
