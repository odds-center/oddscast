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

export default function Home() {
  const [isNative, setIsNative] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setAuth = useAuthStore((s) => s.setAuth);
  const queryClient = useQueryClient();

  // 결과 페이지 진입 시 즉시 표시되도록 API 미리 prefetch
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
      <div className='flex flex-col gap-4 sm:gap-5 mb-5 sm:mb-8'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <DateHeader />
        {!isLoggedIn && (
          <div className='flex flex-col items-start sm:items-end gap-2 shrink-0'>
            <button
              onClick={handleGoogleLogin}
              className='btn-primary flex items-center gap-1.5 px-4 py-2 text-sm'
            >
              <Icon name='LogIn' size={18} />
              {isNative ? 'Google 로그인' : '로그인'}
            </button>
            {loginError && <p className='msg-error'>{loginError}</p>}
          </div>
        )}
        </div>
        <HomeQuickStats />
      </div>

      {/* 섹션 미리보기 — 모바일: gap-4 단일열, 데스크: gap-6 2열 */}
      <div className='grid lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10'>
        <TodayRacesSection />
        <WeekRacesSection />
      </div>

      <div className='grid lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10'>
        <RecentResultsSection />
        <PredictionMatrixPreviewSection />
      </div>

      <div className='grid lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10'>
        <RacePredictionsPreviewSection />
        <RankingPreviewSection />
      </div>

      {/* 전체 경주 목록 */}
      <div className='mb-6 sm:mb-8 lg:mb-10'>
        <AllRacesSection />
      </div>
    </Layout>
  );
}
