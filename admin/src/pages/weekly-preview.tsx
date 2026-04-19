import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { AdminWeeklyPreviewApi } from '@/lib/api/admin';

export default function WeeklyPreviewPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');

  const { data: preview, isLoading } = useQuery({
    queryKey: ['admin', 'weekly-preview', 'latest'],
    queryFn: () => AdminWeeklyPreviewApi.getLatest(),
    staleTime: 5 * 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: () => AdminWeeklyPreviewApi.generate(date || undefined),
    onSuccess: (result) => {
      toast.success(`주간 프리뷰 생성 완료: ${result.weekLabel}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'weekly-preview'] });
    },
    onError: () => toast.error('주간 프리뷰 생성 실패'),
  });

  const content = preview?.content;
  const raceDates = Array.isArray(content?.raceDates) ? (content.raceDates as string[]) : [];
  const horsesToWatch = Array.isArray(content?.horsesToWatch)
    ? (content.horsesToWatch as string[])
    : [];

  return (
    <>
      <Head>
        <title>주간 프리뷰 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='주간 프리뷰 관리'
            description='매주 목요일 20:00 KST에 Gemini AI가 자동 생성합니다. 수동으로 즉시 생성할 수도 있습니다.'
          />

          {/* Generate card */}
          <Card title='수동 생성'>
            <div className='flex flex-wrap items-end gap-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  기준 날짜 <span className='text-gray-400 font-normal'>(비워두면 오늘)</span>
                </label>
                <input
                  type='date'
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
                />
              </div>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? '생성 중...' : '주간 프리뷰 생성'}
              </Button>
            </div>
            <p className='mt-2 text-xs text-gray-400'>
              금·토·일 선택 시 해당 주말, 월~목 선택 시 다음 주말 경주를 분석합니다.
            </p>
          </Card>

          {/* Current preview */}
          <Card title='최신 프리뷰'>
            {isLoading ? (
              <p className='text-sm text-gray-500'>불러오는 중...</p>
            ) : !preview?.weekLabel ? (
              <p className='text-sm text-gray-500'>아직 생성된 프리뷰가 없습니다.</p>
            ) : (
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                    기준 주차
                  </span>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800'>
                    {preview.weekLabel}
                  </span>
                </div>

                {raceDates.length > 0 && (
                  <div>
                    <p className='text-xs font-medium text-gray-500 mb-1'>대상 경주일</p>
                    <div className='flex flex-wrap gap-2'>
                      {raceDates.map((d) => (
                        <span
                          key={d}
                          className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700'
                        >
                          {d.length === 8
                            ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
                            : d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!!content?.highlights && (
                  <div>
                    <p className='text-xs font-medium text-gray-500 mb-1'>하이라이트</p>
                    <p className='text-sm text-gray-800 leading-relaxed'>
                      {String(content.highlights)}
                    </p>
                  </div>
                )}

                {horsesToWatch.length > 0 && (
                  <div>
                    <p className='text-xs font-medium text-gray-500 mb-1'>주목마</p>
                    <div className='flex flex-wrap gap-2'>
                      {horsesToWatch.map((h, i) => (
                        <span
                          key={i}
                          className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200'
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!!content?.trackConditions && content.trackConditions !== '—' && (
                  <div>
                    <p className='text-xs font-medium text-gray-500 mb-1'>마장/날씨 예상</p>
                    <p className='text-sm text-gray-800'>{String(content.trackConditions)}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </Layout>
    </>
  );
}
