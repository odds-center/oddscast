import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/page/PageHeader';
import Pagination from '@/components/page/Pagination';
import BackLink from '@/components/page/BackLink';
import FavoriteApi from '@/lib/api/favoriteApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';

/** 즐겨찾기 = 경주(경기)만 지원 */
export default function FavoritesPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['favorites', page],
    queryFn: () =>
      FavoriteApi.getFavorites({
        page,
        limit: 20,
        type: 'RACE',
      } as any),
    enabled: isLoggedIn,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => FavoriteApi.deleteFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const getLink = (fav: any) => {
    if (fav.targetData?.raceId) return routes.races.detail(fav.targetData.raceId);
    return routes.home;
  };

  return (
    <Layout title='즐겨찾기 — GOLDEN RACE'>
      <PageHeader
        icon='Heart'
        title='즐겨찾기'
        description='관심 있는 경주를 저장해두세요. 경주 상세에서 하트를 눌러 추가할 수 있습니다.'
      />

      {!isLoggedIn && (
        <p className='text-text-secondary text-sm mb-4'>
          <Link href={routes.auth.login} className='link-primary'>
            로그인
          </Link>
          후 확인할 수 있습니다.
        </p>
      )}

      {isLoggedIn && (
        <>
          {isLoading ? (
            <div className='py-16'>
              <LoadingSpinner size={28} label='즐겨찾기를 불러오는 중...' />
            </div>
            ) : error ? (
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
            ) : (
              <div className='space-y-2'>
                {(data?.favorites ?? []).map((fav) => (
                  <div
                    key={fav.id}
                    className='card flex items-center justify-between gap-3 py-4 min-h-[56px]'
                  >
                    <Link
                      href={getLink(fav)}
                      className='flex-1 min-w-0 touch-manipulation'
                    >
                      <span className='text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary'>
                        경주
                      </span>
                      <p className='text-foreground font-medium mt-1 truncate'>
                        {fav.targetName}
                      </p>
                      {fav.memo && (
                        <p className='text-text-tertiary text-xs mt-0.5 line-clamp-1'>
                          {fav.memo}
                        </p>
                      )}
                    </Link>
                    <button
                      onClick={() => deleteMutation.mutate(fav.id)}
                      disabled={deleteMutation.isPending}
                      className='p-2 text-text-tertiary hover:text-error transition-colors shrink-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center'
                      aria-label='삭제'
                    >
                      <Icon name='Trash2' size={18} />
                    </button>
                  </div>
                ))}
                {(!data?.favorites || data.favorites.length === 0) && (
                  <EmptyState
                    icon='Heart'
                    title='즐겨찾기가 없습니다'
                    description='경주 상세에서 하트를 눌러 추가해보세요.'
                    action={
                      <Link href={routes.home} className='btn-primary px-4 py-2 text-sm inline-block'>
                        경주 목록 보기
                      </Link>
                    }
                  />
                )}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={data?.totalPages ?? 1}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
              className='mt-6'
            />
          </>
        )}

        <BackLink href={routes.profile.index} label='내 정보로' />
    </Layout>
  );
}
