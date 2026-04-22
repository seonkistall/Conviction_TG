import { ImageResponse } from 'next/og';
import { MARKETS, getMarket } from '@/lib/markets';

/**
 * Dynamic 1200x630 OG image for /markets/[id].
 *
 * Mirrors the narrative OG layout but foregrounded for a single market:
 * category pill, big title, YES probability, and edge/status.
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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 64,
          background:
            'linear-gradient(135deg, #0A0A0B 0%, #121318 50%, #1a1c24 100%)',
          color: '#F2EFE4',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 4,
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
              borderRadius: 999,
              color: '#F2EFE4',
              fontSize: 20,
              letterSpacing: 3,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {m.category} · {m.region}
          </div>
        </div>

        <div
          style={{
            marginTop: 56,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#F2EFE4',
              maxWidth: 1072,
            }}
          >
            {m.title.length > 110 ? m.title.slice(0, 107) + '…' : m.title}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 28,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 20,
                letterSpacing: 3,
                color: 'rgba(242, 239, 228, 0.55)',
                textTransform: 'uppercase',
              }}
            >
              YES
            </div>
            <div
              style={{
                fontSize: 104,
                fontWeight: 800,
                lineHeight: 1,
                color: '#C6FF3D',
                marginTop: 4,
              }}
            >
              {yesC}¢
            </div>
          </div>
          {edge !== null && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  letterSpacing: 3,
                  color: 'rgba(242, 239, 228, 0.55)',
                  textTransform: 'uppercase',
                }}
              >
                AI edge
              </div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  color: edge >= 0 ? '#53D866' : '#F04438',
                  marginTop: 4,
                }}
              >
                {edge >= 0 ? '+' : ''}
                {edge.toFixed(1)} pp
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
