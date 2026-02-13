import Layout from '@/components/Layout';
import { routes } from '@/lib/routes';
import RaceCard from '@/components/RaceCard';
import Icon from '@/components/icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/page/PageHeader';
import FilterChips from '@/components/page/FilterChips';
import RaceApi from '@/lib/api/raceApi';
import AuthApi from '@/lib/api/authApi';
import NativeBridge from '@/lib/bridge';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export default function Home() {
  const [dateFilter, setDateFilter] = useState<string>('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', dateFilter],
    queryFn: () =>
      dateFilter === 'today'
        ? RaceApi.getRaces({ limit: 20, date: new Date().toISOString().slice(0, 10) } as any)
        : RaceApi.getRaces({ limit: 20, ...(dateFilter && { date: dateFilter }) } as any),
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
        } catch (err: any) {
          setLoginError(err?.message || '로그인에 실패했습니다.');
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
      <div className='flex flex-wrap gap-2 items-center mb-6'>
        <FilterChips
          options={[
            { value: '', label: '전체' },
            { value: 'today', label: '오늘' },
          ]}
          value={dateFilter === 'today' ? 'today' : ''}
          onChange={(v) => setDateFilter(v)}
        />
        <input
          type='date'
          value={dateFilter && dateFilter !== 'today' ? dateFilter : ''}
          onChange={(e) => setDateFilter(e.target.value || '')}
          className='input-base'
        />
      </div>

      {isLoading ? (
        <div className='py-16'>
          <LoadingSpinner size={32} label='경주 정보를 불러오는 중...' />
        </div>
      ) : error ? (
        <EmptyState
          icon='AlertCircle'
          title='경주 정보를 불러오지 못했습니다'
          description={(error as Error)?.message || '잠시 후 다시 시도해주세요.'}
          action={
            <button
              onClick={() => refetch()}
              className='btn-secondary px-4 py-2 text-sm'
            >
              다시 시도
            </button>
          }
        />
      ) : (
        <div className='space-y-2'>
          {data?.races?.map((race: any) => (
            <RaceCard key={race.id} race={race} />
          ))}
          {(!data?.races || data.races.length === 0) && (
            <EmptyState
              icon='Flag'
              title='진행 중인 경주가 없습니다'
              description='다른 날짜를 선택하거나 나중에 다시 확인해주세요.'
            />
          )}
        </div>
      )}
    </Layout>
  );
}
