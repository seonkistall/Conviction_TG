import { ImageResponse } from 'next/og';
import { getMarket } from '@/lib/markets';
import {
  decodeSharePayload,
  pnlFromPayload,
  tokenFingerprint,
} from '@/lib/shareToken';

/**
 * v2.29-4 — Instagram / Threads / Square share image (1080×1080).
 *
 * Why a separate route from opengraph-image.tsx?
 * ----------------------------------------------
 * X / LinkedIn / Slack / KakaoTalk / iMessage all scrape the standard
 * 1.91:1 og:image. Instagram and Threads, however, don't scrape OG —
 * the user uploads an image directly when they post. They live in a
 * 1:1 (feed) or 4:5 (portrait) world. Trying to force the 1200×630
 * layout into 1:1 produces dead vertical space and a tiny P&L number.
 *
 * Layout strategy
 * ---------------
 * Mirrors the proven flat structure of opengraph-image.tsx. We avoid
 * Satori's nested-flex pitfalls (`alignItems: center` on a parent
 * with `width: 100%` children silently dropping siblings, observed
 * during v2.29-4 development) by keeping every row a direct child
 * of the outer flex column with `marginTop` for vertical spacing.
 * `display: flex` on every wrapper to satisfy Satori's multi-child
 * rule, no external fonts, no Unicode emoji.
 */

export const runtime = 'edge';
export const revalidate = 3600;

const SIZE = 1080;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const payload = decodeSharePayload(params.token);
  if (!payload) {
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
            color: '#C6FF3D',
            fontSize: 96,
            fontFamily: 'sans-serif',
            fontWeight: 800,
            letterSpacing: 8,
          }}
        >
          CONVICTION
        </div>
      ),
      { width: SIZE, height: SIZE }
    );
  }

  const m = getMarket(payload.m);
  const { pnlUsd, pnlPct } = pnlFromPayload(payload);
  const isWin = pnlUsd >= 0;
  const sign = isWin ? '+' : '-';
  const winColor = '#C6FF3D';
  const loseColor = '#F04438';
  const pnlColor = isWin ? winColor : loseColor;
  const handle = payload.h ? `@${payload.h}` : '@trader';
  const title = m ? truncate(m.title, 90) : 'A market on Conviction';
  const sideLabel = payload.s.toUpperCase();
  const fingerprint = tokenFingerprint(params.token);
  const isTip = payload.k === 'tip' || payload.sh === 0;
  const stanceCents = Math.round(payload.cp * 100);
  const aiConf = m ? Math.round(m.aiConfidence * 100) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px',
          background:
            'linear-gradient(160deg, #05060A 0%, #0F1018 50%, #1a1c24 100%)',
          color: '#F2EFE4',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Ambient blob */}
        <div
          style={{
            position: 'absolute',
            right: '-220px',
            top: '-220px',
            width: '900px',
            height: '900px',
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${
              isWin ? 'rgba(198,255,61,0.20)' : 'rgba(240,68,56,0.20)'
            }, rgba(0,0,0,0))`,
            display: 'flex',
          }}
        />

        {/* Brand strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#C6FF3D',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '11px solid transparent',
                  borderRight: '11px solid transparent',
                  borderBottom: '17px solid #05060A',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '5px',
                color: '#C6FF3D',
              }}
            >
              CONVICTION
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 16,
                letterSpacing: '3px',
                fontWeight: 700,
                color: '#C6FF3D',
              }}
            >
              VERIFIED
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'monospace',
                fontSize: 20,
                fontWeight: 600,
                color: 'rgba(242,239,228,0.85)',
                background: 'rgba(198,255,61,0.10)',
                padding: '4px 12px',
                borderRadius: '6px',
                letterSpacing: '1px',
              }}
            >
              {fingerprint}
            </div>
          </div>
        </div>

        {/* Hero block — flat siblings of outer column. */}
        <div
          style={{
            display: 'flex',
            marginTop: '120px',
            fontSize: 28,
            fontWeight: 600,
            color: 'rgba(242,239,228,0.7)',
            letterSpacing: '2px',
          }}
        >
          {isTip
            ? `${handle} · ENDORSES`
            : `${handle} · ${sideLabel} · ${payload.sh.toLocaleString()} shares`}
        </div>

        {isTip ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '24px',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 168,
                fontWeight: 800,
                lineHeight: 1,
                color: payload.s === 'YES' ? winColor : '#F2EFE4',
                letterSpacing: '-2px',
              }}
            >
              {sideLabel}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 64,
                fontWeight: 700,
                color: 'rgba(242,239,228,0.85)',
                fontFamily: 'monospace',
              }}
            >
              {`@ ¢${stanceCents}`}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '20px',
              marginTop: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 156,
                fontWeight: 800,
                lineHeight: 1,
                color: pnlColor,
                letterSpacing: '-2px',
                fontFamily: 'monospace',
              }}
            >
              {`${sign}$${Math.abs(pnlUsd).toFixed(2)}`}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 52,
                fontWeight: 700,
                color: pnlColor,
                fontFamily: 'monospace',
                opacity: 0.85,
              }}
            >
              {`${sign}${Math.abs(pnlPct).toFixed(1)}%`}
            </div>
          </div>
        )}

        {/* Push the bottom strip to the bottom. */}
        <div style={{ display: 'flex', flex: 1 }} />

        {/* Bottom strip — market + entry/mark or AI conf */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '28px',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 16,
              letterSpacing: '4px',
              color: 'rgba(242,239,228,0.45)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Market
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              fontWeight: 700,
              color: '#F2EFE4',
              lineHeight: 1.18,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: '14px',
              fontFamily: 'monospace',
              fontSize: 26,
              fontWeight: 700,
              color: 'rgba(242,239,228,0.65)',
            }}
          >
            {isTip
              ? `AI Confidence · ${aiConf !== null ? `${aiConf}%` : '—'}`
              : `Entry → Mark · ¢${Math.round(payload.ap * 100)} → ¢${Math.round(payload.cp * 100)}`}
          </div>
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
