/**
 * Comprehensive prediction matrix — Yongsan comprehensive style
 * Dark header, gate color numbers, race information included.
 * Race info is always visible. AI predictions are blurred when locked.
 * Lazy loads rows when unlocked (Intersection Observer).
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import type { MatrixResponseDto, MatrixRowDto } from '@/lib/api/predictionMatrixApi';
import { getGateBgColor } from '@/components/race/RaceHeaderCard';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';

function HorseBadge({ no, name }: { no: string; name?: string }) {
  if (!no || no === '-') return <span className='text-stone-400 text-xs'>-</span>;
  const n = parseInt(no, 10) || 0;
  const bg = getGateBgColor(n);
  const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16'].includes(bg);
  return (
    <span className='inline-flex items-center gap-1 whitespace-nowrap'>
      <span
        className='inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-sm shrink-0'
        style={{
          backgroundColor: bg,
          color: isLight ? '#1c1917' : '#fff',
          border: isLight ? '1px solid #d6d3d1' : 'none',
        }}
      >
        {no}
      </span>
      {name && <span className='text-xs text-foreground font-medium'>{name}</span>}
    </span>
  );
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

/** Blurred placeholder for locked prediction cells */
function LockedCell() {
  return (
    <div className='flex items-center justify-center gap-1.5'>
      <span className='inline-block w-5 h-5 rounded-sm bg-stone-200 animate-pulse' />
      <span className='inline-block w-5 h-5 rounded-sm bg-stone-150 animate-pulse opacity-60' />
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
  previewCount?: number;
}

const LAZY_INITIAL_ROWS = 12;
const LAZY_PAGE_SIZE = 12;

export default function PredictionMatrixTable({
  data,
  locked = false,
  previewCount = 2,
}: PredictionMatrixTableProps) {
  const { raceMatrix, experts } = data;
  const aiExpert = experts.find((e) => e.id === 'ai_consensus');
  const expertList = experts.filter((e) => e.id !== 'ai_consensus');

  const [lazyCount, setLazyCount] = useState(LAZY_INITIAL_ROWS);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

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

  const colCount = expertList.length + 2; // race info + experts + ai consensus

  return (
    <div className='relative'>
      {/* Table header label */}
      <div className='flex items-center justify-between bg-[#292524] text-stone-200 px-3 py-2 rounded-t text-xs font-semibold'>
        <div className='flex items-center gap-2'>
          <Icon name='BarChart2' size={14} className='text-primary' />
          <span>종합 예상표</span>
          <span className='text-stone-500'>|</span>
          <span className='text-stone-400 font-normal'>{raceMatrix.length}경주</span>
        </div>
        {locked ? (
          <span className='inline-flex items-center gap-1 text-stone-400 font-normal'>
            <Icon name='Lock' size={11} />
            AI 예측 잠금
          </span>
        ) : (
          <span className='text-primary font-normal'>AI OddsCast</span>
        )}
      </div>

      {/* Main table */}
      <div className='overflow-x-auto border border-t-0 border-stone-200 rounded-b bg-white'>
        <table className='w-full min-w-[420px] border-collapse'>
          <thead>
            <tr className='bg-[#1c1917] text-stone-300'>
              <th className='sticky left-0 z-10 bg-[#1c1917] text-left py-2 px-3 min-w-[120px] text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap'>
                경주
              </th>
              {expertList.length > 0 && expertList.map((ex) => (
                <th key={ex.id} className='text-center py-2 px-2 min-w-[56px] text-[11px] font-semibold whitespace-nowrap'>
                  {ex.name}
                </th>
              ))}
              <th className='text-center py-2 px-2 min-w-[72px] text-[11px] font-bold text-primary whitespace-nowrap'>
                {aiExpert?.name ?? 'AI 종합'}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => {
              // First N rows show predictions as preview, rest are locked
              const isRowLocked = locked && idx >= previewCount;
              return (
                <tr
                  key={row.raceId}
                  className={`border-b border-stone-100 ${idx % 2 === 1 ? 'bg-stone-50/50' : ''}`}
                >
                  {/* Race info — always visible */}
                  <td className='sticky left-0 z-10 bg-inherit py-1.5 px-3 whitespace-nowrap'>
                    <RaceInfoCell row={row} />
                  </td>
                  {/* Prediction columns — blurred when locked */}
                  {expertList.length > 0 && expertList.map((ex) => (
                    <td key={ex.id} className='text-center py-1.5 px-2 whitespace-nowrap'>
                      {isRowLocked ? (
                        <LockedCell />
                      ) : (
                        <PredictionCell val={row.predictions[ex.id] ?? '-'} horseNames={row.horseNames} />
                      )}
                    </td>
                  ))}
                  <td className='text-center py-1.5 px-2 bg-[rgba(22,163,74,0.04)] whitespace-nowrap'>
                    {isRowLocked ? (
                      <LockedCell />
                    ) : (
                      <div className='flex items-center justify-center gap-1'>
                        <PredictionCell
                          val={
                            Array.isArray(row.predictions.ai_consensus)
                              ? row.predictions.ai_consensus
                              : row.aiConsensus ?? '-'
                          }
                          horseNames={row.horseNames}
                        />
                        {row.consensusLabel && (
                          <span className='text-primary text-[10px] font-semibold'>({row.consensusLabel})</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {hasMoreLazy && (
              <tr ref={sentinelRef} aria-hidden>
                <td colSpan={colCount} className='h-4 p-0 bg-transparent' />
              </tr>
            )}
          </tbody>
        </table>
        {raceMatrix.length === 0 && (
          <p className='text-stone-400 text-sm text-center py-8'>예상 정보가 없습니다</p>
        )}
      </div>

      {/* Lock info banner */}
      {locked && raceMatrix.length > previewCount && (
        <div className='mt-2 rounded border border-stone-200 bg-stone-50 py-4 px-4 text-center'>
          <div className='flex items-center justify-center gap-1.5 text-stone-500 text-sm mb-1'>
            <Icon name='Lock' size={14} />
            <span className='font-medium'>AI 예측 비공개</span>
          </div>
          <p className='text-stone-400 text-xs'>
            종합 예측권을 사용하면 전체 {raceMatrix.length}경주의 AI 예측을 확인할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
