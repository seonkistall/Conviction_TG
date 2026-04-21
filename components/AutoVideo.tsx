'use client';

import { useEffect, useRef, useState } from 'react';
import type { MediaSource } from '@/lib/types';

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
 * For `youtube`: injects the IFrame Player API with `mute=1&loop=1&playlist=ID`
 * to simulate the same autoplay-muted-loop behavior. This is how you get
 * official music videos and LCK highlights playing inside cards.
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
          muted
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
  onPlay,
  className = '',
}: {
  videoId: string;
  start?: number;
  onPlay?: () => void;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

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
  });

  return (
    <div className={`pointer-events-none ${className}`}>
      {mounted && (
        <iframe
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
