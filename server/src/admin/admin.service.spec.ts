import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import { Bet } from '../database/entities/bet.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { User } from '../database/entities/user.entity';
import { Race } from '../database/entities/race.entity';
import { SinglePurchase } from '../database/entities/single-purchase.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { BetStatus, TicketStatus } from '../database/db-enums';

function makeQb(rawResult: unknown = { sum: '0' }) {
  const qb: Record<string, jest.Mock> = {
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getRawOne: jest.fn().mockResolvedValue(rawResult),
  };
  Object.values(qb).forEach((fn) => {
    if (fn !== qb.getRawOne) fn.mockReturnThis();
  });
  return qb;
}

const mockKraSyncLogRepo = { find: jest.fn() };
const mockBetRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
};
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
        { provide: getRepositoryToken(Bet), useValue: mockBetRepo },
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
  // getBetsAdmin
  // -------------------------------------------------------------------
  describe('getBetsAdmin', () => {
    it('paginates correctly and includes race summary', async () => {
      const bet = {
        id: 1,
        race: {
          id: 1,
          meet: '서울',
          rcDate: '20250301',
          rcNo: '1',
          rcName: '특별',
        },
      };
      mockBetRepo.findAndCount.mockResolvedValue([[bet], 1]);

      const result = await service.getBetsAdmin(1, 10);

      expect(result.meta.total).toBe(1);
      expect(result.data[0].race?.meet).toBe('서울');
    });

    it('applies userId and status filter when provided', async () => {
      mockBetRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getBetsAdmin(1, 10, 5, undefined, 'CONFIRMED');

      expect(mockBetRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 5, betStatus: BetStatus.CONFIRMED },
        }),
      );
    });
  });

  // -------------------------------------------------------------------
  // getBetById
  // -------------------------------------------------------------------
  describe('getBetById', () => {
    it('returns null when bet is not found', async () => {
      mockBetRepo.findOne.mockResolvedValue(null);
      const result = await service.getBetById(999);
      expect(result).toBeNull();
    });

    it('returns shaped bet with race and user summaries', async () => {
      mockBetRepo.findOne.mockResolvedValue({
        id: 1,
        race: {
          id: 1,
          meet: '서울',
          rcDate: '20250301',
          rcNo: '1',
          rcName: null,
        },
        user: { id: 1, email: 'a@b.com', name: '홍길동' },
      });

      const result = await service.getBetById(1);

      expect(result?.race?.meet).toBe('서울');
      expect(result?.user?.email).toBe('a@b.com');
    });
  });

  // -------------------------------------------------------------------
  // updateBetStatus
  // -------------------------------------------------------------------
  describe('updateBetStatus', () => {
    it('calls update then returns refreshed bet', async () => {
      mockBetRepo.update.mockResolvedValue({ affected: 1 });
      mockBetRepo.findOne.mockResolvedValue({
        id: 1,
        betStatus: BetStatus.CONFIRMED,
        race: null,
        user: null,
      });

      const result = await service.updateBetStatus(1, BetStatus.CONFIRMED);

      expect(mockBetRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ betStatus: BetStatus.CONFIRMED }),
      );
      expect(result?.race).toBeNull();
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
    it('returns aggregated counts and amounts', async () => {
      mockUserRepo.count.mockResolvedValue(100);
      mockRaceRepo.count.mockResolvedValue(5);
      mockBetRepo.count.mockResolvedValue(20);
      mockSubscriptionRepo.count.mockResolvedValue(10);

      const qb = makeQb({ sum: '50000' });
      mockBetRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getDashboardStats();

      expect(result.totalUsers).toBe(100);
      expect(result.todayRaces).toBe(5);
      expect(result.totalBets.amount).toBe(50000);
      expect(result.activeSubscriptions).toBe(10);
    });
  });
});
