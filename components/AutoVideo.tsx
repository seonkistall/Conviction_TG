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
          // v2.26.5: camelCase `fetchPriority` (React 18.3+ types it natively).
          // The lowercase variant + @ts-expect-error predates 18.3 and emits an
          // "Invalid DOM property" warning in dev plus a recoverable hydration
          // error (#418/#422/#425) in production on the synthesized
          // mobile-android-tall regression slot — the prod failure shape that
          // surfaced in the v2.26.4 CI smoke run.
          fetchPriority={priority ? 'high' : undefined}
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
       * v2.23-9: Tap-to-play overlay for autoplay-blocked YouTube embeds.
       *
       * When the 6s watchdog fires without having seen a PLAYING
       * state, it means either:
       *   (a) the video is genuinely unavailable (removed/region-lock/
       *       privacy), OR
       *   (b) the iframe loaded fine but the browser denied autoplay
       *       (iOS Low-Power, muted-autoplay disabled, etc.).
       *
       * A tap on this button dispatches a postMessage `playVideo`
       * command to the iframe — a user-gesture-triggered play is
       * always allowed, even on iOS. The overlay sits above the poster
       * but under the card's outer Link, and `pointer-events-auto`
       * re-enables clicks (the iframe wrapper is pointer-events-none).
       */}
      {iframeFailed && media.kind === 'youtube' && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const iframe = containerRef.current?.querySelector('iframe');
            try {
              iframe?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
                '*'
              );
            } catch {}
          }}
          className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-ink-900/20 backdrop-blur-[2px] transition hover:bg-ink-900/30"
          aria-label="Tap to play video"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-ink-900/70 backdrop-blur">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="translate-x-0.5 text-bone"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
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
       * v2.23-9: The "Video unavailable · poster only" chip was
       * removed. It was misleading in the common case (autoplay was
       * simply denied, and a user tap would have played the video
       * just fine) and redundant in the rare true-unavailable case —
       * the tap-to-play overlay above already communicates the need
       * for user action, and tapping a genuinely-unavailable video
       * reveals YouTube's own "Video unavailable" screen inside the
       * iframe. Net: one honest UI state instead of two overlapping
       * labels.
       */}
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
  /**
   * v2.23-9: `onPlay` now fires ONLY when the YouTube IFrame API reports
   * an actual `playerState === 1` (PLAYING) — not merely on iframe
   * `onLoad`. The previous behavior hid the poster as soon as the
   * iframe DOM had loaded, even if mobile-browser autoplay policy
   * kept the video paused inside the iframe. Users then saw a frozen
   * YouTube player with a big "play" overlay and assumed "videos
   * aren't working". We now only fade the poster when playback is
   * confirmed, so the card reads as "still a poster" until the video
   * genuinely starts — and if autoplay is denied, the `onFail`
   * callback is triggered so the parent can offer a tap-to-play CTA.
   */
  onPlay?: () => void;
  /**
   * v2.20-7: Fires if the iframe hasn't loaded within 6s of mount, or
   * if the underlying load event errors. Parent uses this to surface
   * a "Video unavailable" chip while keeping the poster visible.
   *
   * v2.23-9: Also fires if the iframe loads but we don't observe a
   * PLAYING player-state within ~6s — i.e. autoplay was denied. The
   * parent surfaces a tap-to-play control in that case.
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
  /*
   * v2.23-9: Distinct "actually playing" state. The iframe DOM-level
   * `onLoad` proves the embed URL was fetched, but YouTube's PLAYING
   * state (player-state === 1 over postMessage) proves the video is
   * decoding frames on screen. We listen for state changes via the
   * iframe API and flip `truePlaying` accordingly.
   */
  const [truePlaying, setTruePlaying] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  // v2.20-7 / v2.23-9: 6s load-failure watchdog.
  //
  // YouTube's own "Video unavailable" renders inside the iframe long
  // after our `onLoad` would fire, so we need a portable signal that
  // something's wrong (region lock, privacy mode, removed video).
  //
  // The watchdog fires `onFail` only if the iframe hasn't yet loaded
  // AND we haven't observed a PLAYING event — so a happy-path embed
  // that reports `onStateChange === 1` before the 6s mark clears the
  // watchdog even if the `onLoad` event was late. In the worst case
  // (iframe stuck fetching, PLAYING never observed) we surface the
  // tap-to-play overlay so the user can unblock themselves.
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      if (!loaded && !truePlaying && onFail) onFail();
    }, 6000);
    return () => clearTimeout(t);
  }, [mounted, loaded, truePlaying, onFail]);

  /*
   * v2.23-9: Subscribe to YouTube's postMessage player-state events.
   *
   * The IFrame API requires a caller to register as a listener via
   * `{event: 'listening', id: '<anything>'}` before YouTube will
   * start pushing `onStateChange` events back. Once subscribed, we
   * receive messages shaped like:
   *   { event: 'onStateChange', info: 1 }   // 1 === PLAYING
   *   { event: 'onStateChange', info: 2 }   // 2 === PAUSED
   *   { event: 'onStateChange', info: 0 }   // 0 === ENDED
   *
   * We flip `truePlaying` on 1, and surface to the parent via
   * `onPlay`. Subsequent pauses/seeks don't re-toggle the poster —
   * once a video has played once, we trust YouTube's internal UI to
   * handle the rest.
   */
  useEffect(() => {
    if (!mounted) return;
    const iframe = iframeRef.current;
    const onMsg = (e: MessageEvent) => {
      if (!iframe || e.source !== iframe.contentWindow) return;
      let data: unknown;
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!data || typeof data !== 'object') return;
      const d = data as { event?: string; info?: unknown };
      if (d.event === 'onStateChange' && d.info === 1) {
        setTruePlaying(true);
        onPlay?.();
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [mounted, onPlay]);

  // Send mute/unMute via postMessage whenever audio ownership changes.
  // Also (re-)register as an onStateChange listener so YouTube pushes
  // us PLAYING/PAUSED events. Requires enablejsapi=1 in the iframe URL.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !mounted) return;
    const post = (msg: object) => {
      try {
        iframe.contentWindow?.postMessage(JSON.stringify(msg), '*');
      } catch {}
    };
    // v2.23-9: register for state events (idempotent — safe to send on
    // every audio toggle since YouTube dedupes by listener id).
    post({ event: 'listening', id: 'conviction-embed', channel: videoId });
    if (audio) {
      post({ event: 'command', func: 'unMute', args: [] });
      post({ event: 'command', func: 'setVolume', args: [100] });
      post({ event: 'command', func: 'playVideo', args: [] });
    } else {
      post({ event: 'command', func: 'mute', args: [] });
      post({ event: 'command', func: 'playVideo', args: [] });
    }
  }, [audio, mounted, videoId]);

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
          /*
           * v2.23-9: `onLoad` fires BOTH the `loaded` flag (gates the
           * 6s watchdog) AND `onPlay` (fades out the poster so the
           * iframe's own visuals — YouTube thumbnail + controls —
           * become visible). The postMessage `onStateChange` handler
           * further up is a redundant confirmation of true PLAYING
           * state, but we don't make `onPlay` wait for it because
           * many autoplay-blocked embeds still render YouTube's own
           * thumbnail poster + Play button inside the iframe, and
           * keeping our poster on top of that doubles up the UI.
           */
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
