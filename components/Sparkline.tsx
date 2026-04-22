/**
 * Sparkline — tiny inline SVG line chart.
 *
 * Designed to sit inside a table cell or card footer. No grid, no axis, no
 * hover — just the signal. Colors are driven by `direction` (up / down /
 * flat) so the caller can align the line with P&L coloring. A faint
 * `baseline` prop draws a dashed horizontal line at a given [0..1] value;
 * on /portfolio we pass the avgPrice so the user can see where they're
 * breaking even at a glance.
 */
interface Props {
  /** Series values, each in any consistent scale. Auto-normalized. */
  data: number[];
  /** Optional baseline (in same units as data) rendered as a dashed line. */
  baseline?: number;
  direction?: 'up' | 'down' | 'flat';
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  baseline,
  direction = 'flat',
  width = 96,
  height = 28,
  className = '',
}: Props) {
  if (!data.length) return null;

  // Normalize to [0..1] across the series so sparse ranges still fill the
  // available vertical space. If the series is flat (min === max) we center
  // the line rather than collapse it to the top edge.
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const plotH = height - pad * 2;

  const step = data.length > 1 ? width / (data.length - 1) : 0;
  const yFor = (v: number) => pad + (1 - (v - min) / range) * plotH;

  const points = data.map((v, i) => [i * step, yFor(v)] as const);
  const path = points
    .map((p, i) => (i === 0 ? `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}` : `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`))
    .join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  const stroke =
    direction === 'up'
      ? '#22C55E' // yes
      : direction === 'down'
      ? '#EF4444' // no
      : '#C7C4BB'; // bone-muted

  // Deterministic gradient id from the data shape so multiple sparklines
  // on the same page don't cross-reference each other's <defs>.
  const gradId =
    'spk-' +
    Math.abs(
      data.reduce((a, v, i) => a + Math.round(v * 1000) + i, 0)
    ).toString(36);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      {baseline !== undefined && (
        <line
          x1={0}
          x2={width}
          y1={yFor(baseline)}
          y2={yFor(baseline)}
          stroke="rgba(255,255,255,0.25)"
          strokeDasharray="2 3"
          strokeWidth={1}
        />
      )}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={1.8}
        fill={stroke}
      />
    </svg>
  );
}
