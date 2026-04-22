'use client';

import { useEffect, useState } from 'react';

/**
 * Asia-native timezone cluster shown in Header (desktop only).
 * Displays live clocks for Tokyo / Seoul / Shanghai / Hong Kong.
 * Ticks once per minute — intentionally coarse to avoid layout thrash.
 */

interface Zone {
  label: string;
  tz: string;
  flag: string;
}

const ZONES: Zone[] = [
  { label: 'TKY', tz: 'Asia/Tokyo', flag: '🇯🇵' },
  { label: 'SEL', tz: 'Asia/Seoul', flag: '🇰🇷' },
  { label: 'SHA', tz: 'Asia/Shanghai', flag: '🇨🇳' },
  { label: 'HKG', tz: 'Asia/Hong_Kong', flag: '🇭🇰' },
];

function formatTime(now: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    }).format(now);
  } catch {
    return '--:--';
  }
}

export function TimezoneCluster() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // Render a placeholder on SSR to avoid hydration mismatch.
  const placeholder = !now;

  return (
    <div
      className="hidden items-center gap-2.5 rounded-md border border-white/10 bg-ink-800 px-3 py-1.5 xl:flex"
      data-clock-cluster
    >
      {ZONES.map((z) => (
        <div
          key={z.tz}
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tabular-nums"
          title={z.tz.replace('_', ' ')}
        >
          <span className="text-bone-muted">{z.label}</span>
          <span className="text-bone">{placeholder ? '--:--' : formatTime(now!, z.tz)}</span>
        </div>
      ))}
    </div>
  );
}
