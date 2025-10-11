import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <>
      <Head>
        <title>통계 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>통계</h1>
            <p className='mt-2 text-sm text-gray-600'>
              플랫폼의 주요 지표와 통계를 확인할 수 있습니다.
            </p>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card title='매출 통계' description='일별/월별 매출 현황'>
              <div className='flex items-center justify-center h-64'>
                <div className='text-center text-gray-500'>
                  <BarChart3 className='h-16 w-16 mx-auto mb-4' />
                  <p>매출 차트가 표시될 영역입니다.</p>
                </div>
              </div>
            </Card>

            <Card title='사용자 증가 추이' description='신규 가입자 및 활성 사용자'>
              <div className='flex items-center justify-center h-64'>
                <div className='text-center text-gray-500'>
                  <Users className='h-16 w-16 mx-auto mb-4' />
                  <p>사용자 차트가 표시될 영역입니다.</p>
                </div>
              </div>
            </Card>

            <Card title='베팅 통계' description='베팅 건수 및 금액'>
              <div className='flex items-center justify-center h-64'>
                <div className='text-center text-gray-500'>
                  <DollarSign className='h-16 w-16 mx-auto mb-4' />
                  <p>베팅 통계가 표시될 영역입니다.</p>
                </div>
              </div>
            </Card>

            <Card title='승률 분석' description='베팅 타입별 승률'>
              <div className='flex items-center justify-center h-64'>
                <div className='text-center text-gray-500'>
                  <TrendingUp className='h-16 w-16 mx-auto mb-4' />
                  <p>승률 분석이 표시될 영역입니다.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
}
