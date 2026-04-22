import { ImageResponse } from 'next/og';
import { NARRATIVE_INDICES } from '@/lib/markets';

/**
 * Dynamic 1200x630 OG image for /narratives/[slug].
 *
 * Rendered at the edge via @vercel/og (re-exported from next/og). The image
 * is baked at build time for every slug in generateImageMetadata, so there's
 * zero runtime cost.
 *
 * Design goals:
 *   - Brand-consistent (volt accent on deep ink background, display serif title)
 *   - Readable at small thumbnail sizes (Twitter card, Slack unfurl)
 *   - Shows enough signal (price, 24h, emoji) that a reader can tell which
 *     narrative is trading at a glance.
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

export default async function Image({ params }: { params: { slug: string } }) {
  const nx = NARRATIVE_INDICES.find((n) => n.slug === params.slug);
  if (!nx) {
    // Fallback so static build still succeeds for any stale slug.
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

  const priceC = Math.round(nx.price * 100);
  const change = `${nx.change24h >= 0 ? '+' : ''}${nx.change24h.toFixed(2)}%`;
  const up = nx.change24h >= 0;

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
        {/* Top row: brand + pill */}
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
              border: '1.5px solid rgba(198, 255, 61, 0.4)',
              background: 'rgba(198, 255, 61, 0.08)',
              borderRadius: 999,
              color: '#C6FF3D',
              fontSize: 20,
              letterSpacing: 3,
              fontWeight: 600,
            }}
          >
            NARRATIVE INDEX · LIVE
          </div>
        </div>

        {/* Middle: emoji + title */}
        <div
          style={{
            marginTop: 56,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 24,
          }}
        >
          <div style={{ fontSize: 108, lineHeight: 1 }}>{nx.emoji}</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1.05,
                color: '#F2EFE4',
              }}
            >
              {nx.title}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 28,
                color: 'rgba(242, 239, 228, 0.65)',
                lineHeight: 1.3,
                maxWidth: 900,
              }}
            >
              {nx.blurb.length > 110 ? nx.blurb.slice(0, 107) + '…' : nx.blurb}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ display: 'flex', flexGrow: 1 }} />

        {/* Bottom: price strip */}
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
              Index price
            </div>
            <div
              style={{
                fontSize: 88,
                fontWeight: 800,
                lineHeight: 1,
                color: '#F2EFE4',
                marginTop: 4,
              }}
            >
              ¢{priceC}
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
                fontSize: 20,
                letterSpacing: 3,
                color: 'rgba(242, 239, 228, 0.55)',
                textTransform: 'uppercase',
              }}
            >
              24h
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: up ? '#53D866' : '#F04438',
                marginTop: 4,
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
