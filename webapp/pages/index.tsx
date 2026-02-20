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
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';

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
    const unsubSuccess = NativeBridge.subscribe('LOGIN_SUCCESS', async (payload: unknown) => {
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
    });
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
          { href: routes.races.schedule, icon: 'Calendar' as const, label: '시행일' },
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

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = new QueryClient();
  const weekDates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }

  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['races', 'today'],
        queryFn: async () => {
          const res = await serverGet<{ races?: unknown[] }>('/races', {
            params: { date: 'today', limit: 12, page: 1 },
          });
          return res?.races ?? [];
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ['races', 'today', 'stats'],
        queryFn: async () => {
          const res = await serverGet<{ races?: unknown[]; total?: number }>('/races', {
            params: { date: 'today', limit: 100, page: 1 },
          });
          return res ?? { races: [], total: 0 };
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ['races', 'week', 'count'],
        queryFn: async () => {
          const res = await serverGet<{ races?: { rcDate?: string }[] }>('/races', {
            params: { limit: 150, page: 1 },
          });
          const races = res?.races ?? [];
          const total = races.filter((r) => {
            const d = (r.rcDate ?? '').replace(/-/g, '').slice(0, 8);
            return weekDates.some((wd) => d === wd);
          }).length;
          return { total };
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ['races', 'week'],
        queryFn: async () => {
          const res = await serverGet<{ races?: { rcDate?: string }[] }>('/races', {
            params: { limit: 50, page: 1 },
          });
          const races = (res?.races ?? []).filter((r) => {
            const d = (r.rcDate ?? '').replace(/-/g, '').slice(0, 8);
            return weekDates.some((wd) => d === wd);
          });
          return races;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ['results', 'recent'],
        queryFn: () =>
          serverGet<{ results?: unknown[] }>('/results', { params: { limit: 60, page: 1 } }),
      }),
      queryClient.prefetchQuery({
        queryKey: ['predictions', 'matrix', 'preview'],
        queryFn: () =>
          serverGet<{ raceMatrix?: unknown[]; experts?: unknown[] }>('/predictions/matrix'),
      }),
      queryClient.prefetchQuery({
        queryKey: ['predictions', 'races', 'preview'],
        queryFn: () =>
          serverGet<{ raceMatrix?: unknown[]; experts?: unknown[] }>('/predictions/matrix'),
      }),
      queryClient.prefetchQuery({
        queryKey: ['rankings', 'preview'],
        queryFn: async () => {
          const res = await serverGet<{ data?: unknown[] } | unknown[]>('/rankings', {
            params: { limit: 5 },
          });
          return Array.isArray(res) ? res : (res?.data ?? []);
        },
      }),
    ]);
  } catch {
    // SSR 실패 시 클라이언트에서 다시 fetch
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};
