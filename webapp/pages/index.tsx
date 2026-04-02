import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/authStore';
import { routes } from '@/lib/routes';
import {
  DateHeader,
  TodaysFortuneCard,
  HomeQuickStats,
  TodayRacesSection,
  WeekRacesSection,
  RecentRacesSection,
} from '@/components/home';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ResultApi from '@/lib/api/resultApi';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCoachMarkStore } from '@/lib/coachMark/coachMarkStore';
import { homeTourSteps } from '@/lib/coachMark/tours/homeTour';

const CoachMarkTour = dynamic(
  () => import('@/components/coach-mark/CoachMarkTour'),
  { ssr: false },
);

// Below-fold sections: lazy load to reduce initial bundle
const AIPredictionSection = dynamic(
  () => import('@/components/home/AIPredictionSection'),
  { ssr: false },
);
const AccuracyPreviewSection = dynamic(
  () => import('@/components/home').then((m) => ({ default: m.AccuracyPreviewSection })),
  { ssr: false },
);
const RecentResultsSection = dynamic(
  () => import('@/components/home').then((m) => ({ default: m.RecentResultsSection })),
  { ssr: false },
);
const WhyOddsCastSection = dynamic(
  () => import('@/components/home/WhyOddsCastSection'),
  { ssr: false },
);

export default function Home() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();
  const { shouldAutoStart, startTour } = useCoachMarkStore();

  useEffect(() => {
    // Prefetch with same key as RecentResultsSection to share cache
    queryClient.prefetchQuery({
      queryKey: ['results', 'recent'],
      queryFn: () => ResultApi.getResults({ limit: 60, page: 1 }),
      staleTime: 60 * 1000,
    });
  }, [queryClient]);

  useEffect(() => {
    if (!shouldAutoStart('homeTour', isLoggedIn)) return;
    const timer = setTimeout(() => startTour('homeTour'), 800);
    return () => clearTimeout(timer);
  }, [isLoggedIn, shouldAutoStart, startTour]);

  const handleLoginClick = () => {
    setLoginError(null);
    window.location.href = routes.auth.login;
  };

  return (
    <Layout title='OddsCast' description='AI 데이터 분석 기반 경마 예측 서비스. 실시간 경주 정보, 종합 예상표, 정확도 통계를 제공합니다.'>
      <CoachMarkTour tourId='homeTour' steps={homeTourSteps} />

      {/* 1. Hero banner */}
      <DateHeader />

      {/* 2. Quick stats + login */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-5 mb-5'>
        <HomeQuickStats />
        {!isLoggedIn && (
          <div className='flex items-center gap-2'>
            <Button
              onClick={handleLoginClick}
              className='w-full sm:w-auto'
            >
              <Icon name='LogIn' size={16} />
              로그인
            </Button>
            {loginError && <p className='text-error text-xs mt-1'>{loginError}</p>}
          </div>
        )}
      </div>

      {/* 3. Quick menu bar */}
      <div data-tour="home-quickmenu" className='flex items-center gap-3 mb-7 overflow-x-auto pb-1 -mx-1 px-1'>
        {[
          { href: `${routes.races.list}?date=today`, icon: 'Flag' as const, label: '발매경주', color: 'text-emerald-600 bg-emerald-50' },
          { href: routes.results, icon: 'TrendingUp' as const, label: '경주성적', color: 'text-blue-600 bg-blue-50' },
          { href: routes.predictions.matrix, icon: 'BarChart2' as const, label: '종합예상', color: 'text-violet-600 bg-violet-50' },
          { href: routes.predictions.accuracy, icon: 'Target' as const, label: '정확도', color: 'text-amber-600 bg-amber-50' },
          { href: routes.weeklyPreview, icon: 'Calendar' as const, label: '주간프리뷰', color: 'text-rose-600 bg-rose-50' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className='inline-flex flex-col items-center gap-2 px-5 py-4 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm active:bg-stone-50 transition-all whitespace-nowrap touch-manipulation shrink-0 min-w-[76px]'
          >
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${item.color}`}>
              <Icon name={item.icon} size={20} />
            </span>
            <span className='text-xs font-semibold text-stone-700'>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* 4. Today's races + This week */}
      <span data-tour="home-today-races" className='block h-0 -mb-0' />
      <div className='grid lg:grid-cols-2 gap-4 mb-6'>
        <TodayRacesSection />
        <WeekRacesSection />
      </div>

      {/* 5. AI Predictions — core product, prominent placement */}
      <span data-tour="home-ai-prediction" className='block h-0 -mb-0' />
      <div className='mb-6'>
        <AIPredictionSection />
      </div>

      {/* 6. Recently viewed races */}
      <div className='mb-6'>
        <RecentRacesSection />
      </div>

      {/* 7. Accuracy + Fortune (trust & engagement) */}
      <div className='grid lg:grid-cols-2 gap-4 mb-5'>
        <AccuracyPreviewSection />
        <TodaysFortuneCard />
      </div>

      {/* 8. Recent results */}
      <div className='mb-6'>
        <RecentResultsSection />
      </div>

      {/* 9. Why OddsCast — non-logged-in only */}
      {!isLoggedIn && (
        <div className='mb-6'>
          <WhyOddsCastSection />
        </div>
      )}
    </Layout>
  );
}
