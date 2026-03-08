import React from 'react';
import type { PredictionHorseScore } from '@/lib/types/predictions';

interface HorseScoresBarChartProps {
  horseScores: PredictionHorseScore[];
  /** Max score for 100% bar width; default from data */
  maxScore?: number;
  /** Show score number at end of bar */
  showValue?: boolean;
  className?: string;
}

/**
 * Mini horizontal bar chart for AI horse scores (0–100 scale).
 * Used in prediction full view for quick visual comparison.
 */
export default function HorseScoresBarChart({
  horseScores,
  maxScore,
  showValue = true,
  className = '',
}: HorseScoresBarChartProps) {
  if (!horseScores?.length) return null;

  const scores = horseScores.map((h) => h.score ?? 0);
  const dataMax = Math.max(...scores, 1);
  const scaleMax = maxScore ?? Math.max(dataMax, 100);

  return (
    <div className={`space-y-2 ${className}`} role='img' aria-label='말별 AI 점수 막대 차트'>
      {horseScores.map((h, i) => {
        const score = h.score ?? 0;
        const pct = scaleMax > 0 ? Math.min(100, (score / scaleMax) * 100) : 0;
        const label = h.hrName ?? h.horseName ?? '-';

        return (
          <div key={i} className='flex items-center gap-2 text-sm'>
            <span className='w-20 shrink-0 text-right text-text-tertiary font-medium truncate flex items-center justify-end gap-1' title={label}>
              {h.chulNo != null && (
                <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-[11px] font-bold shrink-0'>
                  {h.chulNo}
                </span>
              )}
              <span className='truncate'>{label}</span>
            </span>
            <div className='min-w-0 flex-1'>
              <div className='h-5 overflow-hidden rounded bg-stone-100'>
                <div
                  className='h-full rounded bg-primary transition-[width] duration-300'
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            {showValue && (
              <span className='w-10 shrink-0 text-right font-semibold text-foreground'>
                {score > 0 ? Math.round(score) : '—'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
