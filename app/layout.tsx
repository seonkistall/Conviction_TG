import type { Metadata } from 'next';
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
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
