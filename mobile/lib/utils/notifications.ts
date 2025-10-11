import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { fcmService } from '@/lib/services/fcm';
import { showWarningMessage, showInfoMessage } from '@/utils/alert';

/**
 * 알림 핸들러 설정
 * 앱이 포그라운드일 때 알림을 표시하는 방법 설정
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 알림 권한 요청 및 토큰 등록
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // FCM 서비스 초기화 (알림 채널/카테고리 설정)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = fcmService;

  if (Device.isDevice) {
    // 1. 현재 권한 상태 확인
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 2. 권한이 없으면 요청
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 3. 권한이 거부되면 알림
    if (finalStatus !== 'granted') {
      showWarningMessage(
        '경주 일정과 결과 정보 알림을 받으려면 설정에서 알림을 허용해주세요.',
        '알림 권한 필요'
      );
      return null;
    }

    // 4. Expo Push Token 발급
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('EAS Project ID가 설정되지 않았습니다.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = tokenData.data;
      console.log('📱 Push Token:', token);
    } catch (error) {
      console.error('Push Token 발급 실패:', error);
      return null;
    }
  } else {
    showWarningMessage('실제 기기에서만 푸시 알림을 사용할 수 있습니다.', '알림');
  }

  return token;
}

/**
 * 알림 권한 상태 확인
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * 앱 설정으로 이동 (권한 설정용)
 */
export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Notifications.getPermissionsAsync(); // iOS에서는 설정 앱으로 바로 이동 불가
    showInfoMessage('설정 > 알림 > GoldenRace에서 알림을 허용해주세요.', '알림 권한 설정');
  } else {
    showInfoMessage('설정 > 앱 > GoldenRace > 알림에서 알림을 허용해주세요.', '알림 권한 설정');
  }
}

/**
 * 로컬 알림 스케줄 (테스트용)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  triggerSeconds: number = 2
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      badge: 1,
    },
    trigger: {
      seconds: triggerSeconds,
      channelId: 'default',
    },
  });

  return notificationId;
}

/**
 * 즉시 로컬 알림 표시
 */
export async function showImmediateNotification(
  title: string,
  body: string,
  data?: any
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
      badge: 1,
    },
    trigger: null, // 즉시 표시
  });

  return notificationId;
}

/**
 * 배지 카운트 설정
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(count);
  }
}

/**
 * 배지 카운트 증가
 */
export async function incrementBadgeCount(): Promise<void> {
  if (Platform.OS === 'ios') {
    const current = await Notifications.getBadgeCountAsync();
    await Notifications.setBadgeCountAsync(current + 1);
  }
}

/**
 * 배지 초기화
 */
export async function clearBadgeCount(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(0);
  }
}

/**
 * 알림 리스너 설정
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // 알림 수신 리스너 (앱이 포그라운드/백그라운드 모두)
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📬 알림 수신:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // 알림 응답 리스너 (사용자가 알림을 탭했을 때)
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 알림 탭:', response);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });

  // 리스너 제거 함수 반환
  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * 예약된 알림 모두 취소
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 특정 알림 취소
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
