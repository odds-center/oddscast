/**
 * 종합 예상 매트릭스 표 — 용산종합지 스타일
 * 가로 스크롤, 게이트 색상, 경주 클릭 → 상세
 */
import Link from 'next/link';
import type { MatrixResponseDto } from '@/lib/api/predictionMatrixApi';
import { getGateBgColor } from '@/components/race/RaceHeaderCard';
import { routes } from '@/lib/routes';

function GateBadge({ no, compact = false }: { no: string; compact?: boolean }) {
  if (!no || no === '-') return <span className='text-text-tertiary'>-</span>;
  const n = parseInt(no, 10) || 0;
  const bg = getGateBgColor(n);
  const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16'].includes(bg);
  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded ${
        compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
      }`}
      style={{
        backgroundColor: bg,
        color: isLight ? '#171717' : '#fff',
        border: isLight ? '1px solid #e5e7eb' : 'none',
      }}
    >
      {no}
    </span>
  );
}

function PredictionCell({ val }: { val: string[] | string }) {
  const arr = Array.isArray(val) ? val : [val].filter(Boolean);
  return (
    <div className='flex items-center gap-0.5 justify-center flex-wrap'>
      {arr.map((v, i) => (
        <GateBadge key={i} no={v} compact />
      ))}
      {arr.length === 0 && <span className='text-text-tertiary'>-</span>}
    </div>
  );
}

export interface PredictionMatrixTableProps {
  data: MatrixResponseDto;
  date?: string;
}

export default function PredictionMatrixTable({ data }: PredictionMatrixTableProps) {
  const { raceMatrix, experts } = data;
  const aiExpert = experts.find((e) => e.id === 'ai_consensus');
  const expertList = experts.filter((e) => e.id !== 'ai_consensus');

  return (
    <div className='data-table-wrapper -mx-4 sm:mx-0'>
      <table className='data-table w-full min-w-[400px]'>
        <thead>
          <tr>
            <th className='sticky left-0 z-10 bg-inherit min-w-[100px]'>
              경주
            </th>
            {expertList.length > 0 && expertList.map((ex) => (
              <th key={ex.id} className='cell-center min-w-[64px] text-text-secondary'>
                {ex.name}
              </th>
            ))}
            <th className='cell-center min-w-[64px] bg-primary/20 text-primary font-semibold'>
              {aiExpert?.name ?? 'AI 종합'}
            </th>
          </tr>
        </thead>
        <tbody>
          {raceMatrix.map((row) => (
            <tr key={row.raceId}>
              <td className='sticky left-0 z-10 bg-background'>
                <Link
                  href={routes.races.detail(row.raceId)}
                  className='font-medium text-primary hover:underline'
                >
                  {row.meetName ?? row.meet} {row.rcNo}R
                  {row.stTime && (
                    <span className='text-text-tertiary text-xs ml-1'>({row.stTime})</span>
                  )}
                </Link>
              </td>
              {expertList.length > 0 && expertList.map((ex) => (
                <td key={ex.id} className='cell-center'>
                  <PredictionCell val={row.predictions[ex.id] ?? '-'} />
                </td>
              ))}
              <td className='cell-center bg-primary/5'>
                <div className='flex items-center justify-center gap-1'>
                  <GateBadge no={row.aiConsensus} compact />
                  {row.consensusLabel && (
                    <span className='text-primary text-xs font-medium'>({row.consensusLabel})</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {raceMatrix.length === 0 && (
        <p className='text-text-secondary text-sm text-center py-8'>예상 데이터가 없습니다.</p>
      )}
    </div>
  );
}
