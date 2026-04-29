import { priceHistory } from '@/lib/markets';

interface Props {
  seed: number;
  days?: number;
  className?: string;
  /** line color */
  stroke?: string;
  /** optional vertical gradient fill */
  fill?: boolean;
}

/**
 * Dependency-free SVG sparkline / area chart. No recharts, nothing to install.
 */
export function PriceChart({
  seed,
  days = 30,
  className = '',
  stroke = '#C6FF3D',
  fill = true,
}: Props) {
  const data = priceHistory(seed, days);
  const W = 800;
  const H = 240;
  const padY = 16;
  const step = W / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = padY + (1 - v) * (H - padY * 2);
    return [x, y] as const;
  });

  const path = points
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(' ');
  const area = `${path} L ${W} ${H} L 0 ${H} Z`;

  const last = data[data.length - 1];
  const first = data[0];
  const up = last >= first;

  const lastPoint = points[points.length - 1];
  const dotLeftPct = (lastPoint[0] / W) * 100;
  const dotTopPct = (lastPoint[1] / H) * 100;

  return (
    <div className={`relative h-full w-full ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
      >
        {/* grid */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={0}
            x2={W}
            y1={padY + g * (H - padY * 2)}
            y2={padY + g * (H - padY * 2)}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <defs>
          <linearGradient id={`g-${seed}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        {fill && <path d={area} fill={`url(#g-${seed})`} />}
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${dotLeftPct}%`, top: `${dotTopPct}%` }}
      >
        <span
          className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25"
          style={{ backgroundColor: stroke }}
        />
        <span
          className="relative block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: stroke }}
        />
      </span>
      <div
        className={`absolute right-0 top-0 rounded-md border px-2 py-0.5 font-mono text-[11px] ${
          up
            ? 'border-yes/40 bg-yes/10 text-yes'
            : 'border-no/40 bg-no/10 text-no'
        }`}
      >
        {up ? '▲' : '▼'} {((last - first) * 100).toFixed(1)}pp
      </div>
    </div>
  );
}
