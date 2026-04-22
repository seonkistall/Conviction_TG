import type { Metadata } from 'next';
import {
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
  Noto_Sans_KR,
  Noto_Sans_SC,
  Noto_Sans_JP,
  Noto_Serif_KR,
  Noto_Serif_SC,
  Noto_Serif_JP,
} from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { I18nProvider } from '@/lib/i18n';
import { MuteProvider } from '@/lib/mute';
import { ParlayProvider } from '@/lib/parlay';
import { ParlaySlip } from '@/components/ParlaySlip';
import { GlobalMuteFAB } from '@/components/GlobalMuteFAB';
import { MobileNav } from '@/components/MobileNav';
import { OnboardingIntro } from '@/components/OnboardingIntro';
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

// Korean — use `preload: false` for CJK because each subset is large and we
// want the browser to only fetch them when a Korean glyph is actually painted.
const notoSansKR = Noto_Sans_KR({
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
  preload: false,
});

// Simplified Chinese
const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: false,
});

// Japanese
const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
});

const notoSerifKR = Noto_Serif_KR({
  weight: ['400', '700'],
  variable: '--font-noto-serif-kr',
  display: 'swap',
  preload: false,
});

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
});

const notoSerifJP = Noto_Serif_JP({
  weight: ['400', '700'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
  preload: false,
});

const fontVariables = [
  inter.variable,
  instrumentSerif.variable,
  jetbrainsMono.variable,
  notoSansKR.variable,
  notoSansSC.variable,
  notoSansJP.variable,
  notoSerifKR.variable,
  notoSerifSC.variable,
  notoSerifJP.variable,
].join(' ');

const SITE_URL = 'https://conviction-fe.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Conviction — Asia Native Prediction Markets',
  description:
    'The first Asia-native, AI-powered prediction market. Bet on culture, sports, K-pop, esports, and every APAC narrative before it trends. Vertical-first feed, agentic traders, evidence-graded oracle.',
  openGraph: {
    title: 'Conviction — Asia Native Prediction Markets',
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
        alt: 'Conviction — Asia-native prediction markets, priced by AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conviction — Asia Native Prediction Markets',
    description:
      'Trade conviction on the moments that move APAC. Priced by AI, graded by a 23-source evidence swarm.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-ink-900 text-bone antialiased">
        <I18nProvider>
          <MuteProvider>
            <ParlayProvider>
              <Header />
              <main className="pt-16 pb-24 md:pb-0">{children}</main>
              <Footer />
              <ParlaySlip />
              <GlobalMuteFAB />
              <MobileNav />
              <OnboardingIntro />
            </ParlayProvider>
          </MuteProvider>
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
