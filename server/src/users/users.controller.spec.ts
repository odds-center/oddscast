import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../common/decorators/current-user.decorator';

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@test.com',
  role: 'USER' as never,
};

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  getStats: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const expected = { data: [], total: 0 };
      mockUsersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(1, 20, 'USER');

      expect(mockUsersService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        role: 'USER',
      });
      expect(result).toBe(expected);
    });
  });

  describe('search', () => {
    it('should search users by query string', async () => {
      const expected = { data: [], total: 0 };
      mockUsersService.findAll.mockResolvedValue(expected);

      const result = await controller.search('test');

      expect(mockUsersService.findAll).toHaveBeenCalledWith({ search: 'test' });
      expect(result).toBe(expected);
    });
  });

  describe('getMe', () => {
    it('should return current user info', async () => {
      const user = { id: 1, email: 'test@test.com' };
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.getMe(mockUser);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(user);
    });
  });

  describe('getMyStats', () => {
    it('should return current user stats', async () => {
      const stats = { totalPredictions: 10 };
      mockUsersService.getStats.mockResolvedValue(stats);

      const result = await controller.getMyStats(mockUser);

      expect(mockUsersService.getStats).toHaveBeenCalledWith(1);
      expect(result).toBe(stats);
    });
  });

  describe('getProfile', () => {
    it('should return user profile when accessing own profile', async () => {
      const user = { id: 1, email: 'test@test.com' };
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.getProfile(1, mockUser);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(user);
    });

    it('should throw ForbiddenException when accessing another user profile', () => {
      expect(() => controller.getProfile(5, mockUser)).toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile when user owns the profile', async () => {
      const dto = { nickname: 'NewNick' };
      const updated = { id: 1, nickname: 'NewNick' };
      mockUsersService.update.mockResolvedValue(updated);

      const result = await controller.updateProfile(1, dto as never, mockUser);

      expect(mockUsersService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(updated);
    });

    it('should throw ForbiddenException when user does not own the profile', () => {
      const dto = { nickname: 'NewNick' };

      expect(() =>
        controller.updateProfile(5, dto as never, mockUser),
      ).toThrow('본인의 프로필만 수정할 수 있습니다.');
    });
  });

  describe('findOne', () => {
    it('should return user when accessing own record', async () => {
      const user = { id: 1 };
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne(1, mockUser);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(user);
    });

    it('should throw ForbiddenException when accessing another user', () => {
      expect(() => controller.findOne(3, mockUser)).toThrow();
    });
  });

  describe('getStats', () => {
    it('should return user stats when accessing own stats', async () => {
      const stats = { totalPredictions: 5 };
      mockUsersService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats(1, mockUser);

      expect(mockUsersService.getStats).toHaveBeenCalledWith(1);
      expect(result).toBe(stats);
    });

    it('should throw ForbiddenException when accessing another user stats', () => {
      expect(() => controller.getStats(7, mockUser)).toThrow();
    });
  });

  describe('getStatistics', () => {
    it('should return user statistics when accessing own record', async () => {
      const stats = { totalPredictions: 5 };
      mockUsersService.getStats.mockResolvedValue(stats);

      const result = await controller.getStatistics(1, mockUser);

      expect(mockUsersService.getStats).toHaveBeenCalledWith(1);
      expect(result).toBe(stats);
    });

    it('should throw ForbiddenException when accessing another user statistics', () => {
      expect(() => controller.getStatistics(7, mockUser)).toThrow();
    });
  });

  describe('getAchievements', () => {
    it('should return empty array (stub)', () => {
      const result = controller.getAchievements('1');

      expect(result).toEqual([]);
    });
  });

  describe('getActivities', () => {
    it('should return empty activities (stub)', () => {
      const result = controller.getActivities('1');

      expect(result).toEqual({
        activities: [],
        total: 0,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('getNotifications', () => {
    it('should return empty notifications (stub)', () => {
      const result = controller.getNotifications('1');

      expect(result).toEqual({
        notifications: [],
        total: 0,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('getPreferences', () => {
    it('should return default preferences (stub)', () => {
      const result = controller.getPreferences('1');

      expect(result).toEqual({ marketing: true, notifications: true });
    });
  });

  describe('updatePreferences', () => {
    it('should return default preferences (stub)', () => {
      const result = controller.updatePreferences('1', {
        marketing: false,
      });

      expect(result).toEqual({ marketing: true, notifications: true });
    });
  });

  describe('update', () => {
    it('should update user by id', async () => {
      const dto = { nickname: 'Updated' };
      const updated = { id: 2, nickname: 'Updated' };
      mockUsersService.update.mockResolvedValue(updated);

      const result = await controller.update(2, dto as never);

      expect(mockUsersService.update).toHaveBeenCalledWith(2, dto);
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('should deactivate user by id', async () => {
      mockUsersService.remove.mockResolvedValue({ affected: 1 });

      const result = await controller.remove(10);

      expect(mockUsersService.remove).toHaveBeenCalledWith(10);
      expect(result).toEqual({ affected: 1 });
    });
  });
});
