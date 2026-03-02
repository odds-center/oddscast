import { ApiResponse } from '@/lib/types/api';
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

  // Get notification list
  static async getNotifications(filters?: NotificationFilters): Promise<{
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

      const response = await axiosInstance.get<
        ApiResponse<{
          notifications: Notification[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`${NotificationApi.baseUrl}?${queryString}`);

      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Get individual notification
  static async getNotification(notificationId: string): Promise<Notification> {
    try {
      const response = await axiosInstance.get<ApiResponse<Notification>>(
        `${NotificationApi.baseUrl}/${notificationId}`,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Create notification
  static async createNotification(
    notificationData: CreateNotificationRequest,
  ): Promise<Notification> {
    try {
      const response = await axiosInstance.post<ApiResponse<Notification>>(
        NotificationApi.baseUrl,
        notificationData,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Update notification
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Notification>>(
        `${NotificationApi.baseUrl}/${notificationId}/read`,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(): Promise<{ updatedCount: number }> {
    try {
      const response = await axiosInstance.patch<ApiResponse<{ updatedCount: number }>>(
        `${NotificationApi.baseUrl}/read-all`,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<ApiResponse<{ message: string }>>(
        `${NotificationApi.baseUrl}/${notificationId}`,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Get unread notification count
  static async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ count: number }>>(
        `${NotificationApi.baseUrl}/unread-count`,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await axiosInstance.get<ApiResponse<NotificationPreferences>>(
        `${NotificationApi.baseUrl}/preferences`,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    try {
      const response = await axiosInstance.put<ApiResponse<NotificationPreferences>>(
        `${NotificationApi.baseUrl}/preferences`,
        preferences,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Subscribe to push notifications
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Unsubscribe from push notifications
  static async unsubscribeFromPushNotifications(deviceToken: string): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message: string }>>(
        `${NotificationApi.baseUrl}/push-unsubscribe`,
        { deviceToken },
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Get notification templates (admin only)
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
      const response = await axiosInstance.get<ApiResponse<unknown[]>>(
        `${NotificationApi.baseUrl}/templates`,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // Send bulk notifications (admin only)
  static async sendBulkNotifications(
    templateId: string,
    recipients: string[],
    variables?: Record<string, unknown>,
  ): Promise<{ sentCount: number; failedCount: number }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ sentCount: number; failedCount: number }>>(
        `${NotificationApi.baseUrl}/bulk-send`,
        {
          templateId,
          recipients,
          variables,
        },
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}
