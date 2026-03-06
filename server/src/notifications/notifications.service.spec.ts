/**
 * NotificationsService unit tests.
 * firebase-admin is mocked so no real Firebase credentials are needed.
 */
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  app: jest.fn(),
  credential: { cert: jest.fn(), applicationDefault: jest.fn() },
  messaging: jest
    .fn()
    .mockReturnValue({ send: jest.fn().mockResolvedValue('') }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from '../database/entities/notification.entity';
import { PushToken } from '../database/entities/push-token.entity';
import { UserNotificationPreference } from '../database/entities/user-notification-preference.entity';
import { User } from '../database/entities/user.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { createMockRepository } from '../test/mock-factories';
import {
  NotificationType,
  NotificationCategory,
  SubscriptionStatus,
} from '../database/db-enums';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: ReturnType<typeof createMockRepository>;
  let pushTokenRepo: ReturnType<typeof createMockRepository>;
  let prefRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let subscriptionRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    notifRepo = createMockRepository();
    pushTokenRepo = createMockRepository();
    prefRepo = createMockRepository();
    userRepo = createMockRepository();
    subscriptionRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: notifRepo },
        { provide: getRepositoryToken(PushToken), useValue: pushTokenRepo },
        {
          provide: getRepositoryToken(UserNotificationPreference),
          useValue: prefRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepo,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('findAll', () => {
    it('returns paginated notifications for user', async () => {
      const mockNotif = { id: 1, userId: 1, title: 'Test', isRead: false };
      notifRepo.findAndCount.mockResolvedValue([[mockNotif], 1]);

      const result = await service.findAll(1, { page: 1, limit: 20 });
      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('applies isRead filter when provided', async () => {
      notifRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, { isRead: false });
      const [where] = notifRepo.findAndCount.mock.calls[0];
      expect(where.where).toMatchObject({ userId: 1, isRead: false });
    });

    it('does not apply isRead filter when not provided', async () => {
      notifRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, {});
      const [where] = notifRepo.findAndCount.mock.calls[0];
      expect(where.where).toEqual({ userId: 1 });
    });

    it('calculates correct totalPages', async () => {
      notifRepo.findAndCount.mockResolvedValue([[], 45]);

      const result = await service.findAll(1, { page: 1, limit: 20 });
      expect(result.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('returns notification when found', async () => {
      const mockNotif = { id: 1, title: 'Test' };
      notifRepo.findOne.mockResolvedValue(mockNotif);

      const result = await service.findOne(1);
      expect(result).toEqual(mockNotif);
    });

    it('throws NotFoundException when not found', async () => {
      notifRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and saves notification with defaults', async () => {
      const dto = { userId: 1, title: '경주 알림', message: '경주 시작' };
      const created = {
        id: 1,
        ...dto,
        type: NotificationType.SYSTEM,
        isRead: false,
      };
      notifRepo.create.mockReturnValue(created);
      notifRepo.save.mockResolvedValue(created);

      const result = await service.create(dto);
      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          title: '경주 알림',
          isRead: false,
        }),
      );
      expect(result).toEqual(created);
    });

    it('uses provided type and category', async () => {
      const dto = {
        userId: 1,
        title: '예측 알림',
        message: '예측 준비됨',
        type: NotificationType.PREDICTION,
        category: NotificationCategory.INFO,
      };
      notifRepo.create.mockReturnValue(dto);
      notifRepo.save.mockResolvedValue(dto);

      await service.create(dto);
      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.PREDICTION,
          category: NotificationCategory.INFO,
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      const mockNotif = { id: 1, isRead: true };
      notifRepo.update.mockResolvedValue({ affected: 1 });
      notifRepo.findOne.mockResolvedValue(mockNotif);

      const result = await service.markAsRead(1);
      expect(notifRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ isRead: true }),
      );
      expect(result).toEqual(mockNotif);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read', async () => {
      notifRepo.update.mockResolvedValue({ affected: 5 });

      const result = await service.markAllAsRead(1);
      expect(result.count).toBe(5);
      expect(notifRepo.update).toHaveBeenCalledWith(
        { userId: 1, isRead: false },
        expect.objectContaining({ isRead: true }),
      );
    });

    it('returns 0 when no unread notifications', async () => {
      notifRepo.update.mockResolvedValue({ affected: 0 });

      const result = await service.markAllAsRead(1);
      expect(result.count).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('returns correct unread count', async () => {
      notifRepo.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(1);
      expect(result.count).toBe(3);
      expect(notifRepo.count).toHaveBeenCalledWith({
        where: { userId: 1, isRead: false },
      });
    });
  });

  describe('remove', () => {
    it('deletes notification and returns message', async () => {
      notifRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);
      expect(result.message).toBe('알림이 삭제되었습니다');
      expect(notifRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteAll', () => {
    it('deletes all notifications for user', async () => {
      notifRepo.delete.mockResolvedValue({ affected: 10 });

      const result = await service.deleteAll(1);
      expect(result.count).toBe(10);
      expect(notifRepo.delete).toHaveBeenCalledWith({ userId: 1 });
    });
  });

  describe('getPreferences', () => {
    it('returns existing preferences', async () => {
      const mockPrefs = { id: 1, userId: 1, pushEnabled: true };
      prefRepo.findOne.mockResolvedValue(mockPrefs);

      const result = await service.getPreferences(1);
      expect(result).toEqual(mockPrefs);
    });

    it('creates default preferences when none exist', async () => {
      prefRepo.findOne.mockResolvedValueOnce(null);
      const created = { id: 1, userId: 1, pushEnabled: true };
      prefRepo.create.mockReturnValue(created);
      prefRepo.save.mockResolvedValue(created);
      prefRepo.findOne.mockResolvedValue(created);

      await service.getPreferences(1);
      expect(prefRepo.create).toHaveBeenCalled();
      expect(prefRepo.save).toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('updates specified preference fields', async () => {
      const mockPrefs = {
        id: 1,
        userId: 1,
        pushEnabled: true,
        raceEnabled: true,
        predictionEnabled: true,
        subscriptionEnabled: true,
        systemEnabled: true,
        promotionEnabled: false,
      };
      prefRepo.findOne.mockResolvedValue(mockPrefs);
      prefRepo.save.mockResolvedValue(mockPrefs);

      await service.updatePreferences(1, {
        promotionEnabled: true,
        raceEnabled: false,
      });
      expect(prefRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          promotionEnabled: true,
          raceEnabled: false,
        }),
      );
    });
  });

  describe('pushSubscribe', () => {
    it('throws when token is too short', async () => {
      await expect(
        service.pushSubscribe(1, { token: 'short' }),
      ).rejects.toThrow('유효하지 않은 푸시 토큰입니다.');
    });

    it('updates existing token when already registered', async () => {
      const existing = {
        id: 1,
        userId: 1,
        token: 'valid-token-12345678',
        deviceId: null,
      };
      pushTokenRepo.findOne.mockResolvedValue(existing);
      pushTokenRepo.save.mockResolvedValue(existing);

      const result = await service.pushSubscribe(1, {
        token: 'valid-token-12345678',
        deviceId: 'device-1',
      });
      expect(pushTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ deviceId: 'device-1' }),
      );
      expect(result.message).toContain('구독');
    });

    it('creates new token when not registered', async () => {
      pushTokenRepo.findOne.mockResolvedValue(null);
      const created = { id: 2, userId: 1, token: 'new-token-12345678' };
      pushTokenRepo.create.mockReturnValue(created);
      pushTokenRepo.save.mockResolvedValue(created);

      const result = await service.pushSubscribe(1, {
        token: 'new-token-12345678',
      });
      expect(pushTokenRepo.create).toHaveBeenCalled();
      expect(result.message).toContain('구독');
    });
  });

  describe('pushUnsubscribe', () => {
    it('removes push token', async () => {
      pushTokenRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.pushUnsubscribe(1, { token: 'some-token' });
      expect(pushTokenRepo.delete).toHaveBeenCalledWith({
        userId: 1,
        token: 'some-token',
      });
      expect(result.message).toContain('해제');
    });
  });

  describe('adminSend', () => {
    it('sends to all active users', async () => {
      userRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      pushTokenRepo.find.mockResolvedValue([]);
      notifRepo.create.mockImplementation((data) => data);
      notifRepo.save.mockResolvedValue({});

      const result = await service.adminSend({
        title: 'Test',
        message: 'Hello',
        target: 'all',
      });
      expect(result.count).toBe(2);
      expect(notifRepo.save).toHaveBeenCalledTimes(2);
    });

    it('sends to subscribers only', async () => {
      subscriptionRepo.find.mockResolvedValue([
        { userId: 10, status: SubscriptionStatus.ACTIVE },
        { userId: 11, status: SubscriptionStatus.ACTIVE },
      ]);
      pushTokenRepo.find.mockResolvedValue([]);
      notifRepo.create.mockImplementation((data) => data);
      notifRepo.save.mockResolvedValue({});

      const result = await service.adminSend({
        title: 'Sub promo',
        message: 'Hi',
        target: 'subscribers',
      });
      expect(result.count).toBe(2);
    });

    it('returns 0 when no recipients', async () => {
      userRepo.find.mockResolvedValue([]);

      const result = await service.adminSend({
        title: 'T',
        message: 'M',
        target: 'all',
      });
      expect(result.count).toBe(0);
      expect(result.message).toContain('대상이 없습니다');
    });
  });

  describe('bulkSend', () => {
    it('creates notifications for each recipient', async () => {
      notifRepo.create.mockImplementation((data) => data);
      notifRepo.save.mockResolvedValue({});

      const result = await service.bulkSend({
        templateId: 'WELCOME',
        recipients: [1, 2, 3],
        variables: { name: 'test' },
      });
      expect(result.count).toBe(3);
      expect(notifRepo.save).toHaveBeenCalledTimes(3);
    });
  });
});
