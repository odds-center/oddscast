/**
 * Trainer profile — career stats, recent form, race history
 */
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable, LinkBadge } from '@/components/ui';
import TrainerApi from '@/lib/api/trainerApi';
import type { TrainerProfile, TrainerHistoryItem } from '@/lib/api/trainerApi';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import { useState } from 'react';

function formatRcDate(rcDate: string): string {
  if (!rcDate || rcDate.length < 8) return rcDate;
  const y = rcDate.slice(0, 4);
  const m = rcDate.slice(4, 6);
  const d = rcDate.slice(6, 8);
  return `${y}.${m}.${d}`;
}

function formatMeet(meet: string): string {
  const map: Record<string, string> = {
    서울: '서울',
    제주: '제주',
    부산경남: '부산·경남',
  };
  return map[meet] ?? meet;
}

export default function TrainerProfilePage() {
  const router = useRouter();
  const trName = (router.query?.trName as string) ?? '';
  const [historyPage, setHistoryPage] = useState(1);

  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['trainer', 'profile', trName],
    queryFn: () => TrainerApi.getProfile(trName),
    enabled: !!trName,
    placeholderData: keepPreviousData,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['trainer', 'history', trName, historyPage],
    queryFn: () => TrainerApi.getHistory(trName, historyPage, 15),
    enabled: !!trName,
    placeholderData: keepPreviousData,
  });

  const historyItems = historyData?.items ?? [];
  const historyTotalPages = historyData?.totalPages ?? 1;
  const isEmpty = !profile && !profileLoading;

  return (
    <Layout title={profile ? `${profile.trName} — 조교사 정보` : '조교사 정보 — OddsCast'}>
      <CompactPageTitle
        title={profile?.trName ?? '조교사 정보'}
        backHref={router.query?.from ? String(router.query.from) : routes.home}
      />
      <DataFetchState
        isLoading={profileLoading && !profile}
        error={profileError as Error | null}
        onRetry={() => refetchProfile()}
        isEmpty={isEmpty}
        emptyIcon='User'
        emptyTitle='조교사 정보가 없습니다'
        emptyDescription='해당 조교사의 경주 이력이 없습니다.'
        loadingLabel='조교사 정보 불러오는 중...'
      >
        {profile && (
          <>
            <SectionCard title='프로필' icon='User' className='mb-6'>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <div>
                  <p className='text-xs text-text-tertiary'>통산 출전</p>
                  <p className='font-medium'>{profile.totalRaces}전</p>
                </div>
                <div>
                  <p className='text-xs text-text-tertiary'>승률 / 연대율</p>
                  <p className='font-medium'>
                    {profile.winRate}% / {profile.placeRate}%
                  </p>
                </div>
                <div>
                  <p className='text-xs text-text-tertiary'>1위·3위 내</p>
                  <p className='font-medium'>
                    {profile.winCount}승 {profile.placeCount}회 입상
                  </p>
                </div>
              </div>
              {profile.byMeet.length > 0 && (
                <div className='mt-3 pt-3 border-t border-border'>
                  <p className='text-xs text-text-tertiary mb-2'>경마장별</p>
                  <div className='flex flex-wrap gap-2'>
                    {profile.byMeet.map((m) => (
                      <span
                        key={m.meet}
                        className='inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-sm text-stone-700'
                      >
                        {formatMeet(m.meet)} {m.count}전 {m.winRate}% / {m.placeRate}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {profile.recentForm.length > 0 && (
              <SectionCard title='최근 순위' icon='TrendingUp' description='최근 10경기 착순' className='mb-6'>
                <div className='flex flex-wrap gap-2'>
                  {profile.recentForm.map((ord, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold ${
                        ord === 1
                          ? 'bg-amber-100 text-amber-800'
                          : ord <= 3
                            ? 'bg-stone-100 text-stone-700'
                            : 'bg-stone-50 text-stone-500'
                      }`}
                    >
                      {ord === 0 ? '-' : ord}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            <SectionCard title='경주 이력' icon='ClipboardList' description='조교사 출주 경기 목록'>
              {historyLoading && !historyData ? (
                <p className='text-sm text-text-secondary py-4'>불러오는 중...</p>
              ) : historyItems.length === 0 ? (
                <p className='text-sm text-text-secondary py-4'>경주 이력이 없습니다.</p>
              ) : (
                <>
                  <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'>
                    <DataTable<TrainerHistoryItem>
                      columns={[
                        {
                          key: 'race',
                          header: '경주',
                          headerClassName: 'min-w-[90px]',
                          render: (r) => (
                            <LinkBadge
                              href={routes.races.detail(String(r.raceId))}
                              icon='Flag'
                              iconSize={12}
                            >
                              {formatMeet(r.meet)} {r.rcNo}R
                            </LinkBadge>
                          ),
                        },
                        {
                          key: 'rcDate',
                          header: '일자',
                          headerClassName: 'w-24',
                          render: (r) => formatRcDate(r.rcDate),
                        },
                        {
                          key: 'ord',
                          header: '순위',
                          align: 'center',
                          headerClassName: 'w-14',
                          render: (r) => (r.ord != null ? r.ord : '-'),
                        },
                        {
                          key: 'hrName',
                          header: '마명',
                          headerClassName: 'min-w-[80px]',
                          render: (r) => r.hrName ?? '-',
                        },
                        {
                          key: 'rcTime',
                          header: '기록',
                          align: 'center',
                          headerClassName: 'w-16',
                          render: (r) => r.rcTime ?? '-',
                        },
                      ]}
                      data={historyItems}
                      getRowKey={(r) => `${r.raceId}-${r.rcDate}`}
                      getRowHref={(r) => routes.races.detail(String(r.raceId))}
                      compact
                    />
                  </div>
                  <Pagination
                    page={historyPage}
                    totalPages={historyTotalPages}
                    onPageChange={setHistoryPage}
                    className='mt-4'
                  />
                </>
              )}
            </SectionCard>
          </>
        )}
      </DataFetchState>
    </Layout>
  );
}
