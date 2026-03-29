/**
 * SVG radar chart for horse sub-scores (rat/frm/cnd/exp/trn/suit).
 * Pure SVG — no external charting library needed.
 */

interface HorseRadarChartProps {
  /** Sub-scores object with 0-100 values */
  scores: Record<string, number | undefined>;
  /** Optional comparison scores (e.g. race average) */
  compareScores?: Record<string, number | undefined>;
  size?: number;
  className?: string;
}

const AXES: { key: string; label: string }[] = [
  { key: 'rat', label: '레이팅' },
  { key: 'frm', label: '폼' },
  { key: 'suit', label: '적합도' },
  { key: 'trn', label: '훈련' },
  { key: 'exp', label: '경험' },
  { key: 'cnd', label: '컨디션' },
];

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygonPoints(
  cx: number, cy: number, radius: number,
  values: number[], maxVal: number,
): string {
  const step = 360 / values.length;
  return values
    .map((v, i) => {
      const r = (Math.min(v, maxVal) / maxVal) * radius;
      const { x, y } = polarToXY(cx, cy, r, i * step);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function HorseRadarChart({
  scores,
  compareScores,
  size = 180,
  className = '',
}: HorseRadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 28;
  const maxVal = 100;
  const step = 360 / AXES.length;

  const values = AXES.map(({ key }) => scores[key] ?? 0);
  const hasData = values.some((v) => v > 0);
  if (!hasData) return null;

  const compareValues = compareScores
    ? AXES.map(({ key }) => compareScores[key] ?? 0)
    : null;

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Background rings */}
        {rings.map((pct) => {
          const r = radius * pct;
          const pts = AXES.map((_, i) => {
            const { x, y } = polarToXY(cx, cy, r, i * step);
            return `${x},${y}`;
          }).join(' ');
          return (
            <polygon
              key={pct}
              points={pts}
              fill='none'
              stroke='currentColor'
              strokeWidth={0.5}
              className='text-stone-200'
            />
          );
        })}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const { x, y } = polarToXY(cx, cy, radius, i * step);
          return (
            <line
              key={i}
              x1={cx} y1={cy} x2={x} y2={y}
              stroke='currentColor'
              strokeWidth={0.5}
              className='text-stone-200'
            />
          );
        })}

        {/* Compare polygon (if provided) */}
        {compareValues && (
          <polygon
            points={buildPolygonPoints(cx, cy, radius, compareValues, maxVal)}
            fill='currentColor'
            fillOpacity={0.06}
            stroke='currentColor'
            strokeWidth={1}
            strokeDasharray='3 2'
            className='text-stone-400'
          />
        )}

        {/* Main data polygon */}
        <polygon
          points={buildPolygonPoints(cx, cy, radius, values, maxVal)}
          fill='currentColor'
          fillOpacity={0.15}
          stroke='currentColor'
          strokeWidth={2}
          strokeLinejoin='round'
          className='text-primary'
        />

        {/* Data points */}
        {values.map((v, i) => {
          const r = (Math.min(v, maxVal) / maxVal) * radius;
          const { x, y } = polarToXY(cx, cy, r, i * step);
          return (
            <circle
              key={i}
              cx={x} cy={y} r={3}
              fill='currentColor'
              stroke='white'
              strokeWidth={1.5}
              className='text-primary'
            />
          );
        })}

        {/* Axis labels */}
        {AXES.map(({ label, key }, i) => {
          const labelR = radius + 16;
          const { x, y } = polarToXY(cx, cy, labelR, i * step);
          const val = scores[key] ?? 0;
          return (
            <text
              key={i}
              x={x} y={y}
              textAnchor='middle'
              dominantBaseline='central'
              className='fill-stone-600 text-[10px] font-medium'
            >
              {label}
              <tspan className='fill-stone-400 text-[9px]'> {Math.round(val)}</tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
