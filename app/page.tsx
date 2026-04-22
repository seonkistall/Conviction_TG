import { MARKETS, TRENDING_MARKETS, LIVE_MARKETS } from '@/lib/markets';
import { Hero } from '@/components/Hero';
import { TrendingStrip } from '@/components/TrendingStrip';
import { CategoryTabs } from '@/components/CategoryTabs';
import { NarrativeIndices } from '@/components/NarrativeIndices';
import { AgenticTraders } from '@/components/AgenticTraders';
import { VibeMeter } from '@/components/VibeMeter';
import { DebutCalendar } from '@/components/DebutCalendar';
import { HowItWorks } from '@/components/HowItWorks';
import { AllMarketsHeading } from '@/components/AllMarketsHeading';
import { LiveTicker } from '@/components/LiveTicker';

export default function LandingPage() {
  return (
    <>
      <LiveTicker markets={LIVE_MARKETS} />
      <Hero markets={MARKETS} />
      <TrendingStrip markets={TRENDING_MARKETS} />

      {/* Asia-native moats */}
      <NarrativeIndices />
      <AgenticTraders />
      <VibeMeter />
      <DebutCalendar />

      {/* Evidence-graded — the Conviction thesis */}
      <HowItWorks />

      {/* Full catalog */}
      <AllMarketsHeading total={MARKETS.length} />
      <CategoryTabs markets={MARKETS} />

      <div className="h-16" />
    </>
  );
}
