/**
 * Comprehensive prediction matrix — Yongsan comprehensive style
 * Locked: compact table showing race info only.
 * Unlocked: expanded per-race cards with full bet type analysis.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { MatrixResponseDto, MatrixRowDto } from '@/lib/api/predictionMatrixApi';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';
import BetTypePredictionsSection, { deriveFromHorseScores, predToDisplayNodesList } from './BetTypePredictionsSection';
import type { DisplayNodes } from './BetTypePredictionsSection';

function HorseBadge({ no, name }: { no: string; name?: string }) {
  const display = name || no;
  if (!display || display === '-') return <span className='text-stone-400 text-xs'>-</span>;
  return <span className='text-xs text-foreground font-medium whitespace-nowrap'>{display}</span>;
}

function PredictionCell({ val, horseNames }: { val: string[] | string; horseNames?: Record<string, string> }) {
  const arr = Array.isArray(val) ? val : [val].filter(Boolean);
  return (
    <div className='flex items-center justify-center gap-1.5 flex-nowrap'>
      {arr.map((v, i) => <HorseBadge key={i} no={v} name={horseNames?.[v]} />)}
      {arr.length === 0 && <span className='text-stone-400 text-xs'>-</span>}
    </div>
  );
}

function RaceInfoCell({ row }: { row: MatrixRowDto }) {
  return (
    <Link
      href={routes.races.detail(row.raceId)}
      className='block hover:bg-stone-50 -mx-1 px-1 rounded transition-colors'
    >
      <div className='flex items-baseline gap-1.5'>
        <span className='font-bold text-foreground text-sm whitespace-nowrap'>
          {row.rcNo}R
        </span>
        <span className='text-stone-500 text-xs whitespace-nowrap'>
          {row.meetName ?? row.meet}
        </span>
      </div>
      <div className='flex items-center gap-2 text-[11px] text-stone-400 mt-0.5'>
        {row.stTime && <span className='whitespace-nowrap'>{row.stTime}</span>}
        {row.rcDist && <span className='whitespace-nowrap'>{row.rcDist}m</span>}
        {row.rank && <span className='whitespace-nowrap'>{row.rank}</span>}
        {row.entryCount != null && row.entryCount > 0 && (
          <span className='whitespace-nowrap'>{row.entryCount}두</span>
        )}
      </div>
    </Link>
  );
}

export interface PredictionMatrixTableProps {
  data: MatrixResponseDto;
  date?: string;
  locked?: boolean;
}

const LAZY_INITIAL_ROWS = 12;
const LAZY_PAGE_SIZE = 12;

const BET_TYPE_LABELS: Record<string, string> = {
  SINGLE: '단승', PLACE: '연승', QUINELLA: '복승',
  EXACTA: '쌍승', QUINELLA_PLACE: '복연승', TRIFECTA: '삼복승', TRIPLE: '삼쌍승',
};
const BET_TYPE_ORDER_COMPACT = ['SINGLE', 'PLACE', 'QUINELLA', 'EXACTA', 'QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE'];

type ViewMode = 'detail' | 'compact';

export default function PredictionMatrixTable({
  data,
  locked = false,
}: PredictionMatrixTableProps) {
  const { raceMatrix, experts } = data;
  const aiExpert = experts.find((e) => e.id === 'ai_consensus');
  const expertList = experts.filter((e) => e.id !== 'ai_consensus');

  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [lazyCount, setLazyCount] = useState(LAZY_INITIAL_ROWS);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Always show all rows — race info is public
  const visibleRows = useMemo(() => {
    if (locked) return raceMatrix;
    return raceMatrix.slice(0, lazyCount);
  }, [locked, raceMatrix, lazyCount]);

  const hasMoreLazy = !locked && lazyCount < raceMatrix.length;

  useEffect(() => {
    if (locked || raceMatrix.length <= LAZY_INITIAL_ROWS) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setLazyCount((c) => Math.min(raceMatrix.length, c + LAZY_PAGE_SIZE));
      },
      { rootMargin: '120px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [locked, raceMatrix.length]);

  // Unlocked: expanded per-race cards or compact overview table
  if (!locked) {
    return (
      <div className='space-y-4'>
        {/* Header + view toggle */}
        <div className='flex items-center justify-between px-1'>
          <span className='flex items-center gap-1.5 text-xs text-stone-400'>
            <Icon name='BarChart2' size={13} className='text-primary' />
            <span className='font-semibold text-foreground'>종합 예상표</span>
            <span className='text-stone-500'>·</span>
            <span>{raceMatrix.length}경주</span>
          </span>
          <div className='flex items-center gap-1 rounded-lg border border-border bg-stone-50 p-0.5 text-xs'>
            <button
              onClick={() => setViewMode('detail')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${viewMode === 'detail' ? 'bg-white shadow-sm text-foreground' : 'text-stone-400 hover:text-foreground'}`}
            >
              상세
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${viewMode === 'compact' ? 'bg-white shadow-sm text-foreground' : 'text-stone-400 hover:text-foreground'}`}
            >
              한눈에
            </button>
          </div>
        </div>

        {/* Detail view: per-race cards with name + number */}
        {viewMode === 'detail' && (
          <>
            {visibleRows.map((row) => {
              const entries = (row.entries ?? []).map((e) => ({ hrNo: e.hrNo, hrName: e.hrName, chulNo: e.chulNo }));
              return (
                <div key={row.raceId} className='rounded-xl border border-border bg-card overflow-hidden shadow-sm'>
                  <div className='bg-[#1c1917] px-4 py-2.5 flex items-center justify-between'>
                    <Link
                      href={routes.races.detail(row.raceId)}
                      className='flex items-center gap-2 hover:opacity-80 transition-opacity'
                    >
                      <span className='font-bold text-white text-sm'>{row.rcNo}R</span>
                      <span className='text-stone-400 text-xs'>{row.meetName ?? row.meet}</span>
                      {row.stTime && <span className='text-stone-500 text-xs'>{row.stTime}</span>}
                      {row.rcDist && <span className='text-stone-600 text-xs'>{row.rcDist}m</span>}
                    </Link>
                    <Icon name='ChevronRight' size={14} className='text-stone-600' />
                  </div>
                  <div className='p-4'>
                    <BetTypePredictionsSection
                      horseScores={row.horseScores}
                      entries={entries}
                      showNumber
                      analysis={row.analysis}
                    />
                  </div>
                </div>
              );
            })}
            {hasMoreLazy && (
              <div ref={sentinelRef as React.RefObject<HTMLDivElement>} className='h-4' aria-hidden />
            )}
          </>
        )}

        {/* Compact view: all races in one table, gate numbers only */}
        {viewMode === 'compact' && (
          <div className='overflow-x-auto rounded-xl border border-border bg-card shadow-sm'>
            <table className='w-full border-collapse text-xs' style={{ minWidth: `${180 + BET_TYPE_ORDER_COMPACT.length * 72}px` }}>
              <thead>
                <tr className='bg-[#1c1917] text-stone-300'>
                  <th className='sticky left-0 z-10 bg-[#1c1917] text-left py-2 px-3 font-semibold whitespace-nowrap min-w-[100px]'>경주</th>
                  {BET_TYPE_ORDER_COMPACT.map((key) => (
                    <th key={key} className='text-center py-2 px-2 font-semibold whitespace-nowrap min-w-[72px]'>
                      {BET_TYPE_LABELS[key]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {raceMatrix.map((row, idx) => {
                  const entries = (row.entries ?? []).map((e) => ({ hrNo: e.hrNo, hrName: e.hrName, chulNo: e.chulNo }));
                  const derived = row.horseScores?.length
                    ? deriveFromHorseScores(row.horseScores, entries)
                    : {};
                  return (
                    <tr key={row.raceId} className={`border-b border-stone-100 ${idx % 2 === 1 ? 'bg-stone-50/50' : ''}`}>
                      <td className='sticky left-0 z-10 bg-inherit py-2 px-3 whitespace-nowrap'>
                        <Link href={routes.races.detail(row.raceId)} className='hover:text-primary transition-colors'>
                          <span className='font-bold text-foreground'>{row.rcNo}R</span>
                          <span className='text-stone-400 ml-1'>{row.meetName ?? row.meet}</span>
                        </Link>
                      </td>
                      {BET_TYPE_ORDER_COMPACT.map((key) => {
                        const pred = derived[key as keyof typeof derived];
                        const nodesList = pred ? predToDisplayNodesList(pred, entries) : [];
                        return (
                          <td key={key} className='text-center py-2 px-2 whitespace-nowrap'>
                            {nodesList.length > 0 ? (
                              <div className='flex flex-col gap-0.5 items-center'>
                                {nodesList.slice(0, 2).map((nodes, ci) => (
                                  <span key={ci} className='inline-flex items-center gap-0.5 text-foreground font-medium'>
                                    {nodes.numbers.map((num, i) => {
                                      const e = entries.find((x) => x.hrNo === num || x.chulNo === num);
                                      const display = e?.chulNo ?? num;
                                      return (
                                        <span key={i} className='flex items-center gap-0.5'>
                                          <span>{display}</span>
                                          {i < nodes.numbers.length - 1 && (
                                            <span className='text-stone-300'>{nodes.ordered ? '→' : '-'}</span>
                                          )}
                                        </span>
                                      );
                                    })}
                                    {ci < Math.min(nodesList.length, 2) - 1 && (
                                      <span className='text-stone-300 mx-0.5'>|</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className='text-stone-300'>-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {raceMatrix.length === 0 && (
          <p className='text-stone-400 text-sm text-center py-8'>예상 정보가 없습니다</p>
        )}
      </div>
    );
  }

  // Locked: compact table showing race list only
  return (
    <div className='relative'>
      <div className='flex items-center justify-between bg-[#292524] text-stone-200 px-3 py-2 rounded-t text-xs font-semibold'>
        <div className='flex items-center gap-2'>
          <Icon name='BarChart2' size={14} className='text-primary' />
          <span>종합 예상표</span>
          <span className='text-stone-500'>|</span>
          <span className='text-stone-400 font-normal'>{raceMatrix.length}경주</span>
        </div>
        <span className='inline-flex items-center gap-1 text-stone-400 font-normal'>
          <Icon name='Lock' size={11} />
          AI 예측 잠금
        </span>
      </div>
      <div className='overflow-x-auto border border-t-0 border-stone-200 rounded-b bg-white'>
        <table className='w-full min-w-[280px] border-collapse'>
          <thead>
            <tr className='bg-[#1c1917] text-stone-300'>
              <th className='text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap'>경주</th>
              <th className='text-center py-2 px-3 text-[11px] font-bold text-primary whitespace-nowrap'>AI 예측</th>
            </tr>
          </thead>
          <tbody>
            {raceMatrix.map((row, idx) => (
              <tr key={row.raceId} className={`border-b border-stone-100 ${idx % 2 === 1 ? 'bg-stone-50/50' : ''}`}>
                <td className='py-1.5 px-3 whitespace-nowrap'>
                  <RaceInfoCell row={row} />
                </td>
                <td className='text-center py-1.5 px-3 text-stone-300 text-xs'>-</td>
              </tr>
            ))}
          </tbody>
        </table>
        {raceMatrix.length === 0 && (
          <p className='text-stone-400 text-sm text-center py-8'>예상 정보가 없습니다</p>
        )}
      </div>
      <div className='mt-2 rounded border border-stone-200 bg-stone-50 py-4 px-4 text-center'>
        <div className='flex items-center justify-center gap-1.5 text-stone-500 text-sm mb-1'>
          <Icon name='Lock' size={14} />
          <span className='font-medium'>AI 예측 비공개</span>
        </div>
        <p className='text-stone-400 text-xs'>
          종합 예측권을 사용하면 전체 {raceMatrix.length}경주의 AI 예측을 확인할 수 있습니다
        </p>
      </div>
    </div>
  );
}
