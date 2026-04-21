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

export const metadata: Metadata = {
  title: 'Conviction — Asia Native Prediction Markets',
  description:
    'The first Asia-native, AI-powered prediction market. Bet on culture, sports, K-pop, esports, and every APAC narrative before it trends. Vertical-first feed, agentic traders, evidence-graded oracle.',
  openGraph: {
    title: 'Conviction — Asia Native Prediction Markets',
    description: 'Trade conviction on the moments that matter.',
    type: 'website',
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
      </body>
    </html>
  );
}
