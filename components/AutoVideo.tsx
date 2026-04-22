'use client';

import { useEffect, useRef, useState } from 'react';
import type { MediaSource } from '@/lib/types';
import { useMute } from '@/lib/mute';

interface Props {
  media: MediaSource;
  className?: string;
  /** autoplay only when visible in viewport (default true) */
  lazy?: boolean;
  /** play on hover only, pause when leaving */
  hoverOnly?: boolean;
  /** rounded cover fit */
  fit?: 'cover' | 'contain';
}

/**
 * <AutoVideo /> — the heart of a worm.wtf-style card.
 *
 * For `mp4`: uses a native <video> tag with autoplay/muted/loop, and
 * only starts loading when in the viewport (or on hover).
 *
 * For `youtube`: injects the IFrame Player API with `enablejsapi=1`
 * so we can postMessage mute/unMute commands when the global FAB toggles.
 *
 * Both subscribe to the global useMute() context — toggling the FAB
 * propagates to every mounted player, including ones lazily mounted later.
 *
 * Both fall back to the provided poster image until the player is ready.
 */
export function AutoVideo({
  media,
  className = '',
  lazy = true,
  hoverOnly = false,
  fit = 'cover',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(!lazy);
  const [playing, setPlaying] = useState(false);
  const { muted } = useMute();
  const fitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  // Viewport activation
  useEffect(() => {
    if (!lazy || active) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, active]);

  // Apply mute state to mp4 <video> element whenever it changes or video re-mounts.
  // After unmuting, attempt to resume play() — Chrome sometimes pauses on unmute
  // if the original autoplay was conditional on muted=true.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (!muted && !hoverOnly) {
      v.play().catch(() => {
        // Autoplay-with-sound was blocked. The user gesture from the FAB click
        // counts as activation, but if the video was previously paused for any
        // reason the browser may still refuse. No-op fallback.
      });
    }
  }, [muted, active, hoverOnly]);

  // mp4 hover handling
  const onEnter = () => {
    if (hoverOnly && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };
  const onLeave = () => {
    if (hoverOnly && videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-ink-700 ${className}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Poster (always rendered underneath for instant paint) */}
      <img
        src={media.poster}
        alt=""
        className={`absolute inset-0 h-full w-full ${fitClass} transition-opacity duration-500 ${
          playing ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
      />

      {active && media.kind === 'mp4' && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full ${fitClass}`}
          src={media.src}
          poster={media.poster}
          autoPlay={!hoverOnly}
          muted={muted}
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
          muted={muted}
          onPlay={() => setPlaying(true)}
          className={`absolute inset-0 h-full w-full ${fit === 'cover' ? 'scale-[1.35]' : ''}`}
        />
      )}
    </div>
  );
}

function YouTubeEmbed({
  videoId,
  start = 0,
  muted,
  onPlay,
  className = '',
}: {
  videoId: string;
  start?: number;
  muted: boolean;
  onPlay?: () => void;
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  // Send mute/unMute commands via postMessage whenever global mute changes.
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
    if (muted) {
      post('mute');
    } else {
      post('unMute');
      post('setVolume', [100]);
      post('playVideo');
    }
  }, [muted, mounted]);

  // Iframe URL — start muted so autoplay is allowed; we unmute via postMessage
  // after the user gesture. enablejsapi=1 is REQUIRED for postMessage commands.
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

  return (
    <div className={`pointer-events-none ${className}`}>
      {mounted && (
        <iframe
          ref={iframeRef}
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
          title="market video"
          frameBorder={0}
          allow="autoplay; encrypted-media; picture-in-picture"
          onLoad={onPlay}
        />
      )}
    </div>
  );
}
