'use client';

/**
 * v2.28 — Market detail sticky Buy CTA via TG MainButton (Phase 2, F-02).
 *
 * Smoketest finding: opening any market in the TG Mini App, no Buy
 * YES/NO call-to-action was visible above the fold. The OrderBook
 * lives in the right rail and on mobile slides below the chart, so
 * the 30-second VC wow path collapsed at "where do I bet?".
 *
 * This component, mounted on every market detail page, hijacks TG's
 * MainButton in favour of "Buy YES ¢41" (or NO if the market's NO
 * side is hotter / cheaper). Tap → TgBuySheet bottom sheet with the
 * bet flow. Outside Telegram the component renders nothing — desktop
 * users see the existing OrderBook unchanged.
 *
 * Side-pick heuristic: lead with YES unless the market is clearly
 * leaning NO (yesProb < 0.40). Either way the sheet lets the user
 * flip with one tap, so a "wrong" lead costs at most a single tap.
 */

import { useEffect, useState } from 'react';
import { useTgMainButton } from '@/lib/tgMainButton';
import { isInTelegram } from '@/lib/tgWebApp';
import * as haptics from '@/lib/haptics';
import { TgBuySheet } from './TgBuySheet';

interface Props {
  marketId: string;
  marketTitle: string;
  yesProb: number;
  resolved: boolean;
}

export function MarketTgBuyButton({
  marketId,
  marketTitle,
  yesProb,
  resolved,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  // Mounted client-side only check. `isInTelegram()` is correct on
  // first render only inside TG, but we want this component to mount
  // unconditionally and decide at effect time so SSR markup matches.
  const [inTg, setInTg] = useState(false);

  useEffect(() => {
    setInTg(isInTelegram());
  }, []);

  const initialSide: 'YES' | 'NO' = yesProb < 0.4 ? 'NO' : 'YES';
  const initialPrice =
    initialSide === 'YES' ? yesProb : 1 - yesProb;
  const cents = Math.round(initialPrice * 100);

  // Show MainButton when not in a sheet and not resolved. The sheet
  // takes over MainButton via its own useTgMainButton when open.
  useTgMainButton(
    inTg && !sheetOpen && !resolved
      ? {
          text: `Buy ${initialSide} ¢${cents}`,
          onClick: () => {
            haptics.tap();
            setSheetOpen(true);
          },
          color: initialSide === 'YES' ? '#33D17A' : '#F66565',
          textColor: '#05060A',
        }
      : null
  );

  // Resolved markets: the TG MainButton goes inert. We don't show a
  // disabled "Trading closed" button because TG renders disabled
  // MainButtons in a confusing dim grey that reads as "broken".
  if (!inTg) return null;

  return (
    <TgBuySheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      initialSide={initialSide}
      yesProb={yesProb}
      marketId={marketId}
      marketTitle={marketTitle}
      resolved={resolved}
    />
  );
}
