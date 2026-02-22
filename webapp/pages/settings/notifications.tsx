import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import BackLink from '@/components/page/BackLink';
import RequireLogin from '@/components/page/RequireLogin';
import { Toggle } from '@/components/ui';
import LoadingSpinner from '@/components/LoadingSpinner';
import NotificationApi from '@/lib/api/notificationApi';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';
import { useIsNativeApp } from '@/lib/hooks/useIsNativeApp';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreferences } from '@/lib/types/notification';

type PlatformFilter = 'web' | 'mobile' | 'all';

const SETTINGS: Array<{
  key: keyof Pick<
    NotificationPreferences,
    | 'pushEnabled'
    | 'raceEnabled'
    | 'predictionEnabled'
    | 'subscriptionEnabled'
    | 'systemEnabled'
    | 'promotionEnabled'
  >;
  label: string;
  description: string;
  defaultChecked: boolean;
  /** 'mobile' = only shown in native app (push), 'all' = common */
  showOn: PlatformFilter;
}> = [
  { key: 'pushEnabled', label: '푸시 알림', description: '앱 내 알림을 푸시로 받습니다.', defaultChecked: true, showOn: 'mobile' },
  { key: 'raceEnabled', label: '경주 알림', description: '경주 시작·결과 알림을 받습니다.', defaultChecked: true, showOn: 'all' },
  { key: 'predictionEnabled', label: 'AI 예측 알림', description: '예측권·분석 관련 알림을 받습니다.', defaultChecked: true, showOn: 'all' },
  { key: 'subscriptionEnabled', label: '구독 알림', description: '구독 결제·만료 관련 알림을 받습니다.', defaultChecked: true, showOn: 'all' },
  { key: 'systemEnabled', label: '시스템 공지', description: '서비스 공지·업데이트 알림을 받습니다.', defaultChecked: true, showOn: 'all' },
  { key: 'promotionEnabled', label: '프로모션 알림', description: '이벤트·프로모션 알림을 받습니다.', defaultChecked: false, showOn: 'all' },
];

export default function NotificationSettingsPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isNativeApp = useIsNativeApp();
  const queryClient = useQueryClient();

  const visibleSettings = SETTINGS.filter((s) => {
    if (s.showOn === 'all') return true;
    if (s.showOn === 'mobile') return isNativeApp;
    return s.showOn === 'web' && !isNativeApp;
  });

  const { data: pref, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => NotificationApi.getNotificationPreferences(),
    enabled: isLoggedIn,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) =>
      NotificationApi.updateNotificationPreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: () => {
      // handleApiError throws; message stored in mutation.error → displayed below
    },
  });

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  if (!isLoggedIn) {
    return (
      <Layout title='GOLDEN RACE'>
        <CompactPageTitle title='알림 설정' backHref={routes.settings} />
        <RequireLogin suffix='설정할 수 있습니다' />
        <BackLink href={routes.settings} label='설정으로' />
      </Layout>
    );
  }

  return (
    <Layout title='GOLDEN RACE'>
      <div className='space-y-6'>
        <CompactPageTitle title='알림 설정' backHref={routes.settings} />
        {isLoading ? (
        <div className='py-16'>
          <LoadingSpinner size={28} label='설정을 불러오는 중...' />
        </div>
      ) : (
        <SectionCard title='알림 유형' icon='Bell' className='mb-6'>
          {updateMutation.isError && (
            <p className='msg-error mb-4'>
              {(updateMutation.error as Error)?.message || '설정 저장에 실패했습니다.'}
            </p>
          )}
          {!isNativeApp && (
            <p className='text-text-secondary text-sm mb-6 px-1'>
              푸시 알림은 모바일 앱에서만 설정할 수 있습니다.
            </p>
          )}
          <div className='divide-y divide-border -mx-1 px-1'>
            {visibleSettings.map(({ key, label, description, defaultChecked }) => (
              <div key={key}>
                <Toggle
                  label={label}
                  description={description}
                  checked={pref?.[key] ?? defaultChecked}
                  onChange={(checked) => handleToggle(key, checked)}
                  disabled={updateMutation.isPending}
                />
              </div>
            ))}
          </div>
        </SectionCard>
        )}

        <BackLink href={routes.settings} label='설정으로' />
      </div>
    </Layout>
  );
}
