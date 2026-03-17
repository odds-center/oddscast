/**
 * Unified AI prediction section — tabs for matrix (comprehensive) and per-race picks
 * Combines PredictionMatrixPreviewSection + RacePredictionsPreviewSection into one.
 */
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import PredictionMatrixApi from '@/lib/api/predictionMatrixApi';
import type { MatrixRowDto } from '@/lib/api/predictionMatrixApi';
import { Button } from '@/components/ui/button';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';

type TabKey = 'matrix' | 'picks';

function HorseBadge({ no, name }: { no: string; name?: string }) {
  const display = name || no;
  if (!display || display === '-') return <span className='text-text-tertiary'>-</span>;
  return (
    <span className='inline-flex items-center px-2 py-0.5 rounded bg-primary/8 text-primary text-sm font-semibold whitespace-nowrap'>
      {display}
    </span>
  );
}

export default function AIPredictionSection() {
  const [tab, setTab] = useState<TabKey>('matrix');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'matrix', 'preview'],
    queryFn: () => PredictionMatrixApi.getMatrix(undefined, undefined),
    placeholderData: keepPreviousData,
  });

  const rows = (data?.raceMatrix ?? []).slice(0, 6) as MatrixRowDto[];

  return (
    <HomeSection
      title='AI 예상'
      icon='BarChart2'
      viewAllHref={routes.predictions.matrix}
      viewAllLabel='전체보기'
      accent
      badge={rows.length > 0 ? `${rows.length}경` : undefined}
    >
      {/* Tab switcher */}
      <div className='flex gap-1 mb-3 bg-stone-100 rounded-lg p-0.5'>
        <button
          type='button'
          onClick={() => setTab('matrix')}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors touch-manipulation ${
            tab === 'matrix'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-text-secondary hover:text-foreground'
          }`}
        >
          종합 예상
        </button>
        <button
          type='button'
          onClick={() => setTab('picks')}
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors touch-manipulation ${
            tab === 'picks'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-text-secondary hover:text-foreground'
          }`}
        >
          경주별 예상
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>예상 정보 준비 중...</div>
      ) : error ? (
        <div className='py-6 text-center text-text-secondary text-sm'>
          <p className='text-error text-xs'>일시적인 오류가 발생했습니다.</p>
          <Button type='button' variant='outline' size='sm' onClick={() => refetch()} className='mt-2'>
            다시 시도
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>
          오늘 예상 가능한 경주가 없습니다.
        </div>
      ) : tab === 'matrix' ? (
        /* Matrix tab: consensus picks per race */
        <ul className='divide-y divide-border'>
          {rows.map((row) => (
            <li key={row.raceId}>
              <Link
                href={routes.races.detail(row.raceId)}
                className='flex items-center justify-between py-3 first:pt-0 last:pb-0 active:bg-stone-50 -mx-0.5 px-0.5 rounded transition-colors'
              >
                <div>
                  <span className='font-semibold text-foreground text-sm'>
                    {row.meetName ?? row.meet} {row.rcNo}R
                  </span>
                  {row.stTime && (
                    <span className='text-text-tertiary text-xs ml-2'>{row.stTime}</span>
                  )}
                </div>
                <span className='flex items-center gap-1.5 shrink-0'>
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
      ) : (
        /* Picks tab: per-race 1st/2nd prediction with label */
        <ul className='divide-y divide-border'>
          {rows.map((row) => {
            const isMulti = Array.isArray(row.predictions?.ai_consensus) &&
              (row.predictions.ai_consensus as string[]).length > 1;
            return (
              <li key={row.raceId}>
                <Link
                  href={routes.races.detail(row.raceId)}
                  className='flex items-center justify-between py-3 first:pt-0 last:pb-0 active:bg-stone-50 -mx-0.5 px-0.5 rounded transition-colors'
                >
                  <div>
                    <span className='font-semibold text-foreground text-sm'>
                      {row.meetName ?? row.meet} {row.rcNo}R
                    </span>
                    {row.stTime && (
                      <span className='text-text-tertiary text-xs ml-2'>{row.stTime}</span>
                    )}
                  </div>
                  <span className='flex items-center gap-2 shrink-0'>
                    <span className='text-text-tertiary text-xs'>
                      {isMulti ? '1·2위' : '1위'}
                    </span>
                    <span className='flex items-center gap-1.5'>
                      {Array.isArray(row.predictions?.ai_consensus)
                        ? (row.predictions.ai_consensus as string[]).map((no, i) => (
                            <HorseBadge key={i} no={no} name={row.horseNames?.[no]} />
                          ))
                        : <HorseBadge no={row.aiConsensus ?? '-'} name={row.horseNames?.[row.aiConsensus ?? '']} />}
                    </span>
                    <Icon name='ChevronRight' size={14} className='text-stone-300' />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </HomeSection>
  );
}
