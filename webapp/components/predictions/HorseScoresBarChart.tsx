import { useState } from 'react';
import SimpleTooltip from '@/components/ui/SimpleTooltip';
import { SUB_SCORE_KEYS, getFactorLabel, getFactorTerm } from '@/lib/utils/factorTerms';
import type { PredictionHorseScore } from '@/lib/types/predictions';

interface HorseScoresBarChartProps {
  horseScores: PredictionHorseScore[];
  maxScore?: number;
  showValue?: boolean;
  showSubScores?: boolean;
  className?: string;
}

/** Rank medal emoji for top 3 */
function getRankDisplay(rank: number): { bg: string; text: string; icon: string } {
  if (rank === 1) return { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-700', icon: '🥇' };
  if (rank === 2) return { bg: 'bg-stone-50 border-stone-300', text: 'text-stone-600', icon: '🥈' };
  if (rank === 3) return { bg: 'bg-orange-50 border-orange-300', text: 'text-orange-700', icon: '🥉' };
  return { bg: 'bg-stone-50 border-stone-200', text: 'text-stone-400', icon: '' };
}

/** Score color by value */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 70) return 'text-green-600';
  if (score >= 60) return 'text-teal-600';
  return 'text-stone-500';
}

/** Bar color by rank */
function getBarStyle(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300';
  if (rank === 2) return 'bg-gradient-to-r from-stone-400 to-stone-300';
  if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-amber-300';
  return 'bg-stone-300/70';
}

function SubScoreBreakdown({ sub, horseName }: { sub: PredictionHorseScore['sub']; horseName: string }) {
  if (!sub) return null;
  const entries = SUB_SCORE_KEYS.map((key) => ({ key, value: sub[key] })).filter((e) => e.value != null);
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className='mt-2 p-2.5 rounded-lg bg-stone-50/90 border border-border/30'>
      {best && worst && (best.value ?? 0) > 20 && (
        <p className='text-[11px] text-text-secondary mb-2 leading-relaxed'>
          <span className='font-medium text-foreground'>{horseName}</span>{' '}
          <span className='text-emerald-700 font-medium'>{getFactorLabel(best.key)}</span>
          {(best.value ?? 0) >= 70 ? ' 우수' : ' 양호'}
          {(worst.value ?? 0) < 40 && (
            <>, <span className='text-stone-500'>{getFactorLabel(worst.key)}</span> 부족</>
          )}
        </p>
      )}
      <div className='grid grid-cols-2 gap-x-4 gap-y-1.5'>
        {entries.map(({ key, value }) => {
          const term = getFactorTerm(key);
          const pct = Math.min(100, value ?? 0);
          const isStrong = pct >= 70;
          const isWeak = pct < 40;
          return (
            <div key={key}>
              <SimpleTooltip content={term?.tooltip ?? ''} position='top' inline hideTriggerIcon>
                <div className='flex items-center justify-between mb-0.5 cursor-help'>
                  <span className={`text-[10px] font-medium ${isStrong ? 'text-emerald-700' : isWeak ? 'text-stone-400' : 'text-text-secondary'}`}>
                    {getFactorLabel(key)}
                  </span>
                  <span className='text-[10px] text-text-tertiary tabular-nums'>{Math.round(value ?? 0)}</span>
                </div>
              </SimpleTooltip>
              <div className='h-1 rounded-full bg-stone-200/60 overflow-hidden'>
                <div
                  className={`h-full rounded-full ${isStrong ? 'bg-emerald-500/70' : isWeak ? 'bg-stone-300/70' : 'bg-teal-400/60'}`}
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
  const dataMin = Math.min(...scores);
  const scaleMax = maxScore ?? Math.max(dataMax, 100);
  // Use relative scale: bars show difference from the floor (min - 10%)
  const floor = Math.max(0, dataMin * 0.85);

  const hasAnySub = showSubScores && horseScores.some((h) => h.sub && Object.keys(h.sub).length > 0);
  const top3 = horseScores.slice(0, 3);
  const rest = horseScores.slice(3);

  return (
    <div className={className} role='img' aria-label='AI horse composite score chart'>
      {/* ── Top 3 podium cards ── */}
      <div className='grid grid-cols-3 gap-2 mb-3'>
        {top3.map((h, i) => {
          const rank = i + 1;
          const score = h.score ?? 0;
          const label = h.hrName ?? h.horseName ?? '-';
          const rd = getRankDisplay(rank);
          const hasSub = hasAnySub && h.sub && Object.keys(h.sub).length > 0;
          const isExpanded = expandedIndex === i;

          return (
            <div
              key={i}
              className={`rounded-xl border ${rd.bg} p-2.5 text-center transition-all ${hasSub ? 'cursor-pointer active:scale-[0.98]' : ''} ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}
              onClick={hasSub ? () => setExpandedIndex(isExpanded ? null : i) : undefined}
            >
              <span className='text-lg leading-none'>{rd.icon}</span>
              <p className='text-xs font-semibold text-foreground mt-1 truncate' title={label}>
                {h.chulNo != null && <span className='text-text-tertiary'>{h.chulNo} </span>}
                {label}
              </p>
              <p className={`text-xl font-bold tabular-nums mt-0.5 ${getScoreColor(score)}`}>
                {Math.round(score)}
              </p>
              {h.winProb != null && h.winProb > 0 && (
                <p className='text-[10px] text-text-tertiary mt-0.5'>
                  승률 {h.winProb.toFixed(1)}%
                </p>
              )}
              {hasSub && (
                <p className='text-[9px] text-text-tertiary mt-1'>
                  {isExpanded ? '접기 ▲' : '세부 ▼'}
                </p>
              )}
              {isExpanded && hasSub && (
                <div className='mt-2 text-left'>
                  <SubScoreBreakdown sub={h.sub} horseName={label} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Remaining horses: compact bar list ── */}
      {rest.length > 0 && (
        <div className='rounded-lg border border-border/50 overflow-hidden'>
          {rest.map((h, i) => {
            const rank = i + 4;
            const score = h.score ?? 0;
            const label = h.hrName ?? h.horseName ?? '-';
            // Relative bar: show how far above the floor
            const range = scaleMax - floor;
            const barPct = range > 0 ? Math.min(100, Math.max(2, ((score - floor) / range) * 100)) : 50;
            const hasSub = hasAnySub && h.sub && Object.keys(h.sub).length > 0;
            const globalIdx = i + 3;
            const isExpanded = expandedIndex === globalIdx;

            return (
              <div key={globalIdx} className={`border-b border-border/30 last:border-b-0 ${isExpanded ? 'bg-stone-50/50' : ''}`}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 ${hasSub ? 'cursor-pointer active:opacity-80' : ''}`}
                  onClick={hasSub ? () => setExpandedIndex(isExpanded ? null : globalIdx) : undefined}
                >
                  {/* Rank number */}
                  <span className='w-5 text-center text-xs font-semibold text-stone-400 tabular-nums shrink-0'>
                    {rank}
                  </span>

                  {/* Horse name */}
                  <span className='w-16 sm:w-20 shrink-0 truncate text-xs text-foreground' title={label}>
                    {h.chulNo != null && <span className='text-text-tertiary'>{h.chulNo} </span>}
                    {label}
                  </span>

                  {/* Bar */}
                  <div className='flex-1 min-w-0'>
                    <div className='h-3.5 rounded bg-stone-100/80 overflow-hidden'>
                      <div
                        className={`h-full rounded ${getBarStyle(rank)} transition-[width] duration-400`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  {showValue && (
                    <span className={`w-8 text-right text-xs tabular-nums font-semibold shrink-0 ${getScoreColor(score)}`}>
                      {score > 0 ? Math.round(score) : '—'}
                    </span>
                  )}

                  {/* Expand arrow */}
                  {hasSub && (
                    <svg
                      className={`w-3 h-3 text-text-tertiary shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' d='m19 9-7 7-7-7' />
                    </svg>
                  )}
                </div>
                {isExpanded && hasSub && (
                  <div className='px-3 pb-2'>
                    <SubScoreBreakdown sub={h.sub} horseName={label} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasAnySub && (
        <p className='text-[10px] text-text-tertiary text-center mt-2'>
          카드/행을 탭하면 세부 분석을 볼 수 있습니다
        </p>
      )}
    </div>
  );
}
