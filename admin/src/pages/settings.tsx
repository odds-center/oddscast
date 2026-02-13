import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/router';
import { authApi } from '@/lib/api/auth';
import { adminSystemConfigApi, adminAIConfigApi } from '@/lib/api/admin';
import { Bot, Settings, Database, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

type SystemConfigForm = {
  show_google_login: boolean;
  kra_base_url_override: string;
};

export default function SettingsPage() {
  const { user, clearAuth } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: systemConfig, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => adminSystemConfigApi.getConfig(),
  });

  const { data: costEstimate } = useQuery({
    queryKey: ['ai-estimate-cost'],
    queryFn: () => adminAIConfigApi.estimateCost(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: SystemConfigForm) => adminSystemConfigApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success('시스템 설정이 저장되었습니다');
    },
    onError: () => toast.error('저장에 실패했습니다'),
  });

  const { register, handleSubmit, reset } = useForm<SystemConfigForm>({
    defaultValues: {
      show_google_login: false,
      kra_base_url_override: '',
    },
  });

  useEffect(() => {
    if (systemConfig) {
      reset({
        show_google_login: systemConfig.show_google_login,
        kra_base_url_override: systemConfig.kra_base_url_override || '',
      });
    }
  }, [systemConfig, reset]);

  const handleLogout = async () => {
    await authApi.logout();
    clearAuth();
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>설정 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>설정</h1>
            <p className='mt-2 text-sm text-gray-600'>
              시스템 설정, AI, KRA 등 모든 Config를 Admin에서 관리합니다.
            </p>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card title='관리자 정보'>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>이메일</label>
                  <div className='mt-1 text-gray-900'>{user?.email || '-'}</div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>사용자명</label>
                  <div className='mt-1 text-gray-900'>{user?.name || '-'}</div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>역할</label>
                  <div className='mt-1'>
                    <span className='inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800'>
                      {user?.role || '-'}
                    </span>
                  </div>
                </div>
                <div className='border-t pt-4'>
                  <Button variant='danger' className='w-full' onClick={handleLogout}>
                    로그아웃
                  </Button>
                </div>
              </div>
            </Card>

            <Card title='Config 빠른 링크'>
              <div className='space-y-3'>
                <Link
                  href='/ai-config'
                  className='flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition'
                >
                  <Bot className='w-6 h-6 text-blue-600' />
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900'>AI 설정 (Gemini)</div>
                    <div className='text-sm text-gray-500'>
                      모델 선택, Temperature, 배치 예측 스케줄 등
                      {costEstimate && (
                        <span className='block mt-1'>
                          <span className='text-blue-600 font-medium'>
                            예상 월 비용: ₩
                            {typeof (costEstimate as { estimatedMonthlyCost?: number }).estimatedMonthlyCost ===
                            'number'
                              ? (
                                  costEstimate as { estimatedMonthlyCost: number }
                                ).estimatedMonthlyCost.toLocaleString()
                              : '-'}
                            {(costEstimate as { enableCaching?: boolean }).enableCaching && ' (캐싱 ON)'}
                          </span>
                          {(costEstimate as { calculationText?: string }).calculationText && (
                            <span className='block mt-0.5 text-xs text-gray-500'>
                              {(costEstimate as { calculationText: string }).calculationText}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className='w-4 h-4 text-gray-400' />
                </Link>
                <Link
                  href='/single-purchase-config'
                  className='flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition'
                >
                  <Database className='w-6 h-6 text-green-600' />
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900'>개별 구매 설정</div>
                    <div className='text-sm text-gray-500'>예측권 단건 가격 등</div>
                  </div>
                  <ExternalLink className='w-4 h-4 text-gray-400' />
                </Link>
                <Link
                  href='/subscription-plans'
                  className='flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition'
                >
                  <Settings className='w-6 h-6 text-purple-600' />
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900'>구독 플랜</div>
                    <div className='text-sm text-gray-500'>LIGHT, PREMIUM 플랜 관리</div>
                  </div>
                  <ExternalLink className='w-4 h-4 text-gray-400' />
                </Link>
              </div>
            </Card>
          </div>

          <Card title='시스템 설정'>
            {isLoading ? (
              <div className='py-4'>로딩 중...</div>
            ) : (
              <form
                onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
                className='space-y-6'
              >
                <div>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input type='checkbox' {...register('show_google_login')} className='rounded' />
                    <span className='font-medium text-gray-900'>Google 로그인 노출</span>
                  </label>
                  <p className='mt-1 text-sm text-gray-500'>
                    모바일 앱에서 Google 소셜 로그인 버튼 표시 여부
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    KRA API Base URL (선택)
                  </label>
                  <input
                    type='text'
                    {...register('kra_base_url_override')}
                    placeholder='http://apis.data.go.kr/B551015 (비우면 기본값)'
                    className='w-full px-4 py-2 border rounded-lg'
                  />
                  <p className='mt-1 text-sm text-gray-500'>
                    KRA_SERVICE_KEY는 .env에 있어야 합니다. URL만 오버라이드 가능.
                  </p>
                </div>
                <div className='pt-4 border-t'>
                  <Button
                    type='submit'
                    variant='primary'
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? '저장 중...' : '시스템 설정 저장'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </Layout>
    </>
  );
}
