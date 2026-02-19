/**
 * 종합 예상지 미리보기 섹션 — 용산종합지 스타일 테이블 일부
 */
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import PredictionMatrixApi from '@/lib/api/predictionMatrixApi';
import type { MatrixRowDto } from '@/lib/api/predictionMatrixApi';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import { getGateBgColor } from '@/components/race/RaceHeaderCard';

function GateBadge({ no }: { no: string }) {
  if (!no || no === '-') return <span className='text-text-tertiary'>-</span>;
  const n = parseInt(no, 10) || 0;
  const bg = getGateBgColor(n);
  const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16'].includes(bg);
  return (
    <span
      className='inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded'
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
      viewAllLabel='전체보기'
    >
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>예상표를 불러오는 중...</div>
      ) : rows.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>오늘 예상 데이터가 없습니다.</div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='data-table data-table-compact w-full min-w-[280px]'>
            <thead>
              <tr>
                <th className='w-24'>경주</th>
                <th className='cell-center w-20'>AI 종합</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: MatrixRowDto) => (
                <tr key={row.raceId}>
                  <td>
                    <Link
                      href={routes.races.detail(row.raceId)}
                      className='font-medium text-slate-700 hover:underline'
                    >
                      {row.meetName ?? row.meet} {row.rcNo}R
                      {row.stTime && (
                        <span className='text-text-tertiary text-xs ml-1'>({row.stTime})</span>
                      )}
                    </Link>
                  </td>
                  <td className='cell-center'>
                    <div className='flex items-center justify-center gap-0.5 flex-wrap'>
                      {Array.isArray(row.predictions?.ai_consensus)
                        ? (row.predictions.ai_consensus as string[]).map((no, i) => (
                            <GateBadge key={i} no={no} />
                          ))
                        : (
                            <GateBadge no={row.aiConsensus ?? '-'} />
                          )}
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
