import type { Metadata, Viewport } from 'next';
import {
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
} from 'next/font/google';
import './globals.css';
import { ChromeShell } from '@/components/ChromeShell';
import { I18nProvider } from '@/lib/i18n';
import { MuteProvider } from '@/lib/mute';
import { PositionsProvider } from '@/lib/positions';
import { ToastProvider } from '@/lib/toast';
import { LivePricesProvider } from '@/lib/livePrices';
import { Toaster } from '@/components/Toaster';
import { GlobalMuteFAB } from '@/components/GlobalMuteFAB';
import { OnboardingIntro } from '@/components/OnboardingIntro';
import { CommandPalette } from '@/components/CommandPalette';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Self-hosted font loading via next/font/google.
 *
 * Benefits over the previous <link> CDN approach:
 *  - Fonts served from our own origin → zero external DNS/TLS cost per visitor
 *  - Automatic subsetting (latin + CJK) → smaller payload than the raw CSS2 URL
 *  - Zero layout shift: next/font inlines the size-adjusted fallback metrics
 *  - No render-blocking <link>; Next injects the @font-face CSS at build time
 *  - `display: swap` keeps text visible during font load
 *
 * Each font exposes a `.variable` class that sets a CSS custom property on the
 * root element. globals.css then composes the fallback stack using those vars.
 */

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

/*
 * v2.27-4 — Removed all 6 Noto CJK fonts (Sans/Serif × KR/SC/JP).
 *
 * The previous setup loaded Noto Sans/Serif KR + SC + JP at 4 weights
 * each from Google Fonts via `next/font/google`. Even with
 * `preload: false`, the Next bundler emitted 33 woff2 files totaling
 * ~1055KB on the landing page — a ~36% chunk of the entire 2.9MB
 * payload. Lighthouse scored that as a pure-bytes loss.
 *
 * The reason: globals.css listed every Noto variant in `--font-sans`,
 * `--font-display`, and `--font-mono` fallback chains. Browsers
 * eagerly preload fonts that match the active font-family, so the
 * Noto files loaded on every visit even when no CJK glyph appeared.
 *
 * Trade-off: Korean / Japanese / Chinese rendering. macOS, iOS,
 * Windows 10+, modern Android, and ChromeOS all ship with bundled
 * CJK system fonts (Apple SD Gothic Neo / Yu Gothic / Source Han / etc).
 * The `system-ui, -apple-system` fallback in globals.css covers
 * those without us having to ship a 1MB font payload.
 *
 * Kept: Inter (latin), Instrument Serif (latin), JetBrains Mono
 * (latin). All used heavily on every page.
 */
const fontVariables = [
  inter.variable,
  instrumentSerif.variable,
  jetbrainsMono.variable,
].join(' ');

const SITE_URL = 'https://conviction-fe.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Conviction — APAC Prediction Markets',
  // v2.17 — metadata description was K-heavy ("culture, sports, K-pop,
  // esports"). Rewrote to name the full APAC surface explicitly so
  // search snippets and LinkedIn previews read as region-wide, not a
  // Korea-only product.
  description:
    'The first APAC-native, AI-powered prediction market. Trade every Asian narrative — K-pop, anime, LCK · LPL, NPB, Bollywood, BTC at the Tokyo open — priced in ¢ and graded by a 23-source evidence swarm.',
  openGraph: {
    title: 'Conviction — APAC Prediction Markets',
    description:
      'Trade conviction on the moments that move APAC. Priced by AI, graded by a 23-source evidence swarm.',
    url: SITE_URL,
    siteName: 'Conviction',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Conviction — APAC-native prediction markets, priced by AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conviction — APAC Prediction Markets',
    description:
      'Trade conviction on the moments that move APAC. Priced by AI, graded by a 23-source evidence swarm.',
    images: ['/og-image.png'],
  },
};

/**
 * Explicit viewport export (Next 14+ metadata API). Using `viewport-fit=cover`
 * so the page can opt into iPhone safe-area inset padding where needed, and
 * pinning initialScale=1 + maximumScale=5 to prevent mobile Safari from
 * auto-zooming on input focus while still allowing user pinch-zoom up to 5x.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#05060A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        {/*
          Preconnect hints for video infrastructure. Each card's poster + iframe
          hits i.ytimg.com (poster CDN) and youtube-nocookie.com (embed origin);
          opening those TLS connections in parallel with HTML parse cuts ~200ms
          off the first video paint on 4G.
        */}
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link
          rel="preconnect"
          href="https://www.youtube-nocookie.com"
          crossOrigin=""
        />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
      </head>
      <body className="min-h-screen bg-ink-900 text-bone antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <I18nProvider>
          <MuteProvider>
            <ToastProvider>
              <PositionsProvider>
                {/*
                 * v2.22-1 — ParlayProvider + <ParlaySlip/> removed.
                 *
                 * Parlay was confusing users in discovery ("what is this?
                 * why do I need to stack?") and diluting the product's
                 * Polymarket-style direct-trade positioning. The whole
                 * surface is gone: provider, store, FAB drawer, portfolio
                 * tickets section, /parlays/[id] receipt page, feed
                 * swipe-right and double-tap-adds-leg gestures. Direct
                 * trade (OrderBook on market detail + QuickBet on cards)
                 * is now the only path to a position.
                 *
                 * LivePricesProvider ticks market prices client-side so
                 * the UI feels alive. Inside PositionsProvider (so a
                 * settled fill stays visible while the ticker keeps
                 * moving) and outside ChromeShell (so every page
                 * inherits the same live map).
                 */}
                <LivePricesProvider>
                  {/*
                   * ChromeShell renders Header/Footer/MobileNav + the <main>
                   * padding — but skips all of it on /feed so that the
                   * TikTok-style immersive feed gets a true 100dvh canvas.
                   * See components/ChromeShell.tsx for rationale.
                   */}
                  <ChromeShell>{children}</ChromeShell>
                  {/* Floating overlays kept mounted across routes so
                      they still work on the immersive /feed shell. */}
                  <GlobalMuteFAB />
                  <OnboardingIntro />
                  <CommandPalette />
                  <Toaster />
                </LivePricesProvider>
              </PositionsProvider>
            </ToastProvider>
          </MuteProvider>
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
