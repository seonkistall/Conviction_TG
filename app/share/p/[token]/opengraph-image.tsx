import { ImageResponse } from 'next/og';
import { getMarket } from '@/lib/markets';
import {
  decodeSharePayload,
  pnlFromPayload,
  tokenFingerprint,
} from '@/lib/shareToken';

/**
 * v2.28-2 — Dynamic 1200×630 OG card for /share/p/[token].
 *
 * The card is the ENTIRE viral payload — when a follower sees the
 * share in their X / Slack / KakaoTalk feed, this image is what they
 * read first (and most of them never click). So we lead with the
 * P&L number, big and color-coded, with the market context as a
 * supporting role.
 *
 * Same Satori-friendly rules as /markets/[id]/opengraph-image.tsx:
 *   - Every wrapper sets explicit display:flex (multi-child rule)
 *   - No external fonts; system sans is sufficient and avoids the
 *     codepoint-fetch failures we hit in v2.16
 *   - CSS-drawn glyphs only (no Unicode arrows / emoji)
 *
 * Token decoding lives in lib/shareToken so this file and the page
 * share the same payload contract — no drift between the two
 * surfaces.
 */

export const runtime = 'edge';
export const revalidate = 3600;
export const alt = 'Conviction · Shared position';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export default async function Image({
  params,
}: {
  params: { token: string };
}) {
  const payload = decodeSharePayload(params.token);

  // Fallback card for malformed / expired tokens. Keeps the brand
  // intact even if a corrupted link gets shared.
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
            color: '#F2EFE4',
            fontSize: 72,
            fontFamily: 'sans-serif',
            fontWeight: 800,
            letterSpacing: 6,
          }}
        >
          CONVICTION
        </div>
      ),
      { ...size }
    );
  }

  const m = getMarket(payload.m);
  const { pnlUsd, pnlPct } = pnlFromPayload(payload);
  const isWin = pnlUsd >= 0;
  // v2.28 hotfix: losses must render an explicit '-' prefix, not blank.
  // Pre-fix the lose card showed "$232.00" with no sign; the red color
  // alone wasn't enough — viewers reading the X preview at thumbnail
  // size couldn't tell a loss from a win unless they zoomed in.
  const sign = isWin ? '+' : '-';
  const winColor = '#C6FF3D'; // volt
  const loseColor = '#F04438'; // alert
  const pnlColor = isWin ? winColor : loseColor;
  const handle = payload.h ? `@${payload.h}` : '@trader';
  const title = m ? truncate(m.title, 88) : 'A market on Conviction';
  const sideLabel = payload.s.toUpperCase();
  // v2.29-2: receipt fingerprint. Sized 8 hex chars — long enough to
  // read as "real hash", short enough to fit beside the SHARED RECEIPT
  // label without crowding the brand strip.
  const fingerprint = tokenFingerprint(params.token);
  /*
   * v2.29-3 — Endorsement / "tip" mode.
   *
   * `kind === 'tip'` means the sharer is broadcasting a stance on a
   * market without holding a position. We branch the layout so the
   * P&L hero is replaced with a "ENDORSES <SIDE> @ ¢XX" subline + a
   * larger market title. The fingerprint + verified pill stay so
   * /share/p/[token] reads consistently regardless of mode.
   *
   * `sh === 0` is treated equivalently for backwards compat — a tip
   * link minted before the `k` field existed will still render as
   * an endorsement instead of "you made $0".
   */
  const isTip = payload.k === 'tip' || payload.sh === 0;
  // For tips we read AI confidence off the catalog so the card has
  // SOMETHING to lead with beyond the bare cents. Falls back to 0
  // gracefully if the market has been rotated.
  const aiConf = m ? Math.round(m.aiConfidence * 100) : null;
  const stanceCents = Math.round(payload.cp * 100);

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
            'linear-gradient(135deg, #05060A 0%, #0F1018 50%, #1a1c24 100%)',
          color: '#F2EFE4',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* P&L-tinted ambient blob — wins blow up volt, losses blow up red.
            Mirrors the "win/lose mood" cue users get on /portfolio. */}
        <div
          style={{
            position: 'absolute',
            right: '-180px',
            top: '-180px',
            width: '720px',
            height: '720px',
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${
              isWin
                ? 'rgba(198,255,61,0.20)'
                : 'rgba(240,68,56,0.20)'
            }, rgba(0,0,0,0))`,
            display: 'flex',
          }}
        />

        {/* Top row — brand + receipt label */}
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
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#C6FF3D',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '9px solid transparent',
                  borderRight: '9px solid transparent',
                  borderBottom: '14px solid #05060A',
                }}
              />
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
          {/*
           * v2.29-2 — Receipt + fingerprint stack.
           *
           * Two-line cluster, right-aligned:
           *   row 1: small "VERIFIED" tag in volt + 8-char fingerprint
           *          in monospace. Reads as "this receipt is hashed".
           *   row 2: the original SHARED RECEIPT pill, dimmer.
           *
           * The fingerprint changes deterministically with any change
           * to the token, so a viewer comparing two screenshots can
           * trivially detect tampering. Honest framing on the page;
           * here we just need the visual cue.
           */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '6px',
            }}
          >
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
                  fontSize: 14,
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
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'rgba(242,239,228,0.85)',
                  background: 'rgba(198,255,61,0.08)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  letterSpacing: '1px',
                }}
              >
                {fingerprint}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 14px',
                border: '1.5px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '999px',
                color: 'rgba(242,239,228,0.65)',
                fontSize: 13,
                letterSpacing: '3px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Shared receipt
            </div>
          </div>
        </div>

        {/* v2.29-3: branch on tip vs position. Tip cards lead with the
            stance line ("@handle endorses YES @ ¢62") and put the
            market title in the hero slot, so a follower reading at
            thumbnail size sees the market name first. Position cards
            keep the P&L hero. */}
        {isTip ? (
          <>
            <div
              style={{
                display: 'flex',
                marginTop: '64px',
                fontSize: 26,
                fontWeight: 600,
                color: 'rgba(242,239,228,0.65)',
                letterSpacing: '2px',
              }}
            >
              {handle} · ENDORSES
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                marginTop: '6px',
                gap: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 116,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: payload.s === 'YES' ? winColor : '#F2EFE4',
                  letterSpacing: '-1px',
                }}
              >
                {sideLabel}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 60,
                  fontWeight: 700,
                  color: 'rgba(242,239,228,0.85)',
                  fontFamily: 'monospace',
                }}
              >
                {`@ ¢${stanceCents}`}
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                marginTop: '64px',
                fontSize: 28,
                fontWeight: 600,
                color: 'rgba(242,239,228,0.7)',
                letterSpacing: '2px',
              }}
            >
              {handle} · {sideLabel} · {payload.sh.toLocaleString()} shares
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                marginTop: '8px',
                gap: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 168,
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
                  fontSize: 44,
                  fontWeight: 700,
                  color: pnlColor,
                  fontFamily: 'monospace',
                  opacity: 0.85,
                }}
              >
                {`${sign}${Math.abs(pnlPct).toFixed(1)}%`}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', flex: 1 }} />

        {/* Bottom strip — market reference + entry/mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '24px',
            gap: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 16,
                letterSpacing: '3px',
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
                fontSize: 32,
                fontWeight: 700,
                color: '#F2EFE4',
                marginTop: '4px',
                lineHeight: 1.18,
              }}
            >
              {title}
            </div>
          </div>
          {/* v2.29-3: tip cards swap "Entry → Mark" for "AI Confidence"
              since there's no entry to reference. Position cards keep
              the entry/mark strip — that's the brag. */}
          {isTip ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 14,
                  letterSpacing: '3px',
                  color: 'rgba(242,239,228,0.45)',
                  textTransform: 'uppercase',
                }}
              >
                AI Confidence
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'monospace',
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#F2EFE4',
                }}
              >
                {aiConf !== null ? `${aiConf}%` : '—'}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '4px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 14,
                  letterSpacing: '3px',
                  color: 'rgba(242,239,228,0.45)',
                  textTransform: 'uppercase',
                }}
              >
                Entry → Mark
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'monospace',
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#F2EFE4',
                }}
              >
                {`¢${Math.round(payload.ap * 100)} → ¢${Math.round(
                  payload.cp * 100
                )}`}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
