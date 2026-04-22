import { ImageResponse } from 'next/og';
import { NARRATIVE_INDICES } from '@/lib/markets';

/**
 * Dynamic 1200x630 OG image for /narratives/[slug].
 *
 * Rendered at the edge via @vercel/og. Satori (the engine behind ImageResponse)
 * requires `display: "flex"` on every <div> that has more than one child, so
 * this component is written defensively: every wrapper div sets an explicit
 * flex display, and text content is always the sole child of its leaf node.
 */

export const runtime = 'edge';
export const alt = 'Conviction Narrative Index';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateImageMetadata() {
  return NARRATIVE_INDICES.map((n) => ({
    id: n.slug,
    alt: `${n.title} — Conviction Narrative Index`,
    size,
    contentType,
  }));
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export default async function Image({ params }: { params: { slug: string } }) {
  const nx = NARRATIVE_INDICES.find((n) => n.slug === params.slug);
  if (!nx) {
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

  const priceC = Math.round(nx.price * 100);
  const change = `${nx.change24h >= 0 ? '+' : ''}${nx.change24h.toFixed(2)}%`;
  const up = nx.change24h >= 0;
  const title = truncate(nx.title, 80);
  const blurb = truncate(nx.blurb, 108);

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
              border: '1.5px solid rgba(198,255,61,0.4)',
              background: 'rgba(198,255,61,0.08)',
              borderRadius: '999px',
              color: '#C6FF3D',
              fontSize: 20,
              letterSpacing: '3px',
              fontWeight: 600,
            }}
          >
            NARRATIVE INDEX · LIVE
          </div>
        </div>

        {/* Title block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '72px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              color: '#F2EFE4',
            }}
          >
            {nx.emoji} {title}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: 'rgba(242,239,228,0.65)',
              lineHeight: 1.3,
              marginTop: '20px',
              maxWidth: '1000px',
            }}
          >
            {blurb}
          </div>
        </div>

        {/* Spacer pushes price strip to the bottom */}
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
              Index price
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 88,
                fontWeight: 800,
                lineHeight: 1,
                color: '#F2EFE4',
                marginTop: '4px',
              }}
            >
              {`¢${priceC}`}
            </div>
          </div>
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
              24h
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 64,
                fontWeight: 700,
                color: up ? '#53D866' : '#F04438',
                marginTop: '4px',
              }}
            >
              {change}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
