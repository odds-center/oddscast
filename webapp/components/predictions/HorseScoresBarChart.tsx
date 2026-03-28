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
 * Horizontal bar chart for AI horse scores (0-100 scale).
 * Shows composite score with expandable sub-factor breakdown.
 */

/** Rank badge color based on position */
function getRankStyle(rank: number): string {
  if (rank === 1) return 'bg-amber-400 text-amber-950 ring-1 ring-amber-500/30';
  if (rank === 2) return 'bg-stone-300 text-stone-800 ring-1 ring-stone-400/30';
  if (rank === 3) return 'bg-amber-700/80 text-amber-50 ring-1 ring-amber-700/30';
  return 'bg-stone-100 text-stone-500';
}

/** Bar gradient + label based on score tier */
function getScoreTier(pct: number): { bar: string; label: string; labelColor: string } {
  if (pct >= 80)
    return { bar: 'from-emerald-500 to-green-400', label: '매우 유력', labelColor: 'text-emerald-700' };
  if (pct >= 60) return { bar: 'from-green-500 to-emerald-400', label: '유력', labelColor: 'text-green-700' };
  if (pct >= 40)
    return { bar: 'from-teal-500 to-cyan-400', label: '가능성 있음', labelColor: 'text-teal-700' };
  return { bar: 'from-stone-400 to-stone-300', label: '', labelColor: '' };
}

/** Sub-score mini bars for a single horse */
function SubScoreBreakdown({ sub, horseName }: { sub: PredictionHorseScore['sub']; horseName: string }) {
  if (!sub) return null;
  const entries = SUB_SCORE_KEYS.map((key) => ({ key, value: sub[key] })).filter((e) => e.value != null);
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className='mt-2.5 mb-1 ml-9 mr-2 p-3 rounded-xl bg-stone-50/90 border border-border/40'>
      {best && worst && (best.value ?? 0) > 20 && (
        <p className='text-xs text-text-secondary mb-2.5 leading-relaxed'>
          <span className='font-medium text-foreground'>{horseName}</span>{' '}
          <span className='text-emerald-700 font-medium'>{getFactorLabel(best.key)}</span>
          {(best.value ?? 0) >= 70 ? ' 우수' : ' 양호'}
          {(worst.value ?? 0) < 40 && (
            <>
              , <span className='text-stone-500'>{getFactorLabel(worst.key)}</span> 부족
            </>
          )}
        </p>
      )}

      <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
        {entries.map(({ key, value }) => {
          const term = getFactorTerm(key);
          const pct = Math.min(100, value ?? 0);
          const isStrong = pct >= 70;
          const isWeak = pct < 40;
          return (
            <div key={key}>
              <SimpleTooltip content={term?.tooltip ?? ''} position='top' inline hideTriggerIcon>
                <div className='flex items-center justify-between mb-0.5 cursor-help'>
                  <span
                    className={`text-[11px] font-medium ${isStrong ? 'text-emerald-700' : isWeak ? 'text-stone-400' : 'text-text-secondary'}`}
                  >
                    {getFactorLabel(key)}
                  </span>
                  <span className='text-[11px] text-text-tertiary tabular-nums'>{Math.round(value ?? 0)}</span>
                </div>
              </SimpleTooltip>
              <div className='h-1.5 rounded-full bg-stone-200/60 overflow-hidden'>
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ${
                    isStrong ? 'bg-emerald-500/70' : isWeak ? 'bg-stone-300/70' : 'bg-teal-400/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
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
    <div className={className} role='img' aria-label='AI horse composite score chart'>
      {/* Chart header */}
      <div className='flex items-center justify-between mb-3 pb-2 border-b border-border/40'>
        <div className='flex items-center gap-2'>
          <svg
            className='w-4 h-4 text-primary'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            />
          </svg>
          <span className='text-sm font-semibold text-foreground'>AI 종합 점수</span>
        </div>
        <SimpleTooltip
          content='레이팅, 폼/기세, 기수, 컨디션, 거리 적합도 등 15가지 요소를 종합 분석한 점수입니다. 점수가 높을수록 입상 가능성이 큽니다.'
          position='left'
          inline
        >
          <span className='text-[11px] text-text-tertiary cursor-help underline decoration-dotted underline-offset-2'>
            점수란?
          </span>
        </SimpleTooltip>
      </div>

      {/* Score tier legend */}
      <div className='flex items-center gap-3 mb-3 text-[10px] text-text-tertiary'>
        <span className='flex items-center gap-1'>
          <span className='w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-emerald-500 to-green-400' />
          80+ 매우 유력
        </span>
        <span className='flex items-center gap-1'>
          <span className='w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-green-500 to-emerald-400' />
          60+ 유력
        </span>
        <span className='flex items-center gap-1'>
          <span className='w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-teal-500 to-cyan-400' />
          40+ 가능성
        </span>
        <span className='flex items-center gap-1'>
          <span className='w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-stone-400 to-stone-300' />
          40 미만
        </span>
      </div>

      {/* Horse bars */}
      <div className='divide-y divide-border/50'>
        {horseScores.map((h, i) => {
          const score = h.score ?? 0;
          const pct = scaleMax > 0 ? Math.min(100, (score / scaleMax) * 100) : 0;
          const label = h.hrName ?? h.horseName ?? '-';
          const isExpanded = expandedIndex === i;
          const hasSub = h.sub && Object.keys(h.sub).length > 0;
          const rank = i + 1;
          const tier = getScoreTier(pct);

          return (
            <div
              key={i}
              className={`py-2.5 first:pt-0 last:pb-0 ${isExpanded ? 'bg-stone-50/40 -mx-3 px-3 rounded-lg' : ''}`}
            >
              <div
                className={`flex items-center gap-2.5 ${hasAnySub && hasSub ? 'cursor-pointer active:opacity-80' : ''}`}
                onClick={hasAnySub && hasSub ? () => setExpandedIndex(isExpanded ? null : i) : undefined}
              >
                {/* Rank badge */}
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getRankStyle(rank)}`}
                >
                  {rank}
                </span>

                {/* Horse name + chulNo + tier label */}
                <div className='w-[72px] shrink-0'>
                  <span className='flex items-center gap-1 truncate' title={label}>
                    {h.chulNo != null && (
                      <span className='text-[11px] text-text-tertiary tabular-nums'>{h.chulNo}</span>
                    )}
                    <span className='truncate text-sm font-medium text-foreground'>{label}</span>
                  </span>
                  {tier.label && rank <= 3 && (
                    <span className={`text-[10px] font-medium ${tier.labelColor}`}>{tier.label}</span>
                  )}
                </div>

                {/* Bar */}
                <div className='min-w-0 flex-1'>
                  <div className='h-6 overflow-hidden rounded-md bg-stone-100/80'>
                    <div
                      className={`h-full rounded-md bg-gradient-to-r ${tier.bar} transition-[width] duration-500 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Score */}
                {showValue && (
                  <span
                    className={`w-9 shrink-0 text-right tabular-nums text-sm ${rank <= 3 ? 'font-bold text-foreground' : 'font-semibold text-text-secondary'}`}
                  >
                    {score > 0 ? Math.round(score) : '—'}
                  </span>
                )}

                {/* Expand indicator */}
                {hasAnySub && hasSub && (
                  <svg
                    className={`w-3.5 h-3.5 text-text-tertiary shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='m19 9-7 7-7-7' />
                  </svg>
                )}
              </div>
              {isExpanded && hasSub && <SubScoreBreakdown sub={h.sub} horseName={label} />}
            </div>
          );
        })}
      </div>
      {hasAnySub && (
        <p className='text-[10px] text-text-tertiary text-center pt-2.5 mt-1'>
          말 이름을 탭하면 강점/약점 세부 분석을 볼 수 있습니다
        </p>
      )}
    </div>
  );
}
