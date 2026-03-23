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

  useEffect(() => {
    // Prefetch with same key as RecentResultsSection to share cache
    queryClient.prefetchQuery({
      queryKey: ['results', 'recent'],
      queryFn: () => ResultApi.getResults({ limit: 60, page: 1 }),
      staleTime: 60 * 1000,
    });
  }, [queryClient]);

  const handleLoginClick = () => {
    setLoginError(null);
    window.location.href = routes.auth.login;
  };

  return (
    <Layout title='OddsCast' description='AI 데이터 분석 기반 경마 예측 서비스. 실시간 경주 정보, 종합 예상표, 정확도 통계를 제공합니다.'>
      {/* 1. Hero banner */}
      <DateHeader />

      {/* 2. Quick stats + login */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 mb-4'>
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
      <div className='flex items-center gap-2 mb-5 overflow-x-auto pb-0.5 -mx-1 px-1'>
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
            className='inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white border border-stone-200 text-stone-700 text-sm font-semibold hover:border-primary hover:text-primary active:bg-stone-50 transition-colors whitespace-nowrap touch-manipulation'
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* 4. Today's races + This week */}
      <div className='grid lg:grid-cols-2 gap-4 mb-5'>
        <TodayRacesSection />
        <WeekRacesSection />
      </div>

      {/* 5. AI Predictions — core product, prominent placement */}
      <div className='mb-5'>
        <AIPredictionSection />
      </div>

      {/* 6. Recently viewed races */}
      <div className='mb-5'>
        <RecentRacesSection />
      </div>

      {/* 7. Accuracy + Fortune (trust & engagement) */}
      <div className='grid lg:grid-cols-2 gap-4 mb-5'>
        <AccuracyPreviewSection />
        <TodaysFortuneCard />
      </div>

      {/* 8. Recent results */}
      <div className='mb-5'>
        <RecentResultsSection />
      </div>

      {/* 9. Why OddsCast — non-logged-in only */}
      {!isLoggedIn && (
        <div className='mb-5'>
          <WhyOddsCastSection />
        </div>
      )}
    </Layout>
  );
}
