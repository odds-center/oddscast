import React, { useState } from 'react';
import SimpleTooltip from '@/components/ui/SimpleTooltip';
import { SUB_SCORE_KEYS, getFactorLabel, getFactorTerm } from '@/lib/utils/factorTerms';
import type { PredictionHorseScore } from '@/lib/types/predictions';

interface HorseScoresBarChartProps {
  horseScores: PredictionHorseScore[];
  /** Max score for 100% bar width; default from data */
  maxScore?: number;
  /** Show score number at end of bar */
  showValue?: boolean;
  /** Show sub-score breakdown on tap/click */
  showSubScores?: boolean;
  className?: string;
}

/**
 * Mini horizontal bar chart for AI horse scores (0–100 scale).
 * Used in prediction full view for quick visual comparison.
 */
/** Sub-score mini bars for a single horse */
function SubScoreBreakdown({ sub }: { sub: PredictionHorseScore['sub'] }) {
  if (!sub) return null;
  const entries = SUB_SCORE_KEYS
    .map((key) => ({ key, value: sub[key] }))
    .filter((e) => e.value != null);
  if (entries.length === 0) return null;

  return (
    <div className='grid grid-cols-3 gap-x-3 gap-y-1.5 mt-1.5 pl-[88px] pr-[48px]'>
      {entries.map(({ key, value }) => {
        const term = getFactorTerm(key);
        const pct = Math.min(100, value ?? 0);
        return (
          <div key={key} className='flex items-center gap-1.5'>
            <SimpleTooltip content={term?.tooltip ?? ''} position='top' inline hideTriggerIcon>
              <span className='text-[10px] text-text-tertiary w-10 shrink-0 text-right cursor-help'>
                {getFactorLabel(key)}
              </span>
            </SimpleTooltip>
            <div className='flex-1 h-2 rounded-full bg-stone-100 overflow-hidden'>
              <div
                className='h-full rounded-full bg-stone-400 transition-[width] duration-200'
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className='text-[10px] text-text-tertiary w-5 text-right tabular-nums'>
              {Math.round(value ?? 0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function HorseScoresBarChart({
  horseScores,
  maxScore,
  showValue = true,
  showSubScores = true,
  className = '',
}: HorseScoresBarChartProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!horseScores?.length) return null;

  const scores = horseScores.map((h) => h.score ?? 0);
  const dataMax = Math.max(...scores, 1);
  const scaleMax = maxScore ?? Math.max(dataMax, 100);

  const hasAnySub = showSubScores && horseScores.some((h) => h.sub && Object.keys(h.sub).length > 0);

  return (
    <div className={`space-y-2 ${className}`} role='img' aria-label='말별 AI 점수 막대 차트'>
      {horseScores.map((h, i) => {
        const score = h.score ?? 0;
        const pct = scaleMax > 0 ? Math.min(100, (score / scaleMax) * 100) : 0;
        const label = h.hrName ?? h.horseName ?? '-';
        const isExpanded = expandedIndex === i;
        const hasSub = h.sub && Object.keys(h.sub).length > 0;

        return (
          <div key={i}>
            <div
              className={`flex items-center gap-2 text-sm ${hasAnySub && hasSub ? 'cursor-pointer active:bg-stone-50 rounded-md -mx-1 px-1' : ''}`}
              onClick={hasAnySub && hasSub ? () => setExpandedIndex(isExpanded ? null : i) : undefined}
            >
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
            {isExpanded && hasSub && <SubScoreBreakdown sub={h.sub} />}
          </div>
        );
      })}
      {hasAnySub && (
        <p className='text-[10px] text-text-tertiary text-center pt-1'>
          막대를 탭하면 세부 점수를 볼 수 있습니다
        </p>
      )}
    </div>
  );
}
