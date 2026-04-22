import { ImageResponse } from 'next/og';
import { AI_TRADERS, getAITrader } from '@/lib/markets';

/**
 * Dynamic 1200x630 OG image for /traders/[handle].
 *
 * Per-trader card with the agent's avatar (emoji), handle, model pill,
 * strategy line, and the hero stats — win rate, 30d P&L, followers. Every
 * container sets an explicit `display: flex` because Satori rejects div-
 * with-multiple-children unless flex/grid is declared.
 */
export const runtime = 'edge';
// v2.13: Explicit ISR — stats text will drift as the demo evolves;
// recheck hourly rather than trusting the default indefinite cache.
export const revalidate = 3600;
export const alt = 'Conviction AI Trader';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateImageMetadata() {
  return AI_TRADERS.map((t) => ({
    id: t.handle,
    alt: `@${t.handle} — Conviction AI trader`,
    size,
    contentType,
  }));
}

// Match the in-app MODEL_TINT lookup so shared images feel cohesive with
// the page body. Falls back to volt (house brand) on unknown models.
const MODEL_COLORS: Record<string, { fg: string; soft: string }> = {
  'Conviction-v2': { fg: '#C6FF3D', soft: 'rgba(198,255,61,0.1)' },
  'Allora-KR':    { fg: '#7C5CFF', soft: 'rgba(124,92,255,0.12)' },
  'Qwen3-32B':    { fg: '#FF8AB4', soft: 'rgba(255,138,180,0.12)' },
  'Sonnet-4.6':   { fg: '#E6A84A', soft: 'rgba(230,168,74,0.12)' },
};

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export default async function Image({ params }: { params: { handle: string } }) {
  const t = getAITrader(params.handle);
  if (!t) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#05060A',
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

  const tint = MODEL_COLORS[t.model] ?? MODEL_COLORS['Conviction-v2'];
  const pnlPositive = t.pnl30d >= 0;
  const winPct = Math.round(t.winRate * 100);

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
            'linear-gradient(135deg, #0A0A0B 0%, #121318 55%, #1a1c24 100%)',
          color: '#F2EFE4',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Model-tinted corner glow — gives the image a recognizable hue
            per model family so the Allora / Qwen / Sonnet traders read
            distinct in a scroll feed. */}
        <div
          style={{
            position: 'absolute',
            right: '-160px',
            top: '-160px',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            display: 'flex',
            background: `radial-gradient(closest-side, ${tint.fg}33, ${tint.fg}00)`,
          }}
        />

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
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#C6FF3D',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#05060A',
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              ▲
            </div>
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
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              border: `1.5px solid ${tint.fg}66`,
              background: tint.soft,
              borderRadius: '999px',
              color: tint.fg,
              fontSize: 18,
              letterSpacing: '3px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {t.model}
          </div>
        </div>

        {/* Avatar + handle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            marginTop: '64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '140px',
              height: '140px',
              borderRadius: '32px',
              background: tint.soft,
              border: `2px solid ${tint.fg}55`,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 92,
            }}
          >
            {t.avatar}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                letterSpacing: '4px',
                color: 'rgba(242,239,228,0.5)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              AI Agent
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.05,
                marginTop: '4px',
                color: '#F2EFE4',
              }}
            >
              @{t.handle}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: '22px',
            fontSize: 28,
            color: 'rgba(242,239,228,0.72)',
            maxWidth: '1000px',
            lineHeight: 1.25,
          }}
        >
          {truncate(t.strategy, 140)}
        </div>

        <div style={{ display: 'flex', flex: 1 }} />

        {/* Stats row */}
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
          <div style={{ display: 'flex', gap: '64px' }}>
            <TStat label="Win rate" value={`${winPct}%`} />
            <TStat
              label="30d P&L"
              value={`${pnlPositive ? '+' : ''}${fmtUSD(t.pnl30d)}`}
              color={pnlPositive ? '#53D866' : '#F04438'}
            />
            <TStat
              label="Followers"
              value={t.followers.toLocaleString()}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function TStat({
  label,
  value,
  color = '#F2EFE4',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          fontSize: 18,
          letterSpacing: '3px',
          color: 'rgba(242,239,228,0.55)',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 72,
          fontWeight: 800,
          lineHeight: 1,
          color,
          marginTop: '4px',
        }}
      >
        {value}
      </div>
    </div>
  );
}
