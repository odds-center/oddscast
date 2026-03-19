import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';

const mockService = {
  findAll: jest.fn(),
  getUnreadCount: jest.fn(),
  getPreferences: jest.fn(),
  updatePreferences: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  pushSubscribe: jest.fn(),
  pushUnsubscribe: jest.fn(),
  bulkSend: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  update: jest.fn(),
  deleteAll: jest.fn(),
  remove: jest.fn(),
};

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@example.com',
  role: UserRole.USER,
};

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  describe('findAll', () => {
    it('should delegate to service with user id and filters', async () => {
      const result = { data: [], total: 0 };
      mockService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(mockUser, 1, 10, true);

      expect(response).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
        isRead: true,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should delegate to service with user id', async () => {
      mockService.getUnreadCount.mockResolvedValue({ count: 3 });

      const response = await controller.getUnreadCount(mockUser);

      expect(response).toEqual({ count: 3 });
      expect(mockService.getUnreadCount).toHaveBeenCalledWith(1);
    });
  });

  describe('getPreferences', () => {
    it('should delegate to service with user id', async () => {
      const prefs = { pushEnabled: true };
      mockService.getPreferences.mockResolvedValue(prefs);

      const response = await controller.getPreferences(mockUser);

      expect(response).toEqual(prefs);
      expect(mockService.getPreferences).toHaveBeenCalledWith(1);
    });
  });

  describe('updatePreferences', () => {
    it('should delegate to service with user id and dto', async () => {
      const dto = { pushEnabled: false } as never;
      const result = { pushEnabled: false };
      mockService.updatePreferences.mockResolvedValue(result);

      const response = await controller.updatePreferences(mockUser, dto);

      expect(response).toEqual(result);
      expect(mockService.updatePreferences).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('getTemplates', () => {
    it('should return empty array', () => {
      const response = controller.getTemplates();
      expect(response).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should delegate to service with id', async () => {
      const result = { id: 5, title: 'Test' };
      mockService.findOne.mockResolvedValue(result);

      const response = await controller.findOne(5);

      expect(response).toEqual(result);
      expect(mockService.findOne).toHaveBeenCalledWith(5);
    });
  });

  describe('create', () => {
    it('should delegate to service with dto', async () => {
      const dto = { title: 'Hello', body: 'World' } as never;
      const result = { id: 1, title: 'Hello' };
      mockService.create.mockResolvedValue(result);

      const response = await controller.create(dto);

      expect(response).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('pushSubscribe', () => {
    it('should delegate to service with user id and dto', async () => {
      const dto = { token: 'expo-token' } as never;
      mockService.pushSubscribe.mockResolvedValue({ success: true });

      const response = await controller.pushSubscribe(mockUser, dto);

      expect(response).toEqual({ success: true });
      expect(mockService.pushSubscribe).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('pushUnsubscribe', () => {
    it('should delegate to service with user id and dto', async () => {
      const dto = { token: 'expo-token' } as never;
      mockService.pushUnsubscribe.mockResolvedValue({ success: true });

      const response = await controller.pushUnsubscribe(mockUser, dto);

      expect(response).toEqual({ success: true });
      expect(mockService.pushUnsubscribe).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('bulkSend', () => {
    it('should delegate to service with dto', async () => {
      const dto = { userIds: [1, 2], title: 'Bulk' } as never;
      mockService.bulkSend.mockResolvedValue({ sent: 2 });

      const response = await controller.bulkSend(dto);

      expect(response).toEqual({ sent: 2 });
      expect(mockService.bulkSend).toHaveBeenCalledWith(dto);
    });
  });

  describe('markAsRead', () => {
    it('should delegate to service with id', async () => {
      mockService.markAsRead.mockResolvedValue({ success: true });

      const response = await controller.markAsRead(10);

      expect(response).toEqual({ success: true });
      expect(mockService.markAsRead).toHaveBeenCalledWith(10);
    });
  });

  describe('markAllAsRead', () => {
    it('should delegate to service with user id', async () => {
      mockService.markAllAsRead.mockResolvedValue({ updated: 5 });

      const response = await controller.markAllAsRead(mockUser);

      expect(response).toEqual({ updated: 5 });
      expect(mockService.markAllAsRead).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should delegate to service with id and dto', async () => {
      const dto = { title: 'Updated' } as never;
      const result = { id: 3, title: 'Updated' };
      mockService.update.mockResolvedValue(result);

      const response = await controller.update(3, dto);

      expect(response).toEqual(result);
      expect(mockService.update).toHaveBeenCalledWith(3, dto);
    });
  });

  describe('deleteAll', () => {
    it('should delegate to service with user id', async () => {
      mockService.deleteAll.mockResolvedValue({ deleted: 10 });

      const response = await controller.deleteAll(mockUser);

      expect(response).toEqual({ deleted: 10 });
      expect(mockService.deleteAll).toHaveBeenCalledWith(1);
    });
  });

  describe('remove', () => {
    it('should delegate to service with id', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(8);

      expect(mockService.remove).toHaveBeenCalledWith(8);
    });
  });
});
