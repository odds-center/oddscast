import { useEffect, useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  checkNotificationPermissions,
  setupNotificationListeners,
} from '@/lib/utils/notifications';
import { NotificationApi } from '@/lib/api/notificationApi';

/**
 * 알림 권한 및 토큰 관리 훅
 */
export function useNotificationPermission() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  // 권한 요청 및 토큰 등록
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await registerForPushNotificationsAsync();

      if (token) {
        setExpoPushToken(token);
        setHasPermission(true);

        // 서버에 토큰 등록
        try {
          const notificationApi = NotificationApi.getInstance();
          await notificationApi.subscribeToPushNotifications(token, Platform.OS);
          console.log('✅ 서버에 Push Token 등록 완료');
        } catch (error) {
          console.error('❌ 서버에 Push Token 등록 실패:', error);
        }
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 권한 상태 확인
  const checkPermission = useCallback(async () => {
    const granted = await checkNotificationPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  // 알림 핸들러 설정
  useEffect(() => {
    // 초기 권한 확인
    checkPermission().then((granted) => {
      setIsLoading(false);

      // 권한이 있으면 토큰 발급
      if (granted && !expoPushToken) {
        requestPermission();
      }
    });

    // 알림 리스너 설정
    const removeListeners = setupNotificationListeners(
      // 알림 수신 시
      (notification) => {
        setNotification(notification);
        console.log('📬 포그라운드 알림:', notification.request.content);

        // iOS에서 배지 업데이트
        if (Platform.OS === 'ios') {
          Notifications.getBadgeCountAsync().then((count) => {
            Notifications.setBadgeCountAsync(count + 1);
          });
        }
      },
      // 알림 탭 시
      (response) => {
        console.log('👆 알림 탭:', response.notification.request.content);

        // 알림 데이터에 따라 화면 이동 등 처리
        const data = response.notification.request.content.data;
        if (data?.screen) {
          // TODO: 화면 이동 로직
          console.log('이동할 화면:', data.screen);
        }
      }
    );

    return () => {
      removeListeners();
    };
  }, [checkPermission, requestPermission, expoPushToken]);

  return {
    expoPushToken,
    hasPermission,
    isLoading,
    notification,
    requestPermission,
    checkPermission,
  };
}
