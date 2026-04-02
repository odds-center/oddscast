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
    <Layout title='OddsCast' description='AI 데이터 분석 기반 경마 예측 서비스. 실시간 경주 정보, 종합 예상표, 예측 적중률을 제공합니다.'>
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
      <div data-tour="home-quickmenu" className='flex items-center gap-2 mb-7 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide'>
        {[
          { href: `${routes.races.list}?date=today`, icon: 'Flag' as const, label: '발매경주', iconColor: 'text-emerald-600', pillColor: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
          { href: routes.results, icon: 'TrendingUp' as const, label: '경주성적', iconColor: 'text-blue-600', pillColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
          { href: routes.predictions.matrix, icon: 'BarChart2' as const, label: '종합예상', iconColor: 'text-violet-600', pillColor: 'bg-violet-50 border-violet-200 hover:bg-violet-100' },
          { href: routes.predictions.accuracy, icon: 'Target' as const, label: '예측 적중률', iconColor: 'text-amber-600', pillColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
          { href: routes.weeklyPreview, icon: 'Calendar' as const, label: '주간프리뷰', iconColor: 'text-rose-600', pillColor: 'bg-rose-50 border-rose-200 hover:bg-rose-100' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border shrink-0 transition-all touch-manipulation active:opacity-70 ${item.pillColor}`}
          >
            <Icon name={item.icon} size={15} className={item.iconColor} />
            <span className='text-sm font-semibold text-stone-700 whitespace-nowrap'>{item.label}</span>
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
