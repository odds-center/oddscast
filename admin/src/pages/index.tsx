import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { adminDashboardApi } from '@/lib/api/admin';
import { Users, CalendarDays, DollarSign, TrendingUp } from 'lucide-react';
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
      name: '오늘 마권',
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
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>대시보드</h1>
            <p className='mt-2 text-sm text-gray-600'>
              GoldenRace 관리자 시스템에 오신 것을 환영합니다.
            </p>
          </div>

          {isLoading ? (
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='bg-white rounded-lg shadow p-6 animate-pulse'>
                  <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
                  <div className='h-8 bg-gray-200 rounded w-1/2'></div>
                </div>
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
              {statCards.map((stat) => (
                <div
                  key={stat.name}
                  className='relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6'
                >
                  <dt>
                    <div className={`absolute rounded-md ${stat.color} p-3`}>
                      <stat.icon className='h-6 w-6 text-white' aria-hidden='true' />
                    </div>
                    <p className='ml-16 truncate text-sm font-medium text-gray-500'>{stat.name}</p>
                  </dt>
                  <dd className='ml-16 flex items-baseline'>
                    <p className='text-2xl font-semibold text-gray-900'>{stat.value}</p>
                    <p className='ml-2 flex items-baseline text-sm font-semibold text-green-600'>
                      {stat.change}
                    </p>
                  </dd>
                </div>
              ))}
            </div>
          )}

          {stats && (
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              <div className='bg-white rounded-lg shadow p-6'>
                <h3 className='text-lg font-semibold mb-4'>전체 베팅 통계</h3>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>총 베팅 건수</span>
                    <span className='text-xl font-bold'>
                      {formatNumber(stats.totalBets.count)}건
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>총 베팅 금액</span>
                    <span className='text-xl font-bold text-blue-600'>
                      {formatCurrency(stats.totalBets.amount)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-600'>총 당첨 금액</span>
                    <span className='text-xl font-bold text-green-600'>
                      {formatCurrency(stats.totalBets.winAmount)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center pt-3 border-t'>
                    <span className='text-gray-600 font-semibold'>순이익</span>
                    <span className='text-xl font-bold text-purple-600'>
                      {formatCurrency(stats.totalBets.amount - stats.totalBets.winAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg shadow p-6'>
                <h3 className='text-lg font-semibold mb-4'>빠른 링크</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <Link
                    href='/users'
                    className='p-4 border rounded-lg hover:bg-gray-50 transition-colors block'
                  >
                    <Users className='h-8 w-8 text-blue-500 mb-2' />
                    <div className='font-semibold'>회원 관리</div>
                    <div className='text-sm text-gray-500'>회원 목록 조회</div>
                  </Link>
                  <Link
                    href='/races'
                    className='p-4 border rounded-lg hover:bg-gray-50 transition-colors block'
                  >
                    <CalendarDays className='h-8 w-8 text-green-500 mb-2' />
                    <div className='font-semibold'>경주 관리</div>
                    <div className='text-sm text-gray-500'>경주 일정 관리</div>
                  </Link>
                  <Link
                    href='/bets'
                    className='p-4 border rounded-lg hover:bg-gray-50 transition-colors block'
                  >
                    <DollarSign className='h-8 w-8 text-yellow-500 mb-2' />
                    <div className='font-semibold'>마권 관리</div>
                    <div className='text-sm text-gray-500'>마권 내역 조회</div>
                  </Link>
                  <Link
                    href='/statistics'
                    className='p-4 border rounded-lg hover:bg-gray-50 transition-colors block'
                  >
                    <TrendingUp className='h-8 w-8 text-purple-500 mb-2' />
                    <div className='font-semibold'>통계</div>
                    <div className='text-sm text-gray-500'>상세 통계 보기</div>
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
