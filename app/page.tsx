import { MARKETS, TRENDING_MARKETS, LIVE_MARKETS } from '@/lib/markets';
import { Hero } from '@/components/Hero';
import { FeedTeaser } from '@/components/FeedTeaser';
import { TrendingStrip } from '@/components/TrendingStrip';
import { CategoryTabs } from '@/components/CategoryTabs';
import { NarrativeIndices } from '@/components/NarrativeIndices';
import { AgenticTraders } from '@/components/AgenticTraders';
import { VibeMeter } from '@/components/VibeMeter';
import { DebutCalendar } from '@/components/DebutCalendar';
import { PermissionlessSection } from '@/components/PermissionlessSection';
import { HowItWorks } from '@/components/HowItWorks';
import { AllMarketsHeading } from '@/components/AllMarketsHeading';
import { LiveTicker } from '@/components/LiveTicker';

export default function LandingPage() {
  return (
    <>
      <LiveTicker markets={LIVE_MARKETS} />
      <Hero markets={MARKETS} />
      {/*
       * v2.29-1 — Feed teaser between Hero and TrendingStrip.
       *
       * Sits in the highest-attention slot below the fold so the
       * immersive feed (Conviction's distinctive product surface)
       * gets surfaced within 5 seconds of a first-time visitor's
       * scroll. Each mini-card deep-links via /feed?m=<slug> into
       * v2.28-3's warm-landing flow (auto-opens order sheet) — one-
       * tap path from "I just saw this on the homepage" to "I'm
       * looking at YES/NO on this market".
       */}
      <FeedTeaser markets={LIVE_MARKETS} />
      <TrendingStrip markets={TRENDING_MARKETS} />

      {/* Asia-native moats */}
      <NarrativeIndices />
      <AgenticTraders />
      <VibeMeter />
      <DebutCalendar />

      {/*
       * v2.21-4 — Permissionless creation as the 5th moat block.
       * Elevates the core differentiator (anyone proposes, AI
       * verifies) to a first-class landing section alongside the
       * other four Asia-native moats.
       */}
      <PermissionlessSection />

      {/* Evidence-graded — the Conviction thesis */}
      <HowItWorks />

      {/* Full catalog */}
      <AllMarketsHeading total={MARKETS.length} />
      <CategoryTabs markets={MARKETS} />

      <div className="h-16" />
    </>
  );
}
