import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PointsService } from './points.service';
import { PointTransaction } from '../database/entities/point-transaction.entity';
import { PointConfig } from '../database/entities/point-config.entity';
import { PointPromotion } from '../database/entities/point-promotion.entity';
import { PointTicketPrice } from '../database/entities/point-ticket-price.entity';
import { UserPick } from '../database/entities/user-pick.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { PicksService } from '../picks/picks.service';
import { PointTransactionType } from '../database/db-enums';
import {
  createMockRepository,
  createMockDataSource,
  createMockQueryBuilder,
} from '../test/mock-factories';

describe('PointsService', () => {
  let service: PointsService;
  const pointTransactionRepo = createMockRepository();
  const pointConfigRepo = createMockRepository();
  const pointPromotionRepo = createMockRepository();
  const pointTicketPriceRepo = createMockRepository();
  const userPickRepo = createMockRepository();
  const resultRepo = createMockRepository();
  const predictionTicketRepo = createMockRepository();
  const dataSource = createMockDataSource();

  const mockPicksService = {
    checkPickHit: jest.fn().mockReturnValue(false),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        {
          provide: getRepositoryToken(PointTransaction),
          useValue: pointTransactionRepo,
        },
        { provide: getRepositoryToken(PointConfig), useValue: pointConfigRepo },
        {
          provide: getRepositoryToken(PointPromotion),
          useValue: pointPromotionRepo,
        },
        {
          provide: getRepositoryToken(PointTicketPrice),
          useValue: pointTicketPriceRepo,
        },
        { provide: getRepositoryToken(UserPick), useValue: userPickRepo },
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
        {
          provide: getRepositoryToken(PredictionTicket),
          useValue: predictionTicketRepo,
        },
        { provide: PicksService, useValue: mockPicksService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
  });

  describe('getBalance', () => {
    it('should sum EARN types minus SPEND types correctly', async () => {
      pointTransactionRepo.find.mockResolvedValue([
        { transactionType: PointTransactionType.EARNED, amount: 100 },
        { transactionType: PointTransactionType.BONUS, amount: 50 },
        { transactionType: PointTransactionType.SPENT, amount: 30 },
        { transactionType: PointTransactionType.TRANSFER_OUT, amount: 20 },
      ]);

      const result = await service.getBalance(1);

      expect(result.currentPoints).toBe(100); // (100+50) - (30+20)
      expect(result.totalPointsEarned).toBe(150);
      expect(result.totalPointsSpent).toBe(50);
    });

    it('should return 0 when no transactions', async () => {
      pointTransactionRepo.find.mockResolvedValue([]);

      const result = await service.getBalance(1);

      expect(result.currentPoints).toBe(0);
    });
  });

  describe('grantDailyLoginBonus', () => {
    it('should create BONUS transaction with configured amount', async () => {
      pointConfigRepo.find.mockResolvedValue([
        { configKey: 'DAILY_LOGIN_BONUS_POINTS', configValue: '15' },
      ]);
      // getBalance for createTransaction
      pointTransactionRepo.find.mockResolvedValue([]);

      const result = await service.grantDailyLoginBonus(1);

      expect(result.points).toBe(15);
      expect(pointTransactionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          transactionType: PointTransactionType.BONUS,
          amount: 15,
        }),
      );
    });

    it('should no-op when config is 0', async () => {
      pointConfigRepo.find.mockResolvedValue([
        { configKey: 'DAILY_LOGIN_BONUS_POINTS', configValue: '0' },
      ]);

      const result = await service.grantDailyLoginBonus(1);

      expect(result.points).toBe(0);
      expect(pointTransactionRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('purchaseTicket', () => {
    beforeEach(() => {
      pointTicketPriceRepo.findOne.mockResolvedValue({
        pointsPerTicket: 1200,
        isActive: true,
      });
    });

    it('should deduct points and create tickets in transaction', async () => {
      pointTransactionRepo.find.mockResolvedValue([
        { transactionType: PointTransactionType.EARNED, amount: 5000 },
      ]);
      const mockTicketRepo = createMockRepository();
      const mockPtRepo = createMockRepository();
      dataSource._manager.getRepository.mockImplementation(
        (entity: unknown) => {
          if (entity === PredictionTicket) return mockTicketRepo;
          return mockPtRepo;
        },
      );

      const result = await service.purchaseTicket(1, { quantity: 2 });

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.pointsSpent).toBe(2400);
    });

    it('should throw on insufficient balance', async () => {
      pointTransactionRepo.find.mockResolvedValue([
        { transactionType: PointTransactionType.EARNED, amount: 100 },
      ]);

      await expect(service.purchaseTicket(1, { quantity: 2 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('awardPickPointsForRace', () => {
    it('should award points to winning picks', async () => {
      const pick = {
        id: 1,
        userId: 1,
        pickType: 'SINGLE',
        hrNos: ['1'],
        pointsAwarded: null,
      };
      userPickRepo.find.mockResolvedValue([pick]);
      pointConfigRepo.find.mockResolvedValue([
        { configKey: 'BASE_POINTS', configValue: '100' },
        { configKey: 'SINGLE_MULTIPLIER', configValue: '2' },
      ]);
      const resultQb = createMockQueryBuilder();
      resultQb.getMany.mockResolvedValue([
        { hrNo: '1', ord: '1', ordInt: 1, ordType: 'NORMAL' },
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);
      mockPicksService.checkPickHit.mockReturnValue(true);
      // getBalance for createTransaction
      pointTransactionRepo.find.mockResolvedValue([]);

      const result = await service.awardPickPointsForRace(1);

      expect(result.awarded).toBe(1);
      expect(pointTransactionRepo.save).toHaveBeenCalled();
      expect(userPickRepo.update).toHaveBeenCalledWith(1, {
        pointsAwarded: 200,
      });
    });

    it('should skip already-awarded picks', async () => {
      const pick = {
        id: 1,
        userId: 1,
        pickType: 'SINGLE',
        hrNos: ['1'],
        pointsAwarded: 100,
      };
      userPickRepo.find.mockResolvedValue([pick]);

      const result = await service.awardPickPointsForRace(1);

      expect(result.awarded).toBe(0);
    });
  });

  describe('transfer', () => {
    it('should create TRANSFER_OUT and TRANSFER_IN in transaction', async () => {
      // From user has 500 points
      pointTransactionRepo.find.mockResolvedValue([
        { transactionType: PointTransactionType.EARNED, amount: 500 },
      ]);

      const result = await service.transfer(1, {
        toUserId: '2',
        amount: 100,
        description: 'gift',
      });

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw on insufficient balance', async () => {
      pointTransactionRepo.find.mockResolvedValue([
        { transactionType: PointTransactionType.EARNED, amount: 50 },
      ]);

      await expect(
        service.transfer(1, {
          toUserId: '2',
          amount: 100,
          description: 'gift',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTicketPrice', () => {
    it('should return active price', async () => {
      pointTicketPriceRepo.findOne.mockResolvedValue({
        pointsPerTicket: 1500,
        isActive: true,
      });

      const result = await service.getTicketPrice();

      expect(result.pointsPerTicket).toBe(1500);
    });

    it('should return default 1200 when no active price', async () => {
      pointTicketPriceRepo.findOne.mockResolvedValue(null);

      const result = await service.getTicketPrice();

      expect(result.pointsPerTicket).toBe(1200);
    });
  });
});
