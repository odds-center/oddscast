import { apiClient } from './client';
import { Notification, ApiResponse } from './types';

// 알림 관련 API 함수들
export const notificationsApi = {
  // 알림 목록 조회
  getNotifications: async (params?: {
    limit?: number;
    offset?: number;
    read?: boolean;
  }): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Notification[]>>('/api/notifications', {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  },

  // 알림 읽음 처리
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },

  // 모든 알림 읽음 처리
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.put('/api/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  // 알림 삭제
  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  },

  // 읽지 않은 알림 개수 조회
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<ApiResponse<{ count: number }>>(
        '/api/notifications/unread-count'
      );
      return response.data.data.count;
    } catch (error) {
      console.error('Failed to get unread notification count:', error);
      return 0;
    }
  },

  // 알림 설정 업데이트
  updateNotificationSettings: async (settings: {
    raceNotifications: boolean;
    resultNotifications: boolean;
    systemNotifications: boolean;
  }): Promise<void> => {
    try {
      await apiClient.put('/api/notifications/settings', settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  },
};

export default notificationsApi;
