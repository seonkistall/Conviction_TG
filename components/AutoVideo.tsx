'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { MediaSource } from '@/lib/types';
import { useMute } from '@/lib/mute';

/*
 * v2.20-7 — Added two user-facing states to AutoVideo on top of the
 * existing poster→player→fallback chain:
 *
 *   1. **iframe load error** — YouTube embeds can fail (region lock,
 *      removed video, privacy mode). The iframe itself just shows a
 *      black rectangle with YouTube's internal "Video unavailable"
 *      copy, but our `onLoad` fires before YouTube decides to render
 *      that notice, so we never knew. We now race a 6s timeout: if
 *      `onPlay` hasn't fired, we set `iframeFailed` and keep the
 *      poster visible with a tiny "Video unavailable" chip.
 *
 *   2. **mp4 slow-load skeleton** — on slow connections `preload=
 *      metadata` can take ≥1s before anything paints. We show a
 *      subtle shimmer over the poster while `playing===false` so the
 *      user knows motion is coming, rather than assuming the card is
 *      broken.
 *
 * Both states are additive — the existing logic is unchanged.
 */

interface Props {
  media: MediaSource;
  className?: string;
  /** autoplay only when visible in viewport (default true) */
  lazy?: boolean;
  /** play on hover only, pause when leaving (mp4 only) */
  hoverOnly?: boolean;
  /** rounded cover fit */
  fit?: 'cover' | 'contain';
  /** displayed on the gradient placeholder if all posters 404 */
  title?: string;
  /**
   * LCP candidate — poster loads eagerly with fetchPriority="high" and the
   * inner player mounts immediately (bypasses the IntersectionObserver gate).
   * Use for the first above-the-fold card per page only.
   */
  priority?: boolean;
}

/**
 * Poster loading state machine:
 *   'max'       → try media.poster (usually maxresdefault.jpg)
 *   'hq'        → fallback to hqdefault.jpg (guaranteed to exist for any YT video)
 *   'fallback'  → both 404'd → draw a brand gradient + optional title
 */
type PosterState = 'max' | 'hq' | 'fallback';

/**
 * <AutoVideo /> — Conviction's autoplay "living card" media component.
 *
 * Key behaviors
 * -------------
 * 1. **Single-audio policy** — every instance registers with the global
 *    <MuteProvider>, reports its IntersectionObserver ratio, and the
 *    provider picks ONE player as the current audio owner. Only the owner
 *    unmutes when the user toggles the global mute FAB. Everyone else
 *    stays silent. This prevents the 3-K-pop-MV-cacophony effect on the
 *    home page.
 *
 * 2. **Viewport-lazy mount** — the underlying <video>/<iframe> isn't
 *    created until the card enters the viewport (+200px rootMargin).
 *    Until then we paint only the poster <img>.
 *
 * 3. **Poster fallback chain** — maxresdefault.jpg → hqdefault.jpg →
 *    gradient+title. YouTube only guarantees hqdefault for every video
 *    and some niche uploads only have hq; maxres is a 404 for them.
 */
export function AutoVideo({
  media,
  className = '',
  lazy = true,
  hoverOnly = false,
  fit = 'cover',
  title,
  priority = false,
}: Props) {
  const rawId = useId();
  const playerId = `pl-${rawId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // If this is a priority (LCP) slot, start active so the video element
  // is present on first paint — no IO wait, no flash of black.
  const [active, setActive] = useState(!lazy || priority);
  const [playing, setPlaying] = useState(false);
  const [posterState, setPosterState] = useState<PosterState>('max');
  // v2.20-7: Added states for iframe load failure + mp4 slow-load
  // skeleton. See the component-top comment for rationale.
  const [iframeFailed, setIframeFailed] = useState(false);

  const {
    muted,
    audioOwnerId,
    registerPlayer,
    unregisterPlayer,
    reportVisibility,
  } = useMute();

  /** This player produces audio iff the user globally unmuted AND we own audio. */
  const effectiveAudio = !muted && audioOwnerId === playerId;

  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  // Register lifecycle with the mute coordinator.
  useEffect(() => {
    registerPlayer(playerId);
    return () => unregisterPlayer(playerId);
  }, [playerId, registerPlayer, unregisterPlayer]);

  // IntersectionObserver — activates lazy mount AND reports visibility ratio.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (lazy && e.isIntersecting && !active) setActive(true);
          reportVisibility(playerId, e.intersectionRatio);
        });
      },
      {
        // Multi-threshold so we get smooth ratio updates as cards scroll past.
        threshold: [0, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1.0],
        rootMargin: '0px',
      }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      // Drop our ratio to 0 so we don't keep audio ownership after unmount.
      reportVisibility(playerId, 0);
    };
  }, [playerId, lazy, active, reportVisibility]);

  // Apply single-audio policy to the mp4 <video> element.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !effectiveAudio;
    if (effectiveAudio && !hoverOnly) {
      // Chrome sometimes pauses when the muted flag flips; resume gracefully.
      v.play().catch(() => {});
    }
  }, [effectiveAudio, active, hoverOnly]);

  const onEnter = () => {
    if (hoverOnly && videoRef.current) videoRef.current.play().catch(() => {});
  };
  const onLeave = () => {
    if (hoverOnly && videoRef.current) videoRef.current.pause();
  };

  // Compute poster URL based on fallback state.
  const posterSrc =
    posterState === 'max'
      ? media.poster
      : posterState === 'hq'
      ? media.poster.replace(/\/maxresdefault\.(jpg|png|webp)$/i, '/hqdefault.$1')
      : null;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-ink-700 ${className}`}
      // Become a size container in cover mode so the YouTube iframe can use
      // cqw/cqh units to compute true "cover" dimensions (see YouTubeEmbed).
      // Without this, a 16:9 iframe letterboxes inside tall portrait cards
      // (e.g. Galaxy S25 Ultra's 9:19.5 feed card) because `scale-[1.35]`
      // is nowhere near enough for aspect ratios < ~0.6. We only opt-in for
      // cover mode to avoid disrupting aspect-ratio behavior elsewhere.
      style={fit === 'cover' ? { containerType: 'size' } : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      data-player-id={playerId}
    >
      {/* Tier-3 fallback: brand gradient + optional title. Always rendered
          behind the <img> so it's instantly visible if the <img> fails. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-ink-800 via-ink-700 to-ink-900"
      >
        <div className="absolute inset-0 narrative-grad opacity-70" />
        {title && posterState === 'fallback' && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center font-display text-2xl leading-tight text-bone">
            {title}
          </div>
        )}
      </div>

      {/* Tier-1/2 poster with error-chained fallback.
          `key={posterSrc}` forces a full img remount when the state
          transitions from 'max' → 'hq'. Without it some browsers reuse
          the errored <img> element and never re-fire onError on the
          second URL, leaving us stuck on a broken image icon. */}
      {posterSrc && (
        <img
          key={posterSrc}
          src={posterSrc}
          alt=""
          className={`absolute inset-0 h-full w-full ${fitClass} transition-opacity duration-500 ${
            playing ? 'opacity-0' : 'opacity-100'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          // fetchPriority is still a relatively new attribute — React 18 lower-
          // cases it from the JSX side, so we pass it through the DOM literal.
          // @ts-expect-error: React 18 type defs predate fetchPriority.
          fetchpriority={priority ? 'high' : undefined}
          decoding={priority ? 'sync' : 'async'}
          onError={() =>
            setPosterState((s) => (s === 'max' ? 'hq' : 'fallback'))
          }
        />
      )}

      {active && media.kind === 'mp4' && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full ${fitClass}`}
          src={media.src}
          poster={posterSrc ?? undefined}
          autoPlay={!hoverOnly}
          muted={!effectiveAudio}
          loop
          playsInline
          preload="metadata"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {active && media.kind === 'youtube' && (
        <YouTubeEmbed
          videoId={media.src}
          start={media.start}
          audio={effectiveAudio}
          onPlay={() => {
            setPlaying(true);
            setIframeFailed(false);
          }}
          onFail={() => setIframeFailed(true)}
          cover={fit === 'cover'}
        />
      )}

      {/*
       * v2.20-7: mp4 slow-load skeleton — subtle pulse over the poster
       * while the player hasn't reported `onPlaying` yet. Only shows
       * AFTER the player has been mounted (`active`) but BEFORE we've
       * seen the first frame. No-op on iframe videos since YouTube
       * paints its own loading state inside the iframe.
       */}
      {active && media.kind === 'mp4' && !playing && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-br from-ink-900/30 via-transparent to-ink-900/30"
        />
      )}

      {/*
       * v2.20-7: Video-unavailable chip — shown when the iframe didn't
       * fire onPlay within the failure window. Keeps the poster
       * visible behind so the card doesn't become a black void.
       * `aria-live=polite` so SR users learn the video can't play
       * without being interrupted mid-sentence.
       */}
      {iframeFailed && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-ink-900/90 px-3 py-1 text-[11px] font-semibold text-bone-muted backdrop-blur"
          aria-live="polite"
          role="status"
        >
          Video unavailable · poster only
        </div>
      )}
    </div>
  );
}

function YouTubeEmbed({
  videoId,
  start = 0,
  audio,
  onPlay,
  onFail,
  cover = false,
}: {
  videoId: string;
  start?: number;
  /** True iff this player currently owns audio. */
  audio: boolean;
  onPlay?: () => void;
  /**
   * v2.20-7: Fires if the iframe hasn't loaded within 6s of mount, or
   * if the underlying load event errors. Parent uses this to surface
   * a "Video unavailable" chip while keeping the poster visible.
   */
  onFail?: () => void;
  /**
   * When true, size the iframe so its 16:9 content covers the parent
   * container regardless of the container's aspect ratio. Relies on the
   * parent declaring `container-type: size` (AutoVideo does this).
   */
  cover?: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  // v2.20-7: 6s load-failure watchdog. YouTube's own "Video unavailable"
  // renders inside the iframe long after our onLoad would normally
  // fire, so a race against a timer is the cleanest portable signal
  // that something's wrong (region lock, privacy mode, removed video).
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      if (!loaded && onFail) onFail();
    }, 6000);
    return () => clearTimeout(t);
  }, [mounted, loaded, onFail]);

  // Send mute/unMute via postMessage whenever audio ownership changes.
  // Requires enablejsapi=1 in the iframe URL.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !mounted) return;
    const post = (func: string, args: unknown[] = []) => {
      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch {}
    };
    if (audio) {
      post('unMute');
      post('setVolume', [100]);
      post('playVideo');
    } else {
      post('mute');
    }
  }, [audio, mounted]);

  // Always start muted so autoplay works on load; we'll unmute via postMessage
  // once we become the audio owner (the mute FAB click is a user gesture that
  // activates the page, so subsequent unMute is allowed).
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    modestbranding: '1',
    playsinline: '1',
    loop: '1',
    playlist: videoId,
    rel: '0',
    start: String(start),
    iv_load_policy: '3',
    showinfo: '0',
    disablekb: '1',
    enablejsapi: '1',
  });

  /*
   * Cover math, explained:
   *   The iframe's inner video is 16:9. YouTube's player letterboxes the
   *   video inside whatever size we give the iframe, so to achieve a real
   *   CSS `object-fit: cover` look we must size the IFRAME itself so its
   *   own 16:9 box fills (and overflows) the container.
   *
   *   If we center the iframe and set:
   *     width  = max(100cqw, 100cqh * 16/9)
   *     height = max(100cqh, 100cqw *  9/16)
   *   then whichever axis is the "short side" of the container is clipped
   *   by overflow:hidden, and the video covers. The minimum bounds ensure
   *   we never shrink below the container.
   *
   *   cqw / cqh resolve against the nearest ancestor with `container-type:
   *   size` — AutoVideo's wrapper sets that in cover mode. Browser support:
   *   Chromium 105+, Safari 16+, Firefox 110+ — all comfortably 2+ years
   *   old as of 2026. A pre-modern-browser fallback below lands at
   *   min-size:100% which at worst degrades to today's letterbox behavior.
   */
  const coverStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'max(100cqw, calc(100cqh * 16 / 9))',
    height: 'max(100cqh, calc(100cqw * 9 / 16))',
    minWidth: '100%',
    minHeight: '100%',
  };
  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      {mounted && (
        <iframe
          ref={iframeRef}
          style={cover ? coverStyle : fillStyle}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
          title="market video"
          frameBorder={0}
          allow="autoplay; encrypted-media; picture-in-picture"
          onLoad={() => {
            setLoaded(true);
            onPlay?.();
          }}
          onError={() => onFail?.()}
        />
      )}
    </div>
  );
}
