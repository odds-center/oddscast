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
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import BetTypePredictionsSection, { deriveFromHorseScores, predToDisplayNodesList } from './BetTypePredictionsSection';

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
      <div className='flex items-center gap-2 text-xs text-stone-500 mt-0.5'>
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
// Compact view: all 7 bet types
const BET_TYPE_ORDER_COMPACT = ['SINGLE', 'PLACE', 'QUINELLA', 'EXACTA', 'QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE'];

type ViewMode = 'detail' | 'compact';

export default function PredictionMatrixTable({
  data,
  locked = false,
}: PredictionMatrixTableProps) {
  const { raceMatrix } = data;

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
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setViewMode('detail')}
              className={`px-2.5 py-1 min-h-0 rounded-md text-xs ${viewMode === 'detail' ? 'bg-white shadow-sm text-foreground' : 'text-stone-400 hover:text-foreground'}`}
            >
              상세
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1 min-h-0 rounded-md text-xs ${viewMode === 'compact' ? 'bg-white shadow-sm text-foreground' : 'text-stone-400 hover:text-foreground'}`}
            >
              한눈에
            </Button>
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

        {/* Compact view: card-per-race, all 7 bet types */}
        {viewMode === 'compact' && (
          <div className='rounded-xl border border-border bg-card shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <div style={{ minWidth: '640px' }}>
                {/* Header */}
                <div className='bg-[#1c1917] grid text-stone-300 text-xs font-semibold' style={{ gridTemplateColumns: '68px repeat(7, 1fr)' }}>
                  <div className='py-2 px-3'>경주</div>
                  {BET_TYPE_ORDER_COMPACT.map((key) => (
                    <div key={key} className='py-2 px-0.5 text-center'>{BET_TYPE_LABELS[key]}</div>
                  ))}
                </div>
                {/* Rows */}
                {raceMatrix.map((row, idx) => {
                  const entries = (row.entries ?? []).map((e) => ({ hrNo: e.hrNo, hrName: e.hrName, chulNo: e.chulNo }));
                  const derived = row.horseScores?.length || entries.length
                    ? deriveFromHorseScores(row.horseScores ?? [], entries)
                    : {};
                  return (
                    <div
                      key={row.raceId}
                      className={`grid border-b border-stone-100 last:border-0 items-center text-xs ${idx % 2 === 1 ? 'bg-stone-50/40' : ''}`}
                      style={{ gridTemplateColumns: '68px repeat(7, 1fr)' }}
                    >
                      {/* Race */}
                      <Link href={routes.races.detail(row.raceId)} className='py-2.5 px-3 hover:text-primary transition-colors'>
                        <div className='font-bold text-foreground text-sm'>{row.rcNo}R</div>
                        <div className='text-stone-500 text-[11px]'>{row.meetName ?? row.meet}</div>
                      </Link>
                      {/* Bet type cells */}
                      {BET_TYPE_ORDER_COMPACT.map((key) => {
                        const pred = derived[key as keyof typeof derived];
                        const nodesList = pred ? predToDisplayNodesList(pred, entries) : [];
                        const topNodes = nodesList[0];
                        return (
                          <div key={key} className='py-2 px-0.5 text-center'>
                            {topNodes ? (
                              <span className='inline-flex items-center justify-center gap-0.5 flex-wrap font-semibold text-foreground'>
                                {topNodes.numbers.map((num, i) => {
                                  const e = entries.find((x) => x.hrNo === num || x.chulNo === num);
                                  const display = e?.chulNo ?? num;
                                  return (
                                    <span key={i} className='inline-flex items-center gap-0.5'>
                                      <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-[11px] font-bold'>
                                        {display}
                                      </span>
                                      {i < topNodes.numbers.length - 1 && (
                                        <span className='text-stone-400 text-[11px]'>{topNodes.ordered ? '→' : '-'}</span>
                                      )}
                                    </span>
                                  );
                                })}
                              </span>
                            ) : (
                              <span className='text-stone-300'>-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {raceMatrix.length === 0 && (
                  <p className='text-stone-400 text-sm text-center py-8'>예상 정보가 없습니다</p>
                )}
              </div>
            </div>
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
          <Icon name='Lock' size={13} />
          AI 예측 잠금
        </span>
      </div>
      <div className='border border-t-0 border-stone-200 rounded-b bg-white overflow-hidden'>
        <Table className='min-w-[280px] [&_th]:py-2 [&_th]:px-3 [&_td]:py-1.5 [&_td]:px-3'>
          <TableHeader>
            <TableRow className='bg-[#1c1917] hover:bg-[#1c1917]'>
              <TableHead className='text-stone-300'>경주</TableHead>
              <TableHead className='text-center text-primary font-bold'>AI 예측</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {raceMatrix.map((row, idx) => (
              <TableRow key={row.raceId} className={idx % 2 === 1 ? 'bg-stone-50/50' : ''}>
                <TableCell className='whitespace-nowrap'>
                  <RaceInfoCell row={row} />
                </TableCell>
                <TableCell className='text-center text-stone-300 text-xs'>-</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
