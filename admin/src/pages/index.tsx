import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import { adminDashboardApi } from '@/lib/api/admin';
import { Users, CalendarDays, DollarSign, TrendingUp, Database } from 'lucide-react';
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
    refetchInterval: 30000, // 30초마다 자동 새로고침
  });

  const statCards = [
    {
      name: '총 회원 수',
      value: stats ? formatNumber(stats.totalUsers) : '-',
      change: stats?.activeUsers ? `활성: ${formatNumber(stats.activeUsers)}` : '-',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: '오늘 경주',
      value: stats ? formatNumber(stats.todayRaces) : '-',
      change: '진행 예정',
      icon: CalendarDays,
      color: 'bg-green-500',
    },
    {
      name: '오늘 결제',
      value: stats?.todayBets ? formatCurrency(stats.todayBets.amount) : '-',
      change: stats?.todayBets ? `${formatNumber(stats.todayBets.count)}건` : '-',
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      name: '활성 구독자',
      value: stats ? formatNumber(stats.activeSubscriptions) : '-',
      change: '구독 중',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  return (
    <>
      <Head>
        <title>대시보드 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='대시보드'
            description='GoldenRace 관리자 시스템에 오신 것을 환영합니다.'
          />

          {isLoading ? (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='bg-white rounded-md shadow p-4 animate-pulse'>
                  <div className='h-3 bg-gray-200 rounded w-3/4 mb-3'></div>
                  <div className='h-6 bg-gray-200 rounded w-1/2'></div>
                </div>
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              {statCards.map((stat) => (
                <div
                  key={stat.name}
                  className='relative overflow-hidden rounded-md bg-white px-3 py-4 shadow sm:px-4'
                >
                  <dt>
                    <div className={`absolute rounded ${stat.color} p-2`}>
                      <AdminIcon icon={stat.icon} className='h-5 w-5 text-white' />
                    </div>
                    <p className='ml-12 truncate text-sm font-medium text-gray-500'>{stat.name}</p>
                  </dt>
                  <dd className='ml-12 flex items-baseline'>
                    <p className='text-lg font-semibold text-gray-900'>{stat.value}</p>
                    <p className='ml-1.5 flex items-baseline text-xs font-medium text-green-600'>
                      {stat.change}
                    </p>
                  </dd>
                </div>
              ))}
            </div>
          )}

          {stats && (
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <div className='bg-white rounded-md shadow p-4'>
                <h3 className='text-sm font-semibold mb-3'>결제·예측권 통계</h3>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>총 결제 건수</span>
                    <span className='text-base font-bold'>
                      {formatNumber(stats.totalBets.count)}건
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>총 결제 금액</span>
                    <span className='text-base font-bold text-blue-600'>
                      {formatCurrency(stats.totalBets.amount)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>총 당첨 금액</span>
                    <span className='text-base font-bold text-green-600'>
                      {formatCurrency(stats.totalBets.winAmount)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center pt-3 border-t'>
                    <span className='text-gray-600 font-semibold'>순이익</span>
                    <span className='text-base font-bold text-purple-600'>
                      {formatCurrency(stats.totalBets.amount - stats.totalBets.winAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-md shadow p-4'>
                <h3 className='text-sm font-semibold mb-3'>빠른 링크</h3>
                <div className='grid grid-cols-2 gap-3'>
                  <Link
                    href='/users'
                    className='p-3 border rounded hover:bg-gray-50 transition-colors block'
                  >
                    <AdminIcon icon={Users} className='h-6 w-6 text-blue-500 mb-1.5' />
                    <div className='font-medium text-sm'>회원 관리</div>
                    <div className='text-xs text-gray-500'>회원 목록 조회</div>
                  </Link>
                  <Link
                    href='/races'
                    className='p-3 border rounded hover:bg-gray-50 transition-colors block'
                  >
                    <AdminIcon icon={CalendarDays} className='h-6 w-6 text-green-500 mb-1.5' />
                    <div className='font-medium text-sm'>경주 관리</div>
                    <div className='text-xs text-gray-500'>경주 일정 관리</div>
                  </Link>
                  <Link
                    href='/bets'
                    className='p-3 border rounded hover:bg-gray-50 transition-colors block'
                  >
                    <AdminIcon icon={DollarSign} className='h-6 w-6 text-yellow-500 mb-1.5' />
                    <div className='font-medium text-sm'>결제 내역</div>
                    <div className='text-xs text-gray-500'>결제·예측권 내역 조회</div>
                  </Link>
                  <Link
                    href='/statistics'
                    className='p-3 border rounded hover:bg-gray-50 transition-colors block'
                  >
                    <AdminIcon icon={TrendingUp} className='h-6 w-6 text-purple-500 mb-1.5' />
                    <div className='font-medium text-sm'>통계</div>
                    <div className='text-xs text-gray-500'>상세 통계 보기</div>
                  </Link>
                  <Link
                    href='/kra'
                    className='p-3 border rounded hover:bg-gray-50 transition-colors block'
                  >
                    <AdminIcon icon={Database} className='h-6 w-6 text-amber-500 mb-1.5' />
                    <div className='font-medium text-sm'>KRA 데이터</div>
                    <div className='text-xs text-gray-500'>출전표·결과 수동 동기화</div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
