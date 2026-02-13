import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { DataTable, LinkBadge, StatusBadge } from '@/components/ui';
import type { RaceDto } from '@/lib/types/race';
import PageHeader from '@/components/page/PageHeader';
import FilterDateBar from '@/components/page/FilterDateBar';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import RaceApi from '@/lib/api/raceApi';
import { routes } from '@/lib/routes';
import { formatRcDate } from '@/lib/utils/format';
import AuthApi from '@/lib/api/authApi';
import NativeBridge from '@/lib/bridge';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const RACES_PER_PAGE = 20;

export default function Home() {
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', dateFilter, page],
    queryFn: () => {
      const date =
        dateFilter === 'today' ? new Date().toISOString().slice(0, 10).replace(/-/g, '') : dateFilter;
      return RaceApi.getRaces({
        limit: RACES_PER_PAGE,
        page,
        ...(date && { date }),
      });
    },
  });

  const [isNative, setIsNative] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    setIsNative(NativeBridge.isNativeApp());
    const unsubSuccess = NativeBridge.subscribe(
      'LOGIN_SUCCESS',
      async (payload: { token: string }) => {
        const idToken = payload.token;
        if (!idToken) return;
        setLoginError(null);
        try {
          const res = await AuthApi.googleLogin(idToken);
          if (res?.accessToken) {
            setAuth(res.accessToken, res.user);
          }
        } catch (err: unknown) {
          setLoginError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
        }
      },
    );
    const unsubFailure = NativeBridge.subscribe('LOGIN_FAILURE', (payload: { error?: string }) => {
      setLoginError(payload?.error || '로그인에 실패했습니다.');
    });
    return () => {
      unsubSuccess();
      unsubFailure();
    };
  }, []);

  const handleGoogleLogin = () => {
    if (isNative) {
      setLoginError(null);
      NativeBridge.send('LOGIN_GOOGLE');
    } else {
      window.location.href = routes.auth.login;
    }
  };

  return (
    <Layout title='GOLDEN RACE — 실시간 경마'>
      <PageHeader
        icon='Flag'
        title='실시간 경마'
        children={
          !isLoggedIn && (
            <div className='flex flex-col items-start lg:items-end gap-2'>
              <button
                onClick={handleGoogleLogin}
                className='btn-primary flex items-center gap-2 px-5 py-2.5 text-sm shrink-0'
              >
                <Icon name='LogIn' size={18} />
                {isNative ? 'Google 로그인' : '로그인'}
              </button>
              {loginError && <p className='msg-error'>{loginError}</p>}
            </div>
          )
        }
      />
      <FilterDateBar
        filterOptions={[
          { value: '', label: '전체' },
          { value: 'today', label: '오늘' },
        ]}
        filterValue={dateFilter === 'today' ? 'today' : dateFilter || ''}
        onFilterChange={(v) => {
          setDateFilter(v);
          setPage(1);
        }}
        dateValue={dateFilter && dateFilter !== 'today' ? dateFilter : ''}
        onDateChange={(v) => {
          setDateFilter(v || '');
          setPage(1);
        }}
        dateId='race-date'
      />

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!data?.races?.length}
        emptyIcon='Flag'
        emptyTitle='진행 중인 경주가 없습니다'
        emptyDescription='다른 날짜를 선택하거나 나중에 다시 확인해주세요.'
        loadingLabel='경주 정보를 불러오는 중...'
        errorTitle='경주 정보를 불러오지 못했습니다'
      >
        <DataTable
          columns={[
            { key: 'race', header: '경주', headerClassName: 'w-24 whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (race) => (
              <LinkBadge href={routes.races.detail(race.id)} icon='Flag' iconSize={14}>
                {race.meetName ?? '-'} {race.rcNo}경
              </LinkBadge>
            ) },
            { key: 'date', header: '날짜', headerClassName: 'w-20 whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (race) => (
              <span className='text-text-secondary'>{formatRcDate(race.rcDate)}</span>
            ) },
            { key: 'dist', header: '거리', headerClassName: 'w-16 whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (race) => (
              race.rcDist ? <span className='badge-muted'>{race.rcDist}m</span> : <span className='text-text-tertiary'>-</span>
            ) },
            { key: 'start', header: '출발', headerClassName: 'w-16 whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (race) => {
              const st = race.stTime ?? (race as RaceDto & { rcStartTime?: string }).rcStartTime;
              return st ? <span className='badge-muted'>{st}</span> : <span className='text-text-tertiary'>-</span>;
            } },
            { key: 'entries', header: '출전마', headerClassName: 'w-[120px] max-w-[120px] whitespace-nowrap', cellClassName: 'text-text-secondary w-[120px] max-w-[120px] overflow-x-auto', render: (race) => {
              const r = race as RaceDto & { entries?: { hrName?: string }[]; entryDetails?: { hrName?: string }[] };
              const entries = (r.entries ?? r.entryDetails ?? []) as Array<{ hrName?: string }>;
              const preview = entries.map((e) => e.hrName ?? '').filter(Boolean).join(', ');
              return <div className='whitespace-nowrap min-w-max' title={preview}>{preview || '-'}</div>;
            } },
            { key: 'status', header: '상태', headerClassName: 'w-20 whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (race) => (
              <StatusBadge status={race.status || (race as RaceDto & { raceStatus?: string }).raceStatus || '-'} />
            ) },
          ]}
          data={data?.races ?? []}
          getRowKey={(race) => race.id}
          rowClassName={() => 'group'}
          className='text-[14px]'
        />

        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
          className='mt-4'
        />
      </DataFetchState>
    </Layout>
  );
}
