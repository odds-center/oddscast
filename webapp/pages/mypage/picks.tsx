import { useState } from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import Pagination from '@/components/page/Pagination';
import BackLink from '@/components/page/BackLink';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable } from '@/components/ui';
import Link from 'next/link';
import PicksApi, { PICK_TYPE_LABELS } from '@/lib/api/picksApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
import RequireLogin from '@/components/page/RequireLogin';
import { routes } from '@/lib/routes';

export default function PicksPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['picks', page],
    queryFn: () => PicksApi.getMyPicks(page, 20),
    enabled: isLoggedIn,
  });

  return (
    <Layout title='내가 고른 말 — GOLDEN RACE'>
      <PageHeader
        icon='Bookmark'
        title='내가 고른 말'
        description='경주별로 고른 말을 저장한 기록입니다. (사행성 없음 — 기록만 저장)'
      />

      {!isLoggedIn && <RequireLogin />}

        {isLoggedIn && (
          <DataFetchState
            isLoading={isLoading}
            error={error as Error | null}
            onRetry={() => refetch()}
            isEmpty={!data?.picks?.length}
            emptyIcon='Bookmark'
            emptyTitle='아직 고른 말이 없습니다'
            emptyDescription='경주 상세에서 마를 선택해보세요.'
            emptyAction={
              <Link href={routes.home} className='btn-primary px-4 py-2 text-sm inline-block'>
                경주 목록 보기
              </Link>
            }
            loadingLabel='내가 고른 말을 불러오는 중...'
          >
            <DataTable
              columns={[
                { key: 'race', header: '경주', headerClassName: 'min-w-[100px]', render: (pick) => (
                  <Link href={routes.races.detail(pick.raceId)} className='text-primary hover:underline font-medium'>
                    {pick.race?.meetName ?? '-'} {pick.race?.rcNo ?? '-'}경
                  </Link>
                ) },
                { key: 'type', header: '승식', headerClassName: 'w-20', cellClassName: 'text-text-secondary', render: (pick) => PICK_TYPE_LABELS[pick.pickType] || pick.pickType },
                { key: 'horses', header: '선택', headerClassName: 'min-w-[120px]', render: (pick) => (pick.hrNames || []).filter(Boolean).join(', ') || '-' },
                { key: 'points', header: '포인트', align: 'center', headerClassName: 'w-20', render: (pick) => (
                  pick.pointsAwarded != null && pick.pointsAwarded > 0 ? (
                    <span className='text-primary font-medium'>+{pick.pointsAwarded}pt</span>
                  ) : '-'
                ) },
              ]}
              data={data?.picks ?? []}
              getRowKey={(pick) => pick.id}
            />
            <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
          className='mt-6'
        />
          </DataFetchState>
        )}

        <BackLink href={routes.profile.index} label='내 정보로' />
    </Layout>
  );
}
