import { ApiResponse } from '@/lib/types/api';
import CONFIG from '@/lib/config';
import { mockNotifications } from '@/lib/mocks/data';
import type {
  CreateNotificationRequest,
  Notification,
  NotificationFilters,
  NotificationPreferences,
  UpdateNotificationRequest,
} from '@/lib/types/notification';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import qs from 'qs';

export default class NotificationApi {
  private static baseUrl = '/notifications';

  // 알림 목록 조회
  static async getNotifications(filters?: NotificationFilters): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    if (CONFIG.useMock) {
      return {
        notifications: mockNotifications as any,
        total: mockNotifications.length,
        page: 1,
        totalPages: 1,
      };
    }
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await axiosInstance.get<
        ApiResponse<{
          notifications: Notification[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${NotificationApi.baseUrl}?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 개별 알림 조회
  static async getNotification(notificationId: string): Promise<Notification> {
    try {
      const response = await axiosInstance.get<ApiResponse<Notification>>(
        `${NotificationApi.baseUrl}/${notificationId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 생성
  static async createNotification(
    notificationData: CreateNotificationRequest,
  ): Promise<Notification> {
    try {
      const response = await axiosInstance.post<ApiResponse<Notification>>(
        NotificationApi.baseUrl,
        notificationData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 업데이트
  static async updateNotification(
    notificationId: string,
    updateData: UpdateNotificationRequest,
  ): Promise<Notification> {
    try {
      const response = await axiosInstance.put<ApiResponse<Notification>>(
        `${NotificationApi.baseUrl}/${notificationId}`,
        updateData,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 읽음 처리
  static async markAsRead(notificationId: string): Promise<Notification> {
    if (CONFIG.useMock) return {} as Notification;
    try {
      const response = await axiosInstance.patch<ApiResponse<Notification>>(
        `${NotificationApi.baseUrl}/${notificationId}/read`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 모든 알림 읽음 처리
  static async markAllAsRead(): Promise<{ updatedCount: number }> {
    if (CONFIG.useMock) return { updatedCount: 1 };
    try {
      const response = await axiosInstance.patch<ApiResponse<{ updatedCount: number }>>(
        `${NotificationApi.baseUrl}/read-all`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 삭제
  static async deleteNotification(notificationId: string): Promise<{ message: string }> {
    if (CONFIG.useMock) return { message: 'OK' };
    try {
      const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
        `${NotificationApi.baseUrl}/${notificationId}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 읽지 않은 알림 개수 조회
  static async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ count: number }>>(
        `${NotificationApi.baseUrl}/unread-count`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 설정 조회
  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    if (CONFIG.useMock) {
      return {
        pushEnabled: true,
        raceEnabled: true,
        predictionEnabled: true,
        subscriptionEnabled: true,
        systemEnabled: true,
        promotionEnabled: false,
      };
    }
    try {
      const response = await axiosInstance.get<ApiResponse<NotificationPreferences>>(
        `${NotificationApi.baseUrl}/preferences`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 설정 업데이트
  static async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    if (CONFIG.useMock) {
      const defaults: NotificationPreferences = {
        pushEnabled: true,
        raceEnabled: true,
        predictionEnabled: true,
        subscriptionEnabled: true,
        systemEnabled: true,
        promotionEnabled: false,
      };
      return { ...defaults, ...preferences };
    }
    try {
      const response = await axiosInstance.put<ApiResponse<NotificationPreferences>>(
        `${NotificationApi.baseUrl}/preferences`,
        preferences,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 구독 (Push 알림용)
  static async subscribeToPushNotifications(
    deviceToken: string,
    platform?: string,
  ): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        `${NotificationApi.baseUrl}/push-subscribe`,
        { deviceToken, platform },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 구독 해제
  static async unsubscribeFromPushNotifications(deviceToken: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        `${NotificationApi.baseUrl}/push-unsubscribe`,
        { deviceToken },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 템플릿 조회 (관리자용)
  static async getNotificationTemplates(): Promise<
    {
      id: string;
      name: string;
      title: string;
      message: string;
      type: Notification['type'];
      category: Notification['category'];
      variables: string[];
    }[]
  > {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>(
        `${NotificationApi.baseUrl}/templates`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 대량 알림 발송 (관리자용)
  static async sendBulkNotifications(
    templateId: string,
    recipients: string[],
    variables?: Record<string, any>,
  ): Promise<{ sentCount: number; failedCount: number }> {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        `${NotificationApi.baseUrl}/bulk-send`,
        {
          templateId,
          recipients,
          variables,
        },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
