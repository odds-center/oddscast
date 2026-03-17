/**
 * Horse performance profile — race history, win rate, recent form
 */
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable, LinkBadge } from '@/components/ui';
import HorseApi from '@/lib/api/horseApi';
import type { HorseHistoryItem } from '@/lib/api/horseApi';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import { formatRcDate, formatMeet, formatRaceTime } from '@/lib/utils/format';
import { useState } from 'react';

export default function HorseProfilePage() {
  const router = useRouter();
  const hrNo = (router.query?.hrNo as string) ?? '';
  const [historyPage, setHistoryPage] = useState(1);

  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['horse', 'profile', hrNo],
    queryFn: () => HorseApi.getProfile(hrNo),
    enabled: !!hrNo,
    placeholderData: keepPreviousData,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['horse', 'history', hrNo, historyPage],
    queryFn: () => HorseApi.getHistory(hrNo, historyPage, 15),
    enabled: !!hrNo,
    placeholderData: keepPreviousData,
  });

  const historyItems = historyData?.items ?? [];
  const historyTotalPages = historyData?.totalPages ?? 1;
  const isEmpty = !profile && !profileLoading;

  return (
    <Layout title={profile ? `${profile.hrName} | OddsCast` : '마필 정보 | OddsCast'} description='마필 프로필, 경주 기록, 성적 데이터를 확인하세요.'>
      <CompactPageTitle
        title={profile?.hrName ?? '마필 정보'}
        backHref={router.query?.from ? String(router.query.from) : routes.home}
      />
      <DataFetchState
        isLoading={profileLoading && !profile}
        error={profileError}
        onRetry={() => refetchProfile()}
        isEmpty={isEmpty}
        emptyIcon='User'
        emptyTitle='마필 정보가 없습니다'
        emptyDescription='해당 말의 경주 이력이 없습니다.'
        loadingLabel='마필 정보 불러오는 중...'
      >
        {profile && (
          <>
            <SectionCard title='프로필' icon='User' className='mb-6'>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <div>
                  <p className='text-xs text-text-tertiary'>성별</p>
                  <p className='font-medium'>{profile.sex ?? '-'}</p>
                </div>
                <div>
                  <p className='text-xs text-text-tertiary'>연령</p>
                  <p className='font-medium'>{profile.age ?? '-'}</p>
                </div>
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
              </div>
              {profile.totalRaces > 0 && (
                <div className='mt-3 pt-3 border-t border-border'>
                  <p className='text-xs text-text-tertiary mb-1'>1위·3위 내 입상</p>
                  <p className='text-sm'>
                    {profile.winCount}승 {profile.placeCount}회 입상
                  </p>
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

            <SectionCard title='경주 이력' icon='ClipboardList' description='출주 경기 목록'>
              {historyLoading && !historyData ? (
                <p className='text-sm text-text-secondary py-4'>불러오는 중...</p>
              ) : historyItems.length === 0 ? (
                <p className='text-sm text-text-secondary py-4'>경주 이력이 없습니다.</p>
              ) : (
                <>
                  {/* Mobile: card list */}
                  <div className='block sm:hidden divide-y divide-border rounded-xl border border-border overflow-hidden mb-0'>
                    {historyItems.map((r) => (
                      <a
                        key={`${r.raceId}-${r.rcDate}`}
                        href={routes.races.detail(String(r.raceId))}
                        className='flex items-center justify-between py-2.5 px-3 active:bg-stone-50 transition-colors bg-card'
                      >
                        <div>
                          <p className='text-sm font-medium text-foreground'>
                            {formatMeet(r.meet)} {r.rcNo}R
                          </p>
                          <p className='text-xs text-text-tertiary mt-0.5'>
                            {formatRcDate(r.rcDate)}
                            {r.jkName && <span className='ml-2'>{r.jkName}</span>}
                          </p>
                        </div>
                        <div className='flex items-center gap-2 text-right shrink-0'>
                          {r.ord != null && (
                            <span className={`text-sm font-bold ${Number(r.ord) === 1 ? 'text-amber-600' : Number(r.ord) <= 3 ? 'text-stone-600' : 'text-text-tertiary'}`}>
                              {r.ord}위
                            </span>
                          )}
                          {r.rcTime && <span className='font-mono text-xs text-text-secondary'>{formatRaceTime(r.rcTime)}</span>}
                        </div>
                      </a>
                    ))}
                  </div>
                  {/* Desktop: table */}
                  <div className='hidden sm:block'>
                    <DataTable<HorseHistoryItem>
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
                          key: 'jkName',
                          header: '기수',
                          headerClassName: 'min-w-[60px]',
                          render: (r) => r.jkName ?? '-',
                        },
                        {
                          key: 'rcTime',
                          header: '기록',
                          align: 'center',
                          headerClassName: 'w-16',
                          render: (r) => <span className='font-mono'>{formatRaceTime(r.rcTime)}</span>,
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
