import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import PageLoading from '@/components/common/PageLoading';
import Button from '@/components/common/Button';
import { adminRacesApi } from '@/lib/api/admin';

type EditRaceForm = {
  rcName?: string;
  rcDist?: string;
  rank?: string;
  rcCondition?: string;
  weather?: string;
  track?: string;
};

interface RaceDetail {
  id: number;
  rcNo?: string;
  rcName?: string;
  rcDate?: string;
  rcTime?: string;
  meet?: string;
  meetName?: string;
  rcDist?: string;
  rank?: string;
  rcCondition?: string;
  weather?: string;
  track?: string;
  status?: string;
}

export default function RaceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: raceData, isLoading } = useQuery({
    queryKey: ['race', id],
    queryFn: () => adminRacesApi.getOne(id as string),
    enabled: !!id,
  });

  const race = raceData as RaceDetail | null | undefined;

  const { register, handleSubmit, reset } = useForm<EditRaceForm>();

  useEffect(() => {
    if (race && showEditModal) {
      reset({
        rcName: race.rcName ?? '',
        rcDist: race.rcDist ?? '',
        rank: race.rank ?? '',
        rcCondition: race.rcCondition ?? '',
        weather: race.weather ?? '',
        track: race.track ?? '',
      });
    }
  }, [race, showEditModal, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: EditRaceForm) =>
      adminRacesApi.update(id as string, {
        rcName: data.rcName,
        rcDist: data.rcDist,
        rank: data.rank,
        rcCondition: data.rcCondition,
        weather: data.weather,
        track: data.track,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race', id] });
      toast.success('경주 정보가 수정되었습니다');
      setShowEditModal(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '수정에 실패했습니다';
      toast.error(msg);
    },
  });

  const onEditSubmit = (data: EditRaceForm) => {
    updateMutation.mutate(data);
  };

  const openEditModal = () => setShowEditModal(true);

  if (isLoading) {
    return (
      <>
        <Head>
          <title>경주 상세 | OddsCast Admin</title>
        </Head>
        <Layout>
          <PageLoading label='경주 정보를 불러오는 중...' />
        </Layout>
      </>
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
        <title>{race.rcName || race.rcNo || '경주'} | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>{race.rcName}</h1>
              <p className='mt-2 text-sm text-gray-600'>경주 상세 정보</p>
            </div>
            <div className='flex gap-2'>
              <Button variant='ghost' onClick={() => router.back()}>
                목록으로
              </Button>
              <Button onClick={openEditModal}>수정</Button>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
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
                  {race.rank && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>등급</label>
                      <div className='text-gray-900'>{race.rank}</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card title='경주명'>
              <div className='text-lg font-semibold'>{race.rcName}</div>
            </Card>

            <Card
              title='출전마 데이터'
              description='웹앱에서 출전마가 보이지 않으면 KRA 출전표를 수동 동기화하세요.'
              className='lg:col-span-2'
            >
              <Link
                href={`/kra?date=${(race.rcDate || '').replace(/-/g, '').slice(0, 8)}`}
                className='inline-flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-800 rounded-md hover:bg-amber-100 text-sm font-medium'
              >
                출전표 수동 동기화 →
              </Link>
            </Card>
          </div>

          {showEditModal && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
              <div className='bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto'>
                <h2 className='text-lg font-bold mb-4'>경주 수정</h2>
                <form onSubmit={handleSubmit(onEditSubmit)} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>경주명</label>
                    <input
                      {...register('rcName')}
                      placeholder='경주명'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>거리 (m)</label>
                    <input
                      {...register('rcDist')}
                      placeholder='예: 1400'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>등급</label>
                    <input
                      {...register('rank')}
                      placeholder='예: 국6등급'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>조건</label>
                    <input
                      {...register('rcCondition')}
                      placeholder='경주 조건'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>날씨</label>
                    <input
                      {...register('weather')}
                      placeholder='예: 맑음'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>주로</label>
                    <input
                      {...register('track')}
                      placeholder='예: 건조 (2%)'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div className='flex gap-2 pt-4'>
                    <Button type='submit' variant='primary' disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={() => setShowEditModal(false)}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
