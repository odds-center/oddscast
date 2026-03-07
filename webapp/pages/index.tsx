import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { useAuthStore } from '@/lib/store/authStore';
import { routes } from '@/lib/routes';
import {
  DateHeader,
  TodaysFortuneCard,
  HomeQuickStats,
  TodayRacesSection,
  WeekRacesSection,
  RecentResultsSection,
  RecentRacesSection,
  PredictionMatrixPreviewSection,
  RacePredictionsPreviewSection,
AllRacesSection,
} from '@/components/home';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ResultApi from '@/lib/api/resultApi';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';
import { dayjsKST } from '@/lib/utils/dayjs';

export default function Home() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['results', 1, ''],
      queryFn: () => ResultApi.getResults({ limit: 40, page: 1 }),
      staleTime: 60 * 1000,
    });
  }, [queryClient]);

  const handleLoginClick = () => {
    setLoginError(null);
    window.location.href = routes.auth.login;
  };

  return (
    <Layout title='OddsCast'>
      {/* Hero banner */}
      <DateHeader />

      {/* Login + Quick stats bar */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 mb-4'>
        <HomeQuickStats />
        {!isLoggedIn && (
          <div className='flex items-center gap-2'>
            <button
              onClick={handleLoginClick}
              className='btn-primary flex items-center gap-2 px-4 py-2.5 text-sm w-full sm:w-auto justify-center'
            >
              <Icon name='LogIn' size={16} />
              로그인
            </button>
            {loginError && <p className='msg-error text-xs mt-1'>{loginError}</p>}
          </div>
        )}
      </div>

      {/* Race menu bar — KRA style */}
      <div className='flex items-center gap-2 mb-4 overflow-x-auto pb-0.5 -mx-1 px-1'>
        {[
          { href: `${routes.races.list}?date=today`, icon: 'Flag' as const, label: '발매경주' },
{ href: routes.results, icon: 'TrendingUp' as const, label: '경주성적' },
          { href: routes.predictions.matrix, icon: 'BarChart2' as const, label: '종합예상' },
          { href: routes.predictions.accuracy, icon: 'Target' as const, label: '예측 정확도' },
          { href: routes.weeklyPreview, icon: 'Calendar' as const, label: '주간프리뷰' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-stone-200 text-stone-600 text-sm font-medium hover:border-primary hover:text-primary active:bg-stone-50 transition-colors whitespace-nowrap touch-manipulation'
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <div className='grid lg:grid-cols-2 gap-4 mb-4'>
        <TodayRacesSection />
        <WeekRacesSection />
      </div>

      <div className='mb-4'>
        <RecentRacesSection />
      </div>

      {isLoggedIn && (
        <div className='grid lg:grid-cols-2 gap-4 mb-4'>
          <div className='lg:col-span-2'>
            <TodaysFortuneCard />
          </div>
        </div>
      )}
      <div className='grid lg:grid-cols-2 gap-4 mb-4'>
        <RecentResultsSection />
        <PredictionMatrixPreviewSection />
      </div>
      <div className='mb-4'>
        <RacePredictionsPreviewSection />
      </div>

      <div className='mb-4'>
        <AllRacesSection />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = new QueryClient();
  const weekDates: string[] = [];
  const today = dayjsKST();
  for (let i = 0; i < 7; i++) {
    weekDates.push(today.add(i, 'day').format('YYYYMMDD'));
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
            params: { date: 'today', limit: 30, page: 1 },
          });
          return res ?? { races: [], total: 0 };
        },
      }),
      queryClient.prefetchQuery({
        queryKey: ['races', 'week', 'count'],
        queryFn: async () => {
          const res = await serverGet<{ races?: { rcDate?: string }[] }>('/races', {
            params: { limit: 40, page: 1 },
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
            params: { limit: 30, page: 1 },
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
          serverGet<{ results?: unknown[] }>('/results', { params: { limit: 30, page: 1 } }),
      }),
      queryClient.prefetchQuery({
        queryKey: ['predictions', 'matrix', 'preview'],
        queryFn: () =>
          serverGet<{ raceMatrix?: unknown[]; experts?: unknown[] }>('/predictions/matrix'),
      }),
    ]);
  } catch {
    // If SSR fails, fetch on client
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};
