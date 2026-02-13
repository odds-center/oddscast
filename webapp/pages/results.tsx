import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/page/PageHeader';
import ResultApi from '@/lib/api/resultApi';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function Results() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', page, dateFilter],
    queryFn: () =>
      ResultApi.getResults({
        limit: 20,
        page,
        ...(dateFilter && { date: dateFilter }),
      }),
  });

  const rawResults = data?.results ?? [];
  // raceId 기준 유니크 (한 경주당 여러 결과 행이 올 수 있음)
  const seen = new Set<string>();
  const results = rawResults.filter((r: any) => {
    const id = r.raceId || r.id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const totalPages = data?.totalPages ?? 1;

  return (
    <Layout title='경주 결과 — GOLDEN RACE'>
      <PageHeader icon='TrendingUp' title='경주 결과' description='종료된 경주의 결과를 확인할 수 있습니다.' />
      <div className='flex flex-wrap gap-2 items-center mb-6'>
        <button
          onClick={() => setDateFilter('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !dateFilter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:border-border-gold'
          }`}
        >
          전체
        </button>
        <input
          type='date'
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value || '');
            setPage(1);
          }}
          className='px-4 py-2 rounded-lg text-sm bg-card border border-border text-foreground focus:border-primary/50'
        />
      </div>

      {isLoading ? (
        <div className='py-16'>
          <LoadingSpinner size={28} label='결과를 불러오는 중...' />
        </div>
      ) : error ? (
        <EmptyState
          icon='AlertCircle'
          title='결과를 불러오지 못했습니다'
          description={(error as Error)?.message || '잠시 후 다시 시도해주세요.'}
          action={
            <button onClick={() => refetch()} className='btn-secondary px-4 py-2 text-sm'>
              다시 시도
            </button>
          }
        />
      ) : (
        <>
          <div className='space-y-2'>
            {Array.isArray(results) &&
              results.map((r: any) => (
                <Link
                  key={r.id || r.raceId}
                  href={routes.races.detail(r.raceId || r.id)}
                  className='card card-hover block flex items-center justify-between gap-3 touch-manipulation min-h-[48px]'
                >
                  <div className='flex-1 min-w-0'>
                    <span className='text-foreground font-medium block'>
                      {r.race?.meetName || r.meetName} {r.race?.rcNo || r.rcNo}경주
                    </span>
                    <span className='text-text-secondary text-sm'>{r.race?.rcDate || r.rcDate}</span>
                  </div>
                  <Icon name='ChevronRight' size={20} className='text-text-tertiary shrink-0' />
                </Link>
              ))}
            {(!results || results.length === 0) && (
              <EmptyState
                icon='TrendingUp'
                title='결과 데이터가 없습니다'
                description='해당 조건에 맞는 경주 결과가 없습니다.'
              />
            )}
          </div>

          {totalPages > 1 && (
            <div className='flex justify-center gap-2 mt-6'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className='px-3 py-1.5 rounded bg-card border border-border disabled:opacity-50'
              >
                이전
              </button>
              <span className='py-1.5 text-sm'>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className='px-3 py-1.5 rounded bg-card border border-border disabled:opacity-50'
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
