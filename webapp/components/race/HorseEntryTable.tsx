/**
 * Horse entry table — rich information + refined UI
 * No (gate), horse name, jockey/trainer, age/origin, weight carried, horse weight, rating, career record, recent ranks
 * Tap a row to expand radar chart showing AI sub-scores
 */
import { Fragment, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/icons';
import Tooltip from '@/components/ui/SimpleTooltip';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils/cn';
import { routes } from '@/lib/routes';
import HorseRadarChart from './HorseRadarChart';
import type { PredictionHorseScore } from '@/lib/types/predictions';

/** Horse entry fields required for rendering */
export interface HorseEntryRow {
  id?: string | number;
  hrNo: string;
  hrName: string;
  jkName?: string;
  trName?: string;
  owName?: string;
  chulNo?: string;
  wgBudam?: number;
  horseWeight?: string;
  rating?: number;
  sex?: string;
  age?: number;
  prd?: string;
  rcCntT?: number;
  ord1CntT?: number;
  recentRanks?: unknown;
  equipment?: string;
  budam?: string;
}

/** horseWeight "502(-2)" → { base: 502, delta: -2 } (horse weight in kg, change from previous) */
function parseHorseWeight(hw?: string): { base?: number; delta?: number } {
  if (!hw || typeof hw !== 'string') return {};
  const m = hw.match(/^(\d+)(\(([+-]?\d+)\))?$/);
  if (!m) return {};
  const base = parseInt(m[1], 10);
  const delta = m[3] != null ? parseInt(m[3], 10) : undefined;
  return { base, delta };
}

/** Age/origin format: prd (origin) + age + sex → Kr4M, US3F (example: Korean 4-year-old male, US 3-year-old female) */
function formatAgeSexOrigin(prd?: string, age?: number, sex?: string): string {
  const parts: string[] = [];
  const prdMap: Record<string, string> = { 한국: '한', 미국: '미', 일본: '일', 아일랜드: '아', 영국: '영' };
  if (prd) parts.push(prdMap[prd] ?? prd.slice(0, 1));
  if (age != null) parts.push(String(age));
  if (sex) parts.push(sex === '수' ? '수' : sex === '암' ? '암' : sex === '거' ? '거' : sex);
  return parts.length ? parts.join('') : '-';
}

/** Career record format: rcCntT, ord1CntT → "20R 3W" (20 races, 3 wins) */
function formatRecord(rcCntT?: number, ord1CntT?: number): string {
  if (rcCntT == null && ord1CntT == null) return '-';
  const total = rcCntT ?? 0;
  const wins = ord1CntT ?? 0;
  return total > 0 ? `${total}전 ${wins}승` : '-';
}

/** recentRanks [1,3,5] → "1-3-5" */
function formatRecentRanks(ranks?: unknown): string {
  if (!Array.isArray(ranks) || ranks.length === 0) return '-';
  return ranks.slice(0, 5).join('-');
}

export interface HorseEntryTableProps {
  entries: HorseEntryRow[];
  onSelectHorse?: (hrNo: string, hrName: string) => void;
  isSelected?: (hrNo: string) => boolean;
  /** When set, horse profile link includes ?from= so back button returns to this race */
  raceId?: string | number;
  /** Final win/place odds per horse (hrNo → odds). Only available for completed races. */
  oddsMap?: Map<string, { winOdds?: number; plcOdds?: number }>;
  /** AI horse scores — when provided, tapping a row shows radar chart */
  horseScores?: PredictionHorseScore[];
}

function horseProfileHref(hrNo: string, raceId?: string | number): string {
  const base = routes.horses.detail(hrNo);
  if (raceId != null) {
    return `${base}?from=${encodeURIComponent(routes.races.detail(String(raceId)))}`;
  }
  return base;
}

export default function HorseEntryTable({ entries, onSelectHorse, isSelected, raceId, oddsMap, horseScores }: HorseEntryTableProps) {
  const showOdds = !!oddsMap && oddsMap.size > 0;
  const [expandedHrNo, setExpandedHrNo] = useState<string | null>(null);

  // Build a map from hrNo/chulNo → sub-scores for radar chart
  const scoreMap = new Map<string, PredictionHorseScore>();
  if (horseScores) {
    for (const hs of horseScores) {
      if (hs.hrNo) scoreMap.set(String(hs.hrNo).trim(), hs);
      if (hs.chulNo) scoreMap.set(String(hs.chulNo).trim(), hs);
    }
  }
  const hasAnySubScores = horseScores?.some((h) => h.sub && Object.values(h.sub).some((v) => v != null && v > 0));

  const toggleExpand = (hrNo: string) => {
    if (onSelectHorse) {
      onSelectHorse(hrNo, entries.find((e) => e.hrNo === hrNo)?.hrName ?? '');
      return;
    }
    setExpandedHrNo((prev) => (prev === hrNo ? null : hrNo));
  };

  /** Radar chart panel for a horse */
  function RadarPanel({ hrNo }: { hrNo: string }) {
    const hs = scoreMap.get(hrNo) ?? scoreMap.get(entries.find((e) => e.hrNo === hrNo)?.chulNo ?? '');
    if (!hs?.sub || !Object.values(hs.sub).some((v) => v != null && v > 0)) return null;

    const sub = hs.sub;
    const score = hs.score ?? 0;
    const winProb = hs.winProb;

    // Compute race average for comparison
    const avgSub: Record<string, number> = {};
    if (horseScores) {
      const keys = ['rat', 'frm', 'cnd', 'exp', 'trn', 'suit'] as const;
      for (const k of keys) {
        const vals = horseScores.map((h) => h.sub?.[k] ?? 0).filter((v) => v > 0);
        avgSub[k] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      }
    }

    return (
      <div className='flex flex-col sm:flex-row items-center gap-3 px-4 py-3 bg-stone-50/80 border-t border-border/50'>
        <HorseRadarChart
          scores={sub as Record<string, number | undefined>}
          compareScores={Object.keys(avgSub).length > 0 ? avgSub : undefined}
          size={160}
        />
        <div className='flex-1 min-w-0 text-center sm:text-left'>
          <div className='flex items-center justify-center sm:justify-start gap-2 mb-2'>
            <span className='text-sm font-bold text-foreground tabular-nums'>종합 {Math.round(score)}점</span>
            {winProb != null && winProb > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                winProb >= 70 ? 'bg-emerald-100 text-emerald-700' :
                winProb >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-stone-100 text-stone-600'
              }`}>
                승률 {winProb.toFixed(1)}%
              </span>
            )}
          </div>
          {/* Sub-score mini bars */}
          <div className='grid grid-cols-2 gap-x-4 gap-y-1'>
            {(['rat', 'frm', 'cnd', 'exp', 'trn', 'suit'] as const).map((key) => {
              const val = sub[key] ?? 0;
              const labels: Record<string, string> = { rat: '레이팅', frm: '폼', cnd: '컨디션', exp: '경험', trn: '훈련', suit: '적합도' };
              return (
                <div key={key} className='flex items-center gap-1.5'>
                  <span className='text-[10px] text-text-tertiary w-10 text-right shrink-0'>{labels[key]}</span>
                  <div className='flex-1 h-1.5 rounded-full bg-stone-200/60 overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-primary/60 transition-all duration-300'
                      style={{ width: `${Math.min(100, val)}%` }}
                    />
                  </div>
                  <span className='text-[10px] tabular-nums text-text-secondary w-5 text-right'>{Math.round(val)}</span>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className='flex items-center gap-3 mt-2 text-[10px] text-text-tertiary justify-center sm:justify-start'>
            <span className='flex items-center gap-1'>
              <span className='w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/40' />
              이 말
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-2.5 h-2.5 rounded-sm bg-stone-200 border border-stone-300 border-dashed' />
              경주 평균
            </span>
          </div>
          {hs.reason && (
            <p className='text-xs text-text-secondary mt-2 leading-relaxed line-clamp-2'>{hs.reason}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2 sm:space-y-0'>
      {/* Tap hint */}
      {hasAnySubScores && !onSelectHorse && (
        <p className='text-[10px] text-text-tertiary text-center sm:text-right mb-1'>
          출전마를 탭하면 AI 능력 분석을 볼 수 있습니다
        </p>
      )}

      {/* Mobile: card layout */}
      <div className='block sm:hidden space-y-2'>
        {entries.map((e) => {
          const { base: hwBase, delta: hwDelta } = parseHorseWeight(e.horseWeight);
          const ageSex = formatAgeSexOrigin(e.prd, e.age ?? undefined, e.sex);
          const record = formatRecord(e.rcCntT, e.ord1CntT);
          const recentStr = formatRecentRanks(e.recentRanks);
          const isExpanded = expandedHrNo === e.hrNo;
          const hasRadar = scoreMap.has(e.hrNo) || scoreMap.has(e.chulNo ?? '');

          const odds = oddsMap?.get(e.hrNo);
          return (
            <div
              key={e.id ?? e.hrNo}
              className={cn(
                'rounded-xl border overflow-hidden transition-all duration-200',
                (hasRadar || onSelectHorse) && 'cursor-pointer active:scale-[0.99]',
                isSelected?.(e.hrNo)
                  ? 'ring-2 ring-primary-500 border-primary-400 bg-primary-50/30'
                  : isExpanded
                    ? 'border-primary/30 bg-primary/[0.02]'
                    : 'border-border bg-card hover:border-stone-300',
              )}
            >
              <div
                role={hasRadar || onSelectHorse ? 'button' : undefined}
                tabIndex={hasRadar || onSelectHorse ? 0 : undefined}
                onClick={() => toggleExpand(e.hrNo)}
                onKeyDown={(ev) => (hasRadar || onSelectHorse) && (ev.key === 'Enter' || ev.key === ' ') && toggleExpand(e.hrNo)}
                className='p-4'
              >
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    {e.chulNo != null && (
                      <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white text-xs font-bold shrink-0'>
                        {e.chulNo}
                      </span>
                    )}
                    <Link
                      href={horseProfileHref(e.hrNo, raceId)}
                      onClick={(ev) => ev.stopPropagation()}
                      className='font-semibold text-foreground hover:text-primary hover:underline'
                    >
                      {e.hrName}
                    </Link>
                    {e.rating != null && (
                      <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800'>
                        R{e.rating}
                      </span>
                    )}
                    {hasRadar && (
                      <svg
                        className={`w-3.5 h-3.5 text-text-tertiary ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}
                      >
                        <path strokeLinecap='round' strokeLinejoin='round' d='m19 9-7 7-7-7' />
                      </svg>
                    )}
                  </div>
                  <div className='flex items-center gap-2 mt-0.5 text-text-secondary text-sm'>
                    {e.jkName && <span>{e.jkName}</span>}
                    {e.trName && <span className='text-text-tertiary'>/ {e.trName}</span>}
                    {e.owName && <span className='text-text-tertiary'>/ {e.owName}</span>}
                  </div>
                  <div className='flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-text-tertiary'>
                    {ageSex !== '-' && <span>{ageSex}</span>}
                    {e.wgBudam != null && <span>부담 {e.wgBudam}kg</span>}
                    {hwBase != null && (
                      <span>
                        마체중 {hwBase}kg
                        {hwDelta != null && (
                          <span className={hwDelta > 0 ? ' text-stone-700' : hwDelta < 0 ? ' text-stone-500' : ''}>
                            {' '}({hwDelta >= 0 ? '+' : ''}{hwDelta})
                          </span>
                        )}
                      </span>
                    )}
                    {record !== '-' && <span>{record}</span>}
                    {recentStr !== '-' && <span>최근 {recentStr}</span>}
                    {e.equipment && <span>장구 {e.equipment}</span>}
                    {odds?.winOdds != null && (
                      <span className='text-emerald-700 font-medium'>단승 {odds.winOdds}</span>
                    )}
                    {odds?.plcOdds != null && (
                      <span className='text-teal-700 font-medium'>연승 {odds.plcOdds}</span>
                    )}
                  </div>
                </div>
                {onSelectHorse && isSelected?.(e.hrNo) && (
                  <Icon name='Check' size={20} className='shrink-0 text-primary-600' />
                )}
              </div>
              {/* Expanded radar chart */}
              {isExpanded && <RadarPanel hrNo={e.hrNo} />}
            </div>
          );
        })}
      </div>

      {/* Desktop: table layout */}
      <div className='hidden sm:block rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'>
        <Table className='min-w-max [&_th]:py-3 [&_td]:py-2.5'>
          <TableHeader>
            <TableRow className='bg-stone-50 border-b border-border hover:bg-stone-50'>
              <TableHead className='text-center w-10'>번호</TableHead>
              <TableHead className='text-left min-w-[90px]'>마명</TableHead>
              <TableHead className='text-left'>기수/조교사</TableHead>
              <TableHead className='text-left w-20'>마주</TableHead>
              <TableHead className='text-center w-16'>
                <Tooltip content='산지(한/미/일) + 연령 + 성별(수/암/거)' inline>마령</Tooltip>
              </TableHead>
              <TableHead className='text-right w-16'>
                <Tooltip content='기수 포함 경주 시 짊어지는 무게 (kg)' inline>부담</Tooltip>
              </TableHead>
              <TableHead className='text-right w-16'>
                <Tooltip content='경주 당일 말의 체중. 괄호 안은 전 대비 증감' inline>마체중</Tooltip>
              </TableHead>
              <TableHead className='text-right w-14'>
                <Tooltip content='KRA 능력 지표. 높을수록 경쟁력 우수' inline>레이팅</Tooltip>
              </TableHead>
              <TableHead className='text-center w-20'>
                <Tooltip content='통산 출전 횟수와 1위 횟수' inline>통산</Tooltip>
              </TableHead>
              <TableHead className='text-center w-24'>
                <Tooltip content='최근 5경기 착순 (1위=1, 미입상=0)' inline>최근</Tooltip>
              </TableHead>
              <TableHead className='text-left w-16 hidden md:table-cell'>
                <Tooltip content='경주 시 말에 장착하는 보조 장비 (차안대, 혀묶개 등)' inline>장구</Tooltip>
              </TableHead>
              {showOdds && (
                <TableHead className='text-right w-14'>
                  <Tooltip content='단승식 최종 배당률 (1위 적중 시 배당)' inline>단승</Tooltip>
                </TableHead>
              )}
              {showOdds && (
                <TableHead className='text-right w-14'>
                  <Tooltip content='연승식 최종 배당률 (3위 내 적중 시 배당)' inline>연승</Tooltip>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const { base: hwBase, delta: hwDelta } = parseHorseWeight(e.horseWeight);
              const entryOdds = oddsMap?.get(e.hrNo);

              return (
                <Fragment key={e.id ?? e.hrNo}>
                <TableRow
                  onClick={() => toggleExpand(e.hrNo)}
                  className={cn(
                    (onSelectHorse || hasAnySubScores) && 'cursor-pointer',
                    isSelected?.(e.hrNo) && 'bg-primary-50/50',
                    expandedHrNo === e.hrNo && 'bg-primary/[0.02]',
                  )}
                >
                  <TableCell className='text-center'>
                    {e.chulNo != null ? (
                      <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white text-xs font-bold'>
                        {e.chulNo}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={horseProfileHref(e.hrNo, raceId)}
                      onClick={(ev) => ev.stopPropagation()}
                      className='font-semibold text-foreground hover:text-primary hover:underline'
                    >
                      {e.hrName}
                    </Link>
                  </TableCell>
                  <TableCell className='text-text-secondary text-sm'>
                    <span>{e.jkName ?? '-'}</span>
                    {e.trName && <span className='text-text-tertiary'> / {e.trName}</span>}
                  </TableCell>
                  <TableCell className='text-text-secondary text-sm'>
                    {e.owName ?? '-'}
                  </TableCell>
                  <TableCell className='text-center text-sm text-text-secondary'>
                    {formatAgeSexOrigin(e.prd, e.age ?? undefined, e.sex)}
                  </TableCell>
                  <TableCell className='text-right text-sm tabular-nums'>
                    {e.wgBudam != null ? <span className='font-medium'>{e.wgBudam}kg</span> : '-'}
                  </TableCell>
                  <TableCell className='text-right text-sm tabular-nums'>
                    {hwBase != null ? (
                      <>
                        <span>{hwBase}kg</span>
                        {hwDelta != null && (
                          <span className={`ml-0.5 ${hwDelta > 0 ? 'text-stone-700' : hwDelta < 0 ? 'text-stone-500' : 'text-text-tertiary'}`}>
                            ({hwDelta >= 0 ? '+' : ''}{hwDelta})
                          </span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {e.rating != null ? (
                      <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800'>
                        {e.rating}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className='text-center text-sm text-text-secondary tabular-nums'>
                    {formatRecord(e.rcCntT, e.ord1CntT)}
                  </TableCell>
                  <TableCell className='text-center text-xs text-text-tertiary tabular-nums'>
                    {formatRecentRanks(e.recentRanks)}
                  </TableCell>
                  <TableCell className='text-xs text-text-tertiary hidden md:table-cell'>
                    {e.equipment ?? '-'}
                  </TableCell>
                  {showOdds && (
                    <TableCell className='text-right text-sm font-medium text-emerald-700 tabular-nums'>
                      {entryOdds?.winOdds ?? '-'}
                    </TableCell>
                  )}
                  {showOdds && (
                    <TableCell className='text-right text-sm font-medium text-teal-700 tabular-nums'>
                      {entryOdds?.plcOdds ?? '-'}
                    </TableCell>
                  )}
                </TableRow>
                {expandedHrNo === e.hrNo && (
                  <tr>
                    <td colSpan={showOdds ? 13 : 11} className='p-0'>
                      <RadarPanel hrNo={e.hrNo} />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {entries.length === 0 && (
        <div className='rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center'>
          <p className='text-text-secondary text-sm'>출전마 정보가 없습니다.</p>
          <p className='text-text-tertiary text-xs mt-1'>출전마 정보가 아직 등록되지 않았습니다.</p>
        </div>
      )}
    </div>
  );
}
