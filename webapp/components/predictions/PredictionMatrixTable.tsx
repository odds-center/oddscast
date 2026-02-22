/**
 * Comprehensive prediction matrix — Yongsan comprehensive style
 * Dark header, gate color numbers, race information included
 */
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

function RaceInfoCell({ row }: { row: MatrixRowDto }) {
  const entryNames = (row.entries ?? [])
    .filter((e) => e.hrName)
    .map((e) => e.hrName);

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
      {entryNames.length > 0 && (
        <p className='text-[10px] text-stone-400 mt-0.5 whitespace-normal leading-tight max-w-[160px]'>
          {entryNames.join(' · ')}
        </p>
      )}
    </Link>
  );
}

export interface PredictionMatrixTableProps {
  data: MatrixResponseDto;
  date?: string;
  locked?: boolean;
  previewCount?: number;
}

export default function PredictionMatrixTable({
  data,
  locked = false,
  previewCount = 3,
}: PredictionMatrixTableProps) {
  const { raceMatrix, experts } = data;
  const aiExpert = experts.find((e) => e.id === 'ai_consensus');
  const expertList = experts.filter((e) => e.id !== 'ai_consensus');
  const visibleRows = locked ? raceMatrix.slice(0, previewCount) : raceMatrix;
  const hiddenCount = locked ? Math.max(0, raceMatrix.length - previewCount) : 0;

  return (
    <div className='relative'>
      {/* Table header label */}
      <div className='flex items-center justify-between bg-[#292524] text-stone-200 px-3 py-2 rounded-t text-xs font-semibold'>
        <div className='flex items-center gap-2'>
          <Icon name='BarChart2' size={14} className='text-[#d4a942]' />
          <span>종합 예상표</span>
          <span className='text-stone-500'>|</span>
          <span className='text-stone-400 font-normal'>{raceMatrix.length}경주</span>
        </div>
        <span className='text-[#d4a942] font-normal'>AI GOLDEN RACE</span>
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
              <th className='text-center py-2 px-2 min-w-[72px] text-[11px] font-bold text-[#d4a942] whitespace-nowrap'>
                {aiExpert?.name ?? 'AI 종합'}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => (
              <tr
                key={row.raceId}
                className={`border-b border-stone-100 ${idx % 2 === 1 ? 'bg-stone-50/50' : ''}`}
              >
                <td className='sticky left-0 z-10 bg-inherit py-1.5 px-3 whitespace-nowrap'>
                  <RaceInfoCell row={row} />
                </td>
                {expertList.length > 0 && expertList.map((ex) => (
                  <td key={ex.id} className='text-center py-1.5 px-2 whitespace-nowrap'>
                    <PredictionCell val={row.predictions[ex.id] ?? '-'} horseNames={row.horseNames} />
                  </td>
                ))}
                <td className='text-center py-1.5 px-2 bg-[rgba(146,112,42,0.04)] whitespace-nowrap'>
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
                      <span className='text-[#92702A] text-[10px] font-semibold'>({row.consensusLabel})</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {raceMatrix.length === 0 && (
          <p className='text-stone-400 text-sm text-center py-8'>예상 데이터가 없습니다</p>
        )}
      </div>

      {/* Lock overlay */}
      {locked && hiddenCount > 0 && (
        <div className='relative mt-[-1px] border border-stone-200 rounded-b bg-gradient-to-b from-white to-stone-50 py-8 text-center'>
          <div className='absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/80 to-transparent pointer-events-none' />
          <Icon name='Lock' size={20} className='text-stone-400 mx-auto mb-2' />
          <p className='text-foreground font-semibold text-sm mb-1'>
            나머지 {hiddenCount}경주 예상 잠금
          </p>
          <p className='text-stone-400 text-xs'>
            종합 예측권으로 오늘의 전체 예상표를 확인하세요
          </p>
        </div>
      )}
    </div>
  );
}
