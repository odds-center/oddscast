import { apiClient, handleApiResponse, handleApiError } from '@/lib/utils/axios';
import { ApiResponse } from '@/lib/types/api';
import qs from 'qs';
import type {
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationFilters,
  NotificationPreferences,
} from '@/lib/types/notification';

export class NotificationApi {
  private static instance: NotificationApi;
  private baseUrl = '/notifications';

  private constructor() {}

  public static getInstance(): NotificationApi {
    if (!NotificationApi.instance) {
      NotificationApi.instance = new NotificationApi();
    }
    return NotificationApi.instance;
  }

  // 알림 목록 조회
  async getNotifications(filters?: NotificationFilters): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await apiClient.get<
        ApiResponse<{
          notifications: Notification[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${this.baseUrl}?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 개별 알림 조회
  async getNotification(notificationId: string): Promise<Notification> {
    try {
      const response = await apiClient.get<ApiResponse<Notification>>(
        `${this.baseUrl}/${notificationId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 생성
  async createNotification(notificationData: CreateNotificationRequest): Promise<Notification> {
    try {
      const response = await apiClient.post<ApiResponse<Notification>>(
        this.baseUrl,
        notificationData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 업데이트
  async updateNotification(
    notificationId: string,
    updateData: UpdateNotificationRequest
  ): Promise<Notification> {
    try {
      const response = await apiClient.put<ApiResponse<Notification>>(
        `${this.baseUrl}/${notificationId}`,
        updateData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 읽음 처리
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await apiClient.patch<ApiResponse<Notification>>(
        `${this.baseUrl}/${notificationId}/read`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(): Promise<{ updatedCount: number }> {
    try {
      const response = await apiClient.patch<ApiResponse<{ updatedCount: number }>>(
        `${this.baseUrl}/read-all`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 삭제
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/${notificationId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(
        `${this.baseUrl}/unread-count`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 설정 조회
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get<ApiResponse<NotificationPreferences>>(
        `${this.baseUrl}/preferences`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 설정 업데이트
  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.put<ApiResponse<NotificationPreferences>>(
        `${this.baseUrl}/preferences`,
        preferences
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 구독 (Push 알림용)
  async subscribeToPushNotifications(deviceToken: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/push-subscribe`,
        { deviceToken }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 구독 해제
  async unsubscribeFromPushNotifications(deviceToken: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/push-unsubscribe`,
        { deviceToken }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 알림 템플릿 조회 (관리자용)
  async getNotificationTemplates(): Promise<
    Array<{
      id: string;
      name: string;
      title: string;
      message: string;
      type: Notification['type'];
      category: Notification['category'];
      variables: string[];
    }>
  > {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`${this.baseUrl}/templates`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 대량 알림 발송 (관리자용)
  async sendBulkNotifications(
    templateId: string,
    recipients: string[],
    variables?: Record<string, any>
  ): Promise<{ sentCount: number; failedCount: number }> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`${this.baseUrl}/bulk-send`, {
        templateId,
        recipients,
        variables,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 싱글톤 인스턴스 export
export const notificationApi = NotificationApi.getInstance();
