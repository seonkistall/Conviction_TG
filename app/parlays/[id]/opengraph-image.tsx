import { ImageResponse } from 'next/og';
import { getMarket } from '@/lib/markets';
import { decodeSharedParlay, computePayout } from '@/lib/parlayShare';

/**
 * Dynamic 1200x630 OG card for /parlays/[id].
 *
 * Reads the same `?d=` payload the page reads, hydrates the legs, and
 * renders a payout-forward card. Edge runtime — Satori needs every
 * wrapper div to set an explicit flex display.
 */

export const runtime = 'edge';
// v2.13: Explicit ISR. Payload is ?d=-encoded so the image is effectively
// content-addressed, but an hourly revalidate still lets us roll branding
// changes (logo, tint) out without a redeploy of static OGs.
export const revalidate = 3600;
export const alt = 'Conviction Parlay';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function formatUSDLocal(n: number): string {
  if (n >= 1000) {
    return `$${(Math.round(n * 10) / 10).toLocaleString('en-US')}`;
  }
  return `$${n.toFixed(2)}`;
}

export default async function Image({
  searchParams,
}: {
  params: { id: string };
  searchParams?: { d?: string };
}) {
  const encoded = searchParams?.d;
  const p = encoded ? decodeSharedParlay(encoded) : null;

  if (!p) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0A0A0B',
            color: '#F2EFE4',
            fontSize: 64,
            fontFamily: 'sans-serif',
          }}
        >
          Conviction
        </div>
      ),
      { ...size }
    );
  }

  const { multiplier, maxPayout, impliedProb } = computePayout(p);
  const previewLegs = p.legs.slice(0, 3).map((leg) => {
    const m = getMarket(leg.marketId);
    const label =
      m?.kind === 'multi'
        ? m.outcomes?.find((o) => o.id === leg.pick)?.label ?? leg.pick
        : leg.pick;
    return {
      title: truncate(m?.title ?? leg.marketId, 64),
      label,
      cents: Math.round(leg.price * 100),
      isYes: leg.pick === 'YES',
      isNo: leg.pick === 'NO',
    };
  });
  const remaining = Math.max(0, p.legs.length - previewLegs.length);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '56px',
          background:
            'linear-gradient(135deg, #0A0A0B 0%, #121318 50%, #1a1c24 100%)',
          color: '#F2EFE4',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top row: brand + ticket meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '4px',
              color: '#C6FF3D',
            }}
          >
            CONVICTION
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 18px',
              border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '999px',
              color: '#F2EFE4',
              fontSize: 16,
              letterSpacing: '3px',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {`${p.legs.length}-LEG PARLAY`}
          </div>
        </div>

        {/* Hero payout */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '36px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: '4px',
              color: 'rgba(242,239,228,0.55)',
              textTransform: 'uppercase',
            }}
          >
            Max payout
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '24px',
              marginTop: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 130,
                fontWeight: 800,
                lineHeight: 1,
                color: '#C6FF3D',
              }}
            >
              {formatUSDLocal(maxPayout)}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 56,
                fontWeight: 700,
                color: '#F2EFE4',
              }}
            >
              {`${multiplier.toFixed(2)}×`}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: 'rgba(242,239,228,0.55)',
              marginTop: '4px',
            }}
          >
            {`on ${formatUSDLocal(p.stake)} stake · implied ${(
              impliedProb * 100
            ).toFixed(1)}%`}
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1 }} />

        {/* Legs preview */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px',
          }}
        >
          {previewLegs.map((leg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: 22,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  background: leg.isYes
                    ? 'rgba(83,216,102,0.15)'
                    : leg.isNo
                    ? 'rgba(240,68,56,0.15)'
                    : 'rgba(155,109,255,0.18)',
                  color: leg.isYes ? '#53D866' : leg.isNo ? '#F04438' : '#B89BFF',
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  minWidth: '54px',
                }}
              >
                {leg.label}
              </div>
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  color: '#F2EFE4',
                  fontWeight: 500,
                }}
              >
                {leg.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'monospace',
                  color: 'rgba(242,239,228,0.7)',
                  fontWeight: 700,
                }}
              >
                {`¢${leg.cents}`}
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <div
              style={{
                display: 'flex',
                fontSize: 18,
                color: 'rgba(242,239,228,0.45)',
                paddingLeft: '4px',
              }}
            >
              {`+${remaining} more legs`}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
