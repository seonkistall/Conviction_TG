import { ImageResponse } from 'next/og';
import { MARKETS, getMarket } from '@/lib/markets';

/**
 * Dynamic 1200x630 OG image for /markets/[id].
 *
 * Mirrors the narrative OG layout — every wrapper div sets an explicit
 * flex display so Satori doesn't reject us with the multi-child rule.
 */

export const runtime = 'edge';
export const alt = 'Conviction Market';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateImageMetadata() {
  return MARKETS.map((m) => ({
    id: m.slug,
    alt: `${m.title} — Conviction market`,
    size,
    contentType,
  }));
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export default async function Image({ params }: { params: { id: string } }) {
  const m = getMarket(params.id);
  if (!m) {
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

  const yesC = Math.round(m.yesProb * 100);
  const edge = typeof m.edgePP === 'number' ? m.edgePP : null;
  const title = truncate(m.title, 108);
  const pill = `${m.category} · ${m.region}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px',
          background:
            'linear-gradient(135deg, #0A0A0B 0%, #121318 50%, #1a1c24 100%)',
          color: '#F2EFE4',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top row */}
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
              fontSize: 28,
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
              padding: '10px 20px',
              border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '999px',
              color: '#F2EFE4',
              fontSize: 18,
              letterSpacing: '3px',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {pill}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            marginTop: '72px',
            fontSize: 60,
            fontWeight: 800,
            lineHeight: 1.12,
            color: '#F2EFE4',
            maxWidth: '1072px',
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', flex: 1 }} />

        {/* Bottom strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                letterSpacing: '3px',
                color: 'rgba(242,239,228,0.55)',
                textTransform: 'uppercase',
              }}
            >
              YES
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 104,
                fontWeight: 800,
                lineHeight: 1,
                color: '#C6FF3D',
                marginTop: '4px',
              }}
            >
              {`${yesC}¢`}
            </div>
          </div>
          {edge !== null ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 20,
                  letterSpacing: '3px',
                  color: 'rgba(242,239,228,0.55)',
                  textTransform: 'uppercase',
                }}
              >
                AI edge
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 56,
                  fontWeight: 700,
                  color: edge >= 0 ? '#53D866' : '#F04438',
                  marginTop: '4px',
                }}
              >
                {`${edge >= 0 ? '+' : ''}${edge.toFixed(1)} pp`}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
