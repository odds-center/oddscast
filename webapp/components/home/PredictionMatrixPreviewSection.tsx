/**
 * Prediction matrix preview section — dark header style
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import PredictionMatrixApi from '@/lib/api/predictionMatrixApi';
import type { MatrixRowDto } from '@/lib/api/predictionMatrixApi';
import { Button } from '@/components/ui/button';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
function HorseBadge({ no, name }: { no: string; name?: string }) {
  const display = name || no;
  if (!display || display === '-') return <span className='text-stone-400'>-</span>;
  return <span className='text-xs text-foreground font-medium whitespace-nowrap'>{display}</span>;
}

export default function PredictionMatrixPreviewSection() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'matrix', 'preview'],
    queryFn: () => PredictionMatrixApi.getMatrix(undefined, undefined),
    placeholderData: keepPreviousData,
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
      ) : error ? (
        <div className='py-6 text-center text-text-secondary text-sm'>
          <p className='text-error text-xs'>일시적인 오류가 발생했습니다.</p>
          <Button type='button' variant='outline' size='sm' onClick={() => refetch()} className='mt-2'>
            다시 시도
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className='py-6 text-center text-stone-400 text-sm'>오늘 예상 정보가 없습니다.</div>
      ) : (
        <ul className='divide-y divide-border'>
          {rows.map((row: MatrixRowDto) => (
            <li key={row.raceId}>
              <Link
                href={routes.races.detail(row.raceId)}
                className='flex items-center justify-between py-2.5 first:pt-0 last:pb-0 active:bg-stone-50 -mx-0.5 px-0.5 rounded transition-colors'
              >
                <span className='font-medium text-foreground text-sm'>
                  {row.meetName ?? row.meet} {row.rcNo}R
                  {row.stTime && (
                    <span className='text-stone-400 text-xs ml-1.5'>{row.stTime}</span>
                  )}
                </span>
                <span className='flex items-center gap-1 shrink-0'>
                  {Array.isArray(row.predictions?.ai_consensus)
                    ? (row.predictions.ai_consensus as string[]).map((no, i) => (
                        <HorseBadge key={i} no={no} name={row.horseNames?.[no]} />
                      ))
                    : <HorseBadge no={row.aiConsensus ?? '-'} name={row.horseNames?.[row.aiConsensus ?? '']} />}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
