import { useState } from 'react';
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

/** Rank badge color based on position */
function getRankStyle(rank: number): string {
  if (rank === 1) return 'bg-amber-400 text-amber-950 ring-1 ring-amber-500/30';
  if (rank === 2) return 'bg-stone-300 text-stone-800 ring-1 ring-stone-400/30';
  if (rank === 3) return 'bg-amber-700/80 text-amber-50 ring-1 ring-amber-700/30';
  return 'bg-stone-100 text-stone-500';
}

/** Bar gradient based on score percentage */
function getBarColor(pct: number): string {
  if (pct >= 80) return 'from-emerald-500 to-green-400';
  if (pct >= 60) return 'from-green-500 to-emerald-400';
  if (pct >= 40) return 'from-teal-500 to-cyan-400';
  return 'from-stone-400 to-stone-300';
}

/** Sub-score mini bars for a single horse */
function SubScoreBreakdown({ sub }: { sub: PredictionHorseScore['sub'] }) {
  if (!sub) return null;
  const entries = SUB_SCORE_KEYS
    .map((key) => ({ key, value: sub[key] }))
    .filter((e) => e.value != null);
  if (entries.length === 0) return null;

  return (
    <div className='grid grid-cols-3 gap-x-3 gap-y-1.5 mt-2 mb-1 ml-10 mr-12 p-2.5 rounded-lg bg-stone-50/80'>
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
            <div className='flex-1 h-1.5 rounded-full bg-stone-200/60 overflow-hidden'>
              <div
                className='h-full rounded-full bg-stone-400/70 transition-[width] duration-200'
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
    <div className={className} role='img' aria-label='말별 AI 점수 막대 차트'>
      <div className='divide-y divide-border/50'>
        {horseScores.map((h, i) => {
          const score = h.score ?? 0;
          const pct = scaleMax > 0 ? Math.min(100, (score / scaleMax) * 100) : 0;
          const label = h.hrName ?? h.horseName ?? '-';
          const isExpanded = expandedIndex === i;
          const hasSub = h.sub && Object.keys(h.sub).length > 0;
          const rank = i + 1;

          return (
            <div key={i} className={`py-2 first:pt-0 last:pb-0 ${isExpanded ? 'bg-stone-50/40 -mx-3 px-3 rounded-lg' : ''}`}>
              <div
                className={`flex items-center gap-2.5 ${hasAnySub && hasSub ? 'cursor-pointer' : ''}`}
                onClick={hasAnySub && hasSub ? () => setExpandedIndex(isExpanded ? null : i) : undefined}
              >
                {/* Rank badge */}
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${getRankStyle(rank)}`}>
                  {rank}
                </span>

                {/* Horse name + chulNo */}
                <span className='w-20 shrink-0 flex items-center gap-1 truncate' title={label}>
                  {h.chulNo != null && (
                    <span className='text-[11px] text-text-tertiary tabular-nums'>
                      {h.chulNo}번
                    </span>
                  )}
                  <span className='truncate text-sm font-medium text-foreground'>{label}</span>
                </span>

                {/* Bar */}
                <div className='min-w-0 flex-1'>
                  <div className='h-6 overflow-hidden rounded-md bg-stone-100/80'>
                    <div
                      className={`h-full rounded-md bg-gradient-to-r ${getBarColor(pct)} transition-[width] duration-500 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Score */}
                {showValue && (
                  <span className={`w-9 shrink-0 text-right tabular-nums text-sm ${rank <= 3 ? 'font-bold text-foreground' : 'font-semibold text-text-secondary'}`}>
                    {score > 0 ? Math.round(score) : '—'}
                  </span>
                )}

                {/* Expand indicator */}
                {hasAnySub && hasSub && (
                  <svg
                    className={`w-3.5 h-3.5 text-text-tertiary shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='m19 9-7 7-7-7' />
                  </svg>
                )}
              </div>
              {isExpanded && hasSub && <SubScoreBreakdown sub={h.sub} />}
            </div>
          );
        })}
      </div>
      {hasAnySub && (
        <p className='text-[10px] text-text-tertiary text-center pt-2.5 mt-1'>
          막대를 탭하면 세부 점수를 볼 수 있습니다
        </p>
      )}
    </div>
  );
}
