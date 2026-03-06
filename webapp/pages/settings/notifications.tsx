import { useState, useEffect } from 'react';
import Icon from '@/components/icons';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import BackLink from '@/components/page/BackLink';
import RequireLogin from '@/components/page/RequireLogin';
import { Toggle } from '@/components/ui';
import DataFetchState from '@/components/page/DataFetchState';
import { getErrorMessage } from '@/lib/utils/error';
import NotificationApi from '@/lib/api/notificationApi';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';
import { useIsNativeApp } from '@/lib/hooks/useIsNativeApp';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 2500);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  const visibleSettings = SETTINGS.filter((s) => {
    if (s.showOn === 'all') return true;
    if (s.showOn === 'mobile') return isNativeApp;
    return s.showOn === 'web' && !isNativeApp;
  });

  const { data: pref, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => NotificationApi.getNotificationPreferences(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) =>
      NotificationApi.updateNotificationPreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      setSaveSuccess(true);
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
      <Layout title='알림 설정 | OddsCast'>
        <CompactPageTitle title='알림 설정' backHref={routes.settings} />
        <RequireLogin suffix='설정할 수 있습니다' />
        <BackLink href={routes.settings} label='설정으로' />
      </Layout>
    );
  }

  return (
    <Layout title='알림 설정 | OddsCast'>
      <div className='space-y-6'>
        <CompactPageTitle title='알림 설정' backHref={routes.settings} />
        <DataFetchState isLoading={isLoading} error={null} loadingLabel='설정 준비 중...'>
          <SectionCard
            title='알림 유형'
            icon='Bell'
            description='푸시·경주·예측 등 알림을 켜거나 끌 수 있습니다.'
          >
          {saveSuccess && (
            <p className='msg-success mb-4' role='status'>
              알림 설정이 저장되었습니다.
            </p>
          )}
          {updateMutation.isError && (
            <p className='msg-error mb-4'>
              {getErrorMessage(updateMutation.error) || '설정 저장에 실패했습니다.'}
            </p>
          )}
          {!isNativeApp && (
            <div className='flex items-start gap-2.5 bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-3 mb-5'>
              <Icon name='Smartphone' size={16} className='text-text-tertiary mt-0.5 shrink-0' />
              <p className='text-text-secondary text-sm leading-relaxed'>
                푸시 알림은 <span className='font-medium text-foreground'>모바일 앱</span>에서만 설정할 수 있습니다.
              </p>
            </div>
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
        </DataFetchState>

        <BackLink href={routes.settings} label='설정으로' />
      </div>
    </Layout>
  );
}
