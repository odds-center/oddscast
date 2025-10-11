import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Firebase Cloud Messaging 설정 및 관리
 */
export class FCMService {
  private static instance: FCMService;

  private constructor() {
    this.setupNotificationCategories();
  }

  public static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  /**
   * 알림 카테고리 설정 (액션 버튼 포함)
   */
  private async setupNotificationCategories() {
    // iOS 알림 카테고리 설정
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('race_result', [
        {
          identifier: 'view_result',
          buttonTitle: '결과 보기',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'dismiss',
          buttonTitle: '닫기',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('bet_win', [
        {
          identifier: 'view_bet',
          buttonTitle: '마권 보기',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'share',
          buttonTitle: '공유',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('favorite_race', [
        {
          identifier: 'view_race',
          buttonTitle: '경주 보기',
          options: {
            opensAppToForeground: true,
          },
        },
      ]);
    }

    // Android 알림 채널 설정
    if (Platform.OS === 'android') {
      // 기본 채널
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        description: '일반 알림',
      });

      // 경주 결과 채널
      await Notifications.setNotificationChannelAsync('race_results', {
        name: '경주 결과',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        description: '경주 결과 알림',
      });

      // 마권 적중 채널
      await Notifications.setNotificationChannelAsync('bet_wins', {
        name: '마권 적중',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 100, 250, 100, 250],
        lightColor: '#FFD700',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        description: '마권 적중 알림',
      });

      // 즐겨찾기 경주 채널
      await Notifications.setNotificationChannelAsync('favorites', {
        name: '즐겨찾기',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        description: '즐겨찾기 말 알림',
      });

      // 프로모션 채널 (낮은 우선순위)
      await Notifications.setNotificationChannelAsync('promotions', {
        name: '프로모션',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 250],
        lightColor: '#FFD700',
        sound: null,
        enableLights: false,
        enableVibrate: false,
        showBadge: true,
        description: '프로모션 및 이벤트 알림',
      });
    }
  }

  /**
   * 알림 타입에 따른 채널 ID 반환
   */
  getChannelId(notificationType: string): string {
    switch (notificationType) {
      case 'race_result':
        return 'race_results';
      case 'bet_win':
        return 'bet_wins';
      case 'favorite':
        return 'favorites';
      case 'promotion':
        return 'promotions';
      default:
        return 'default';
    }
  }

  /**
   * 알림 타입에 따른 카테고리 ID 반환 (iOS)
   */
  getCategoryId(notificationType: string): string | undefined {
    if (Platform.OS !== 'ios') return undefined;

    switch (notificationType) {
      case 'race_result':
        return 'race_result';
      case 'bet_win':
        return 'bet_win';
      case 'favorite':
        return 'favorite_race';
      default:
        return undefined;
    }
  }
}

// 싱글톤 인스턴스 export
export const fcmService = FCMService.getInstance();
