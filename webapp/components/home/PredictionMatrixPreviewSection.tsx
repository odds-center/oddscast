/**
 * Prediction matrix preview section — dark header style
 */
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import PredictionMatrixApi from '@/lib/api/predictionMatrixApi';
import type { MatrixRowDto } from '@/lib/api/predictionMatrixApi';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import { getGateBgColor } from '@/components/race/RaceHeaderCard';

function HorseBadge({ no, name }: { no: string; name?: string }) {
  if (!no || no === '-') return <span className='text-stone-400'>-</span>;
  const n = parseInt(no, 10) || 0;
  const bg = getGateBgColor(n);
  const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16'].includes(bg);
  return (
    <span className='inline-flex items-center gap-0.5 whitespace-nowrap'>
      <span
        className='inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold rounded-sm shrink-0'
        style={{
          backgroundColor: bg,
          color: isLight ? '#1c1917' : '#fff',
          border: isLight ? '1px solid #d6d3d1' : 'none',
        }}
      >
        {no}
      </span>
      {name && <span className='text-[11px] text-foreground'>{name}</span>}
    </span>
  );
}

export default function PredictionMatrixPreviewSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['predictions', 'matrix', 'preview'],
    queryFn: () => PredictionMatrixApi.getMatrix(undefined, undefined),
  });

  const rows = (data?.raceMatrix ?? []).slice(0, 6);

  return (
    <HomeSection
      title='종합 예상지'
      icon='BarChart2'
      viewAllHref={routes.predictions.matrix}
      viewAllLabel='더보기'
      badge={rows.length > 0 ? `${rows.length}경` : undefined}
    >
      {isLoading ? (
        <div className='py-6 text-center text-stone-400 text-sm'>예상표 준비 중...</div>
      ) : rows.length === 0 ? (
        <div className='py-6 text-center text-stone-400 text-sm'>오늘 예상 정보가 없습니다.</div>
      ) : (
        <div className='overflow-x-auto rounded border border-stone-200'>
          <table className='w-full min-w-[280px] border-collapse'>
            <thead>
              <tr className='bg-[#292524] text-stone-300'>
                <th className='text-left py-1.5 px-2.5 text-[11px] font-semibold whitespace-nowrap'>경주</th>
                <th className='text-center py-1.5 px-2 text-[11px] font-semibold text-primary whitespace-nowrap'>AI 종합</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: MatrixRowDto, idx) => (
                <tr key={row.raceId} className={`border-b border-stone-100 ${idx % 2 === 1 ? 'bg-stone-50/50' : ''}`}>
                  <td className='py-1.5 px-2.5'>
                    <Link
                      href={routes.races.detail(row.raceId)}
                      className='font-medium text-foreground hover:text-primary hover:underline text-sm whitespace-nowrap'
                    >
                      {row.meetName ?? row.meet} {row.rcNo}R
                      {row.stTime && (
                        <span className='text-stone-400 text-xs ml-1'>({row.stTime})</span>
                      )}
                    </Link>
                  </td>
                  <td className='text-center py-1.5 px-2'>
                    <div className='flex items-center justify-center gap-1'>
                      {Array.isArray(row.predictions?.ai_consensus)
                        ? (row.predictions.ai_consensus as string[]).map((no, i) => (
                            <HorseBadge key={i} no={no} name={row.horseNames?.[no]} />
                          ))
                        : <HorseBadge no={row.aiConsensus ?? '-'} name={row.horseNames?.[row.aiConsensus ?? '']} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HomeSection>
  );
}
