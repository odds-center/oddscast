import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLogsService } from './activity-logs.service';
import { AdminActivityLog } from '../database/entities/admin-activity-log.entity';
import { UserActivityLog } from '../database/entities/user-activity-log.entity';
import { createMockRepository } from '../test/mock-factories';

describe('ActivityLogsService', () => {
  let service: ActivityLogsService;
  let adminLogRepo: ReturnType<typeof createMockRepository>;
  let userLogRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    adminLogRepo = createMockRepository();
    userLogRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogsService,
        {
          provide: getRepositoryToken(AdminActivityLog),
          useValue: adminLogRepo,
        },
        {
          provide: getRepositoryToken(UserActivityLog),
          useValue: userLogRepo,
        },
      ],
    }).compile();

    service = module.get<ActivityLogsService>(ActivityLogsService);
  });

  describe('logAdminActivity', () => {
    it('saves admin activity log with all fields', async () => {
      await service.logAdminActivity({
        adminUserId: 1,
        adminEmail: 'admin@test.com',
        action: 'CREATE_RACE',
        target: 'Race#42',
        ipAddress: '127.0.0.1',
      });

      expect(adminLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminUserId: 1,
          adminEmail: 'admin@test.com',
          action: 'CREATE_RACE',
          target: 'Race#42',
          ipAddress: '127.0.0.1',
        }),
      );
      expect(adminLogRepo.save).toHaveBeenCalled();
    });

    it('fills null for optional fields when omitted', async () => {
      await service.logAdminActivity({ action: 'LOGIN' });

      expect(adminLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminUserId: null,
          adminEmail: null,
          action: 'LOGIN',
          target: null,
          details: null,
          ipAddress: null,
          userAgent: null,
        }),
      );
    });

    it('does not throw when save fails (logs warning instead)', async () => {
      adminLogRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.logAdminActivity({ action: 'FAIL_TEST' }),
      ).resolves.toBeUndefined();
    });

    it('includes helpful message for missing table error', async () => {
      adminLogRepo.save.mockRejectedValue(
        new Error('relation "admin_activity_logs" does not exist'),
      );
      const warnSpy = jest
        .spyOn(
          (service as unknown as { logger: { warn: jest.Mock } }).logger,
          'warn',
        )
        .mockImplementation();

      await service.logAdminActivity({ action: 'TEST' });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('setup.sh'));
    });
  });

  describe('getAdminLogs', () => {
    it('returns paginated admin logs without filters', async () => {
      const logs = [{ id: 1, action: 'LOGIN' }];
      adminLogRepo._qb.getManyAndCount.mockResolvedValue([logs, 1]);

      const result = await service.getAdminLogs({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('applies adminUserId filter', async () => {
      adminLogRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAdminLogs({ adminUserId: 5, page: 1, limit: 10 });

      expect(adminLogRepo._qb.andWhere).toHaveBeenCalledWith(
        'a.adminUserId = :adminUserId',
        { adminUserId: 5 },
      );
    });

    it('applies action filter', async () => {
      adminLogRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAdminLogs({ action: 'SYNC_KRA', page: 1, limit: 10 });

      expect(adminLogRepo._qb.andWhere).toHaveBeenCalledWith(
        'a.action = :action',
        { action: 'SYNC_KRA' },
      );
    });

    it('applies date range filters', async () => {
      adminLogRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAdminLogs({
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        page: 1,
        limit: 10,
      });

      expect(adminLogRepo._qb.andWhere).toHaveBeenCalledWith(
        'a.createdAt >= :dateFrom',
        expect.any(Object),
      );
      expect(adminLogRepo._qb.andWhere).toHaveBeenCalledWith(
        'a.createdAt <= :dateTo',
        expect.any(Object),
      );
    });

    it('clamps limit to max 100', async () => {
      adminLogRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAdminLogs({ page: 1, limit: 999 });

      expect(adminLogRepo._qb.take).toHaveBeenCalledWith(100);
    });
  });

  describe('logUserActivity', () => {
    it('saves user activity with all fields', async () => {
      await service.logUserActivity({
        userId: 10,
        event: 'PAGE_VIEW',
        page: '/races',
        sessionId: 'sess-abc',
      });

      expect(userLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          event: 'PAGE_VIEW',
          page: '/races',
          sessionId: 'sess-abc',
        }),
      );
      expect(userLogRepo.save).toHaveBeenCalled();
    });

    it('does not throw on DB error', async () => {
      userLogRepo.save.mockRejectedValue(new Error('DB down'));

      await expect(
        service.logUserActivity({ event: 'TEST' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('logUserActivities', () => {
    it('logs multiple events sequentially', async () => {
      await service.logUserActivities([
        { event: 'PAGE_VIEW', page: '/races' },
        { event: 'CLICK', target: 'race-card' },
      ]);

      expect(userLogRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserLogs', () => {
    it('returns paginated user logs', async () => {
      const logs = [{ id: 1, event: 'PAGE_VIEW' }];
      userLogRepo._qb.getManyAndCount.mockResolvedValue([logs, 1]);

      const result = await service.getUserLogs({
        userId: 10,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
    });

    it('applies userId and event filters', async () => {
      userLogRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getUserLogs({
        userId: 5,
        event: 'RACE_VIEW',
        page: 1,
        limit: 10,
      });

      expect(userLogRepo._qb.andWhere).toHaveBeenCalledWith(
        'u.userId = :userId',
        { userId: 5 },
      );
      expect(userLogRepo._qb.andWhere).toHaveBeenCalledWith(
        'u.event = :event',
        { event: 'RACE_VIEW' },
      );
    });
  });

  describe('getUserActivitySummary', () => {
    it('returns summary with counts and top events', async () => {
      userLogRepo.count.mockResolvedValue(50);
      userLogRepo.find.mockResolvedValue([{ id: 1, event: 'PAGE_VIEW' }]);
      userLogRepo._qb.getRawMany.mockResolvedValue([
        { event: 'PAGE_VIEW', count: '30' },
        { event: 'CLICK', count: '20' },
      ]);

      const result = await service.getUserActivitySummary(10);

      expect(result.totalEvents).toBe(50);
      expect(result.recentEvents).toHaveLength(1);
      expect(result.topEvents).toHaveLength(2);
      expect(result.topEvents[0]).toEqual({ event: 'PAGE_VIEW', count: 30 });
    });
  });
});
