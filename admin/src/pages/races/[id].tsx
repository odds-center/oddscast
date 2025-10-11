import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Race {
  id: string;
  rcNo: string;
  rcName: string;
  rcDate: string;
  rcTime?: string;
  meet: string;
  rcDist: string;
  rcGrade?: string;
  status?: string;
}

export default function RaceDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: race, isLoading } = useQuery({
    queryKey: ['race', id],
    queryFn: async () => {
      const response = await apiClient.get<Race>(`/api/admin/races/${id}`);
      return response;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
        </div>
      </Layout>
    );
  }

  if (!race) {
    return (
      <Layout>
        <div className='text-center py-12'>
          <p className='text-gray-500'>경주를 찾을 수 없습니다.</p>
          <Button onClick={() => router.back()} className='mt-4'>
            돌아가기
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{race.rcName} | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>{race.rcName}</h1>
              <p className='mt-2 text-sm text-gray-600'>경주 상세 정보</p>
            </div>
            <div className='flex gap-2'>
              <Button variant='ghost' onClick={() => router.back()}>
                목록으로
              </Button>
              <Button>수정</Button>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card title='경주 정보'>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      경주 번호
                    </label>
                    <div className='text-gray-900 text-lg font-semibold'>{race.rcNo}R</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>경주장</label>
                    <div className='text-gray-900'>{race.meet}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>경주일</label>
                    <div className='text-gray-900'>
                      {race.rcDate?.length === 8
                        ? `${race.rcDate.slice(0, 4)}-${race.rcDate.slice(
                            4,
                            6
                          )}-${race.rcDate.slice(6, 8)}`
                        : race.rcDate}
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>시간</label>
                    <div className='text-gray-900'>{race.rcTime || '-'}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>거리</label>
                    <div className='text-gray-900'>{race.rcDist}m</div>
                  </div>
                  {race.rcGrade && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>등급</label>
                      <div className='text-gray-900'>{race.rcGrade}</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card title='경주명'>
              <div className='text-lg font-semibold'>{race.rcName}</div>
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
}
