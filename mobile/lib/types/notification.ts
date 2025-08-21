// 알림 관련 타입 정의
export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  BET_RESULT = 'BET_RESULT', // 베팅 결과
  RACE_UPDATE = 'RACE_UPDATE', // 경주 업데이트
  POINT_EXPIRY = 'POINT_EXPIRY', // 포인트 만료
  RACE_START = 'RACE_START', // 경주 시작
  RACE_RESULT = 'RACE_RESULT', // 경주 결과
  SYSTEM = 'SYSTEM', // 시스템 알림
  PROMOTION = 'PROMOTION', // 프로모션
  ACHIEVEMENT = 'ACHIEVEMENT', // 업적 달성
  SECURITY = 'SECURITY', // 보안 알림
  MAINTENANCE = 'MAINTENANCE', // 점검 알림
  NEWS = 'NEWS', // 뉴스
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum NotificationCategory {
  GENERAL = 'GENERAL',
  BETTING = 'BETTING',
  RACING = 'RACING',
  SYSTEM = 'SYSTEM',
  PROMOTION = 'PROMOTION',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  category: NotificationCategory;
  title: string;
  message: string;
  summary?: string;
  metadata?: {
    betId?: string;
    raceId?: string;
    promotionId?: string;
    achievementId?: string;
    actionUrl?: string;
    imageUrl?: string;
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  metadata?: Notification['metadata'];
  scheduledAt?: string;
  expiresAt?: string;
}

export interface UpdateNotificationRequest {
  isRead?: boolean;
  title?: string;
  message?: string;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  metadata?: Notification['metadata'];
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  isRead?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationStatistics {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  archivedCount: number;
  byType: Record<
    NotificationType,
    {
      count: number;
      unreadCount: number;
      percentage: number;
    }
  >;
  byPriority: Record<
    NotificationPriority,
    {
      count: number;
      unreadCount: number;
      percentage: number;
    }
  >;
  recentActivity: Array<{
    date: string;
    count: number;
    unreadCount: number;
  }>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  summary?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationTemplateRequest {
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  summary?: string;
  variables: string[];
}

export interface UpdateNotificationTemplateRequest {
  name?: string;
  title?: string;
  message?: string;
  summary?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  bettingNotifications: boolean;
  racingNotifications: boolean;
  systemNotifications: boolean;
  promotionNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationPreferencesRequest {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  inApp?: boolean;
  byType?: Partial<
    Record<
      NotificationType,
      {
        email: boolean;
        push: boolean;
        sms: boolean;
        inApp: boolean;
      }
    >
  >;
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  frequency?: {
    digest: boolean;
    digestFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    maxPerDay: number;
  };
}

export interface NotificationDigest {
  id: string;
  userId: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startDate: string;
  endDate: string;
  notifications: Notification[];
  summary: {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  };
  createdAt: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'PUSH' | 'SMS' | 'WEBHOOK';
  config: {
    apiKey?: string;
    endpoint?: string;
    template?: string;
    [key: string]: any;
  };
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  userId: string;
  channel: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  attempts: number;
  maxAttempts: number;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  metadata?: {
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationBulkRequest {
  userIds: string[];
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  summary?: string;
  metadata?: Notification['metadata'];
  scheduledAt?: string;
  expiresAt?: string;
}

export interface NotificationBulkResponse {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
  batchId: string;
}
