import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import AuthApi from '@/lib/api/authApi';
import NativeBridge from '@/lib/bridge';
import { useAuthStore } from '@/lib/store/authStore';
import { routes } from '@/lib/routes';
import {
  DateHeader,
  HomeQuickStats,
  TodayRacesSection,
  WeekRacesSection,
  RecentResultsSection,
  PredictionMatrixPreviewSection,
  RacePredictionsPreviewSection,
  RankingPreviewSection,
  AllRacesSection,
} from '@/components/home';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ResultApi from '@/lib/api/resultApi';
import Link from 'next/link';

export default function Home() {
  const [isNative, setIsNative] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['results', 1, ''],
      queryFn: () => ResultApi.getResults({ limit: 250, page: 1 }),
      staleTime: 60 * 1000,
    });
  }, [queryClient]);

  useEffect(() => {
    queueMicrotask(() => setIsNative(NativeBridge.isNativeApp()));
    const unsubSuccess = NativeBridge.subscribe(
      'LOGIN_SUCCESS',
      async (payload: unknown) => {
        const p = payload as { token?: string };
        const idToken = p.token;
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
    const unsubFailure = NativeBridge.subscribe('LOGIN_FAILURE', (payload: unknown) => {
      setLoginError((payload as { error?: string })?.error ?? '로그인에 실패했습니다.');
    });
    return () => {
      unsubSuccess();
      unsubFailure();
    };
  }, [setAuth]);

  const handleGoogleLogin = () => {
    if (isNative) {
      setLoginError(null);
      NativeBridge.send('LOGIN_GOOGLE');
    } else {
      window.location.href = routes.auth.login;
    }
  };

  return (
    <Layout title='GOLDEN RACE'>
      {/* 히어로 배너 */}
      <DateHeader />

      {/* 로그인 + 퀵스탯 바 */}
      <div className='flex items-center justify-between gap-3 mt-3 mb-3'>
        <HomeQuickStats />
        {!isLoggedIn && (
          <div className='flex items-center gap-2 shrink-0'>
            <button
              onClick={handleGoogleLogin}
              className='btn-primary flex items-center gap-1 px-3 py-1.5 text-xs'
            >
              <Icon name='LogIn' size={14} />
              {isNative ? 'Google 로그인' : '로그인'}
            </button>
            {loginError && <p className='msg-error text-xs'>{loginError}</p>}
          </div>
        )}
      </div>

      {/* 경주 메뉴 바 — KRA 스타일 */}
      <div className='flex items-center gap-1 mb-3 overflow-x-auto'>
        {[
          { href: `${routes.races.list}?date=today`, icon: 'Flag' as const, label: '발매경주' },
          { href: routes.results, icon: 'TrendingUp' as const, label: '경주성적' },
          { href: routes.predictions.matrix, icon: 'BarChart2' as const, label: '종합예상' },
          { href: routes.ranking, icon: 'Medal' as const, label: '예측랭킹' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-stone-200 text-stone-600 text-xs font-medium hover:border-[#92702A] hover:text-[#92702A] transition-colors whitespace-nowrap'
          >
            <Icon name={item.icon} size={13} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div className='grid lg:grid-cols-2 gap-3 mb-3'>
        <TodayRacesSection />
        <WeekRacesSection />
      </div>

      <div className='grid lg:grid-cols-2 gap-3 mb-3'>
        <RecentResultsSection />
        <PredictionMatrixPreviewSection />
      </div>

      <div className='grid lg:grid-cols-2 gap-3 mb-3'>
        <RacePredictionsPreviewSection />
        <RankingPreviewSection />
      </div>

      <div className='mb-3'>
        <AllRacesSection />
      </div>
    </Layout>
  );
}
