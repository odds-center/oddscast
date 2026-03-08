import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { User } from '../database/entities/user.entity';
import { Race } from '../database/entities/race.entity';
import { SinglePurchase } from '../database/entities/single-purchase.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { TicketStatus } from '../database/db-enums';

const mockKraSyncLogRepo = { find: jest.fn() };
const mockSubscriptionRepo = {
  count: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};
const mockPlanRepo = { findOne: jest.fn() };
const mockUserRepo = { count: jest.fn(), find: jest.fn() };
const mockRaceRepo = { count: jest.fn(), find: jest.fn() };
const mockSinglePurchaseRepo = { createQueryBuilder: jest.fn() };
const mockPredictionTicketRepo = {
  findAndCount: jest.fn(),
  find: jest.fn(),
};

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(KraSyncLog),
          useValue: mockKraSyncLogRepo,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepo,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockPlanRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Race), useValue: mockRaceRepo },
        {
          provide: getRepositoryToken(SinglePurchase),
          useValue: mockSinglePurchaseRepo,
        },
        {
          provide: getRepositoryToken(PredictionTicket),
          useValue: mockPredictionTicketRepo,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------------------
  // getKraSyncLogs
  // -------------------------------------------------------------------
  describe('getKraSyncLogs', () => {
    it('returns all logs when no filters', async () => {
      const logs = [{ id: 1 }];
      mockKraSyncLogRepo.find.mockResolvedValue(logs);

      const result = await service.getKraSyncLogs();

      expect(result).toEqual({ logs, total: 1 });
      expect(mockKraSyncLogRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it('applies endpoint filter when provided', async () => {
      mockKraSyncLogRepo.find.mockResolvedValue([]);

      await service.getKraSyncLogs('/api/races');

      expect(mockKraSyncLogRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { endpoint: '/api/races' } }),
      );
    });

    it('caps take at 100', async () => {
      mockKraSyncLogRepo.find.mockResolvedValue([]);

      await service.getKraSyncLogs(undefined, undefined, 500);

      expect(mockKraSyncLogRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });

  // -------------------------------------------------------------------
  // getSubscriptionPlanById
  // -------------------------------------------------------------------
  describe('getSubscriptionPlanById', () => {
    it('delegates to planRepo.findOne', async () => {
      const plan = { id: 1, planName: 'STANDARD' };
      mockPlanRepo.findOne.mockResolvedValue(plan);

      const result = await service.getSubscriptionPlanById(1);

      expect(result).toEqual(plan);
      expect(mockPlanRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  // -------------------------------------------------------------------
  // getPredictionTicketUsage
  // -------------------------------------------------------------------
  describe('getPredictionTicketUsage', () => {
    it('returns paginated ticket usage with race info', async () => {
      const ticket = {
        id: 'tk-1',
        userId: 1,
        raceId: 1,
        user: null,
        predictionId: null,
        type: 'RACE',
        usedAt: new Date(),
        matrixDate: null,
      };
      mockPredictionTicketRepo.findAndCount.mockResolvedValue([[ticket], 1]);
      mockRaceRepo.find.mockResolvedValue([
        {
          id: 1,
          rcNo: '1',
          meet: '서울',
          meetName: '서울',
          rcDate: '20250301',
          rcName: null,
        },
      ]);

      const result = await service.getPredictionTicketUsage(1, 20);

      expect(result.total).toBe(1);
      expect(result.items[0].race?.meet).toBe('서울');
    });

    it('caps limit at 100', async () => {
      mockPredictionTicketRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getPredictionTicketUsage(1, 999);

      expect(mockPredictionTicketRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('filters by userId when provided', async () => {
      mockPredictionTicketRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getPredictionTicketUsage(1, 20, 42);

      expect(mockPredictionTicketRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: TicketStatus.USED, userId: 42 },
        }),
      );
    });
  });

  // -------------------------------------------------------------------
  // getTicketUsageTrend
  // -------------------------------------------------------------------
  describe('getTicketUsageTrend', () => {
    it('returns date-count array with all days initialised to 0', async () => {
      mockPredictionTicketRepo.find.mockResolvedValue([]);

      const result = await service.getTicketUsageTrend(7);

      expect(result).toHaveLength(7);
      result.forEach((r) => {
        expect(typeof r.date).toBe('string');
        expect(r.count).toBe(0);
      });
    });

    it('clamps days between 7 and 90', async () => {
      mockPredictionTicketRepo.find.mockResolvedValue([]);

      const r1 = await service.getTicketUsageTrend(3); // clamp → 7
      const r2 = await service.getTicketUsageTrend(200); // clamp → 90

      expect(r1).toHaveLength(7);
      expect(r2).toHaveLength(90);
    });
  });

  // -------------------------------------------------------------------
  // getDashboardStats
  // -------------------------------------------------------------------
  describe('getDashboardStats', () => {
    it('returns aggregated counts', async () => {
      mockUserRepo.count.mockResolvedValue(100);
      mockRaceRepo.count.mockResolvedValue(5);
      mockSubscriptionRepo.count.mockResolvedValue(10);

      const result = await service.getDashboardStats();

      expect(result.totalUsers).toBe(100);
      expect(result.todayRaces).toBe(5);
      expect(result.activeSubscriptions).toBe(10);
    });
  });
});
