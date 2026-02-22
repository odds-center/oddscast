/**
 * Race predictions preview section — 1st place predicted horse number per race
 */
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import PredictionMatrixApi from '@/lib/api/predictionMatrixApi';
import type { MatrixRowDto } from '@/lib/api/predictionMatrixApi';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import { getGateBgColor } from '@/components/race/RaceHeaderCard';

function PickBadge({ no }: { no: string }) {
  if (!no || no === '-') return <span className='text-text-tertiary text-sm'>-</span>;
  const n = parseInt(no, 10) || 0;
  const bg = getGateBgColor(n);
  const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16'].includes(bg);
  return (
    <span
      className='inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded'
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

export default function RacePredictionsPreviewSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['predictions', 'races', 'preview'],
    queryFn: () => PredictionMatrixApi.getMatrix(undefined, undefined),
  });

  const rows = (data?.raceMatrix ?? []).slice(0, 6) as MatrixRowDto[];

  return (
    <HomeSection
      title='경주 예상지'
      icon='Target'
      viewAllHref={routes.predictions.matrix}
      viewAllLabel='더보기'
      accent
    >
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>예상 데이터를 불러오는 중...</div>
      ) : rows.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>예상 가능한 경주가 없습니다.</div>
      ) : (
        <ul className='divide-y divide-border'>
          {rows.map((row) => (
            <li key={row.raceId}>
              <Link
                href={routes.races.detail(row.raceId)}
                className='flex items-center justify-between py-2 first:pt-0 last:pb-0 hover:bg-stone-50 -mx-1 px-1 rounded transition-colors'
              >
                <span className='font-medium text-foreground'>
                  {row.meetName ?? row.meet} {row.rcNo}경
                  {row.stTime && (
                    <span className='text-text-tertiary text-sm ml-2'>{row.stTime}</span>
                  )}
                </span>
                <span className='flex items-center gap-2'>
                  <span className='text-text-secondary text-sm'>
                    {Array.isArray(row.predictions?.ai_consensus) &&
                    (row.predictions.ai_consensus as string[]).length > 1
                      ? '1·2위 예상'
                      : '1위 예상'}
                  </span>
                  <span className='flex items-center gap-1'>
                    {Array.isArray(row.predictions?.ai_consensus)
                      ? (row.predictions.ai_consensus as string[]).map((no, i) => (
                          <PickBadge key={i} no={no} />
                        ))
                      : (
                          <PickBadge no={row.aiConsensus ?? '-'} />
                        )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
