import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import { adminDashboardApi } from '@/lib/api/admin';
import {
  Users, CalendarDays, DollarSign, TrendingUp, Database,
  BarChart3, CreditCard, Settings, Bell, Award,
} from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todayRaces: number;
  todayBets: {
    count: number;
    amount: number;
  };
  totalBets: {
    count: number;
    amount: number;
    winAmount: number;
  };
  activeSubscriptions: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminDashboardApi.getStats(),
    refetchInterval: 30000,
  });

  const statCards = [
    {
      name: '총 회원 수',
      value: stats ? formatNumber(stats.totalUsers) : '-',
      sub: stats?.activeUsers ? `활성 ${formatNumber(stats.activeUsers)}명` : '-',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      name: '오늘 경주',
      value: stats ? formatNumber(stats.todayRaces) : '-',
      sub: '오늘 진행 예정',
      icon: CalendarDays,
      color: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
    },
    {
      name: '오늘 결제',
      value: stats?.todayBets ? formatCurrency(stats.todayBets.amount) : '-',
      sub: stats?.todayBets ? `${formatNumber(stats.todayBets.count)}건 결제` : '-',
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50',
    },
    {
      name: '활성 구독자',
      value: stats ? formatNumber(stats.activeSubscriptions) : '-',
      sub: '현재 구독 중',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
    },
  ];

  const quickLinks = [
    { href: '/users', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', name: '회원 관리', desc: '회원 목록, 예측권 지급, 상태 관리' },
    { href: '/races', icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50', name: '경주 관리', desc: '경주 일정, 출전마 조회' },
    { href: '/results', icon: Award, color: 'text-rose-600', bg: 'bg-rose-50', name: '경기 결과', desc: '경주 결과 조회 및 등록' },
    { href: '/bets', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50', name: '결제 내역', desc: '결제·예측권 구매 기록' },
    { href: '/kra', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50', name: 'KRA 데이터', desc: '출전표·결과 동기화' },
    { href: '/analytics', icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-50', name: 'AI 분석', desc: '예측 정확도·성능 분석' },
    { href: '/statistics', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', name: '통계', desc: '사용자·예측권 트렌드' },
    { href: '/revenue', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', name: '수익 대시보드', desc: '매출·비용·마진 분석' },
    { href: '/notifications', icon: Bell, color: 'text-pink-600', bg: 'bg-pink-50', name: '알림 관리', desc: '푸시 알림 전송 및 내역' },
    { href: '/settings', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50', name: '설정', desc: '시스템·AI·구독 설정' },
  ];

  return (
    <>
      <Head>
        <title>대시보드 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <PageHeader
            title='대시보드'
            description='GoldenRace 관리자 대시보드. 주요 지표를 한눈에 확인하세요.'
          />

          {/* 통계 카드 */}
          {isLoading ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='bg-white rounded-xl shadow-sm p-5 animate-pulse'>
                  <div className='h-3 bg-gray-200 rounded w-3/4 mb-4'></div>
                  <div className='h-7 bg-gray-200 rounded w-1/2'></div>
                </div>
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {statCards.map((stat) => (
                <div
                  key={stat.name}
                  className='relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-500'>{stat.name}</p>
                      <p className='mt-2 text-2xl font-bold text-gray-900'>{stat.value}</p>
                      <p className='mt-1 text-xs text-gray-400'>{stat.sub}</p>
                    </div>
                    <div className={`${stat.bgLight} p-2.5 rounded-xl`}>
                      <AdminIcon icon={stat.icon} className={`h-5 w-5 ${stat.color.includes('blue') ? 'text-blue-600' : stat.color.includes('emerald') ? 'text-emerald-600' : stat.color.includes('amber') ? 'text-amber-600' : 'text-purple-600'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {stats && (
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {/* 결제·예측권 통계 */}
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-5'>
                <div className='flex items-center gap-2 mb-4'>
                  <AdminIcon icon={CreditCard} className='w-5 h-5 text-indigo-500' />
                  <h3 className='font-semibold text-gray-900'>결제·예측권 요약</h3>
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center py-2'>
                    <span className='text-gray-600 text-sm'>총 결제 건수</span>
                    <span className='text-base font-bold text-gray-900'>
                      {formatNumber(stats.totalBets.count)}건
                    </span>
                  </div>
                  <div className='flex justify-between items-center py-2'>
                    <span className='text-gray-600 text-sm'>총 결제 금액</span>
                    <span className='text-base font-bold text-blue-600'>
                      {formatCurrency(stats.totalBets.amount)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center py-2'>
                    <span className='text-gray-600 text-sm'>총 당첨 금액</span>
                    <span className='text-base font-bold text-green-600'>
                      {formatCurrency(stats.totalBets.winAmount)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center py-3 border-t border-gray-100'>
                    <span className='text-gray-700 font-semibold text-sm'>순이익</span>
                    <span className='text-lg font-bold text-purple-600'>
                      {formatCurrency(stats.totalBets.amount - stats.totalBets.winAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 빠른 링크 */}
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-5'>
                <h3 className='font-semibold text-gray-900 mb-4'>빠른 링크</h3>
                <div className='grid grid-cols-2 gap-2.5'>
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className='flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group'
                    >
                      <div className={`${link.bg} p-2 rounded-lg shrink-0 group-hover:scale-105 transition-transform`}>
                        <AdminIcon icon={link.icon} className={`h-4 w-4 ${link.color}`} />
                      </div>
                      <div className='min-w-0'>
                        <div className='font-medium text-sm text-gray-900 truncate'>{link.name}</div>
                        <div className='text-xs text-gray-400 truncate'>{link.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
