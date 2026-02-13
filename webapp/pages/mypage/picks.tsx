import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/page/PageHeader';
import Pagination from '@/components/page/Pagination';
import BackLink from '@/components/page/BackLink';
import PicksApi, { PICK_TYPE_LABELS } from '@/lib/api/picksApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function PicksPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['picks', page],
    queryFn: () => PicksApi.getMyPicks(page, 10),
    enabled: isLoggedIn,
  });

  return (
    <Layout title='내가 고른 말 — GOLDEN RACE'>
      <PageHeader
        icon='Bookmark'
        title='내가 고른 말'
        description='경주별로 고른 말을 저장한 기록입니다. (사행성 없음 — 기록만 저장)'
      />

      {!isLoggedIn && (
        <p className='text-text-secondary text-sm mb-4'>
          <Link href={routes.auth.login} className='link-primary'>
              로그인
            </Link>
            후 확인할 수 있습니다.
          </p>
        )}

        {isLoggedIn && isLoading ? (
          <div className='py-16'>
            <LoadingSpinner size={28} label='내가 고른 말을 불러오는 중...' />
          </div>
        ) : isLoggedIn && error ? (
          <EmptyState
            icon='AlertCircle'
            title='데이터를 불러오지 못했습니다'
            description={(error as Error)?.message}
            action={
              <button onClick={() => refetch()} className='btn-secondary px-4 py-2 text-sm'>
                다시 시도
              </button>
            }
          />
        ) : isLoggedIn ? (
          <div className='space-y-2'>
            {data?.picks?.map((pick) => (
              <Link
                key={pick.id}
                href={routes.races.detail(pick.raceId)}
                className='card card-hover flex items-center justify-between gap-3 py-4'
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary'>
                      {PICK_TYPE_LABELS[pick.pickType] || pick.pickType}
                    </span>
                    <span className='text-primary font-bold'>
                      {(pick.hrNos || []).map((h, i) => (
                        <span key={i}>
                          {i > 0 && '-'}{h}번
                        </span>
                      ))}
                    </span>
                    <span className='text-foreground'>
                      {(pick.hrNames || []).filter(Boolean).join(', ') || '-'}
                    </span>
                  </div>
                  <div className='text-text-secondary text-xs mt-0.5'>
                    {pick.race?.meetName} {pick.race?.rcNo}경주
                    {pick.pointsAwarded != null && pick.pointsAwarded > 0 && (
                      <span className='text-primary ml-2'>+{pick.pointsAwarded}pt</span>
                    )}
                  </div>
                  {pick.race?.rcDate && (
                    <div className='text-text-tertiary text-xs mt-1'>{pick.race.rcDate}</div>
                  )}
                </div>
                <Icon name='ChevronRight' size={20} className='text-text-tertiary shrink-0' />
              </Link>
            ))}
            {(!data?.picks || data.picks.length === 0) && (
              <EmptyState
                icon='Bookmark'
                title='아직 고른 말이 없습니다'
                description='경주 상세에서 마를 선택해보세요.'
                action={
                  <Link href={routes.home} className='btn-primary px-4 py-2 text-sm inline-block'>
                    경주 목록 보기
                  </Link>
                }
              />
            )}
          </div>
        ) : null}

        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
          className='mt-6'
        />
        <BackLink href={routes.profile.index} label='내 정보로' />
    </Layout>
  );
}
