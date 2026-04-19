import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PredictionTicketsService } from './prediction-tickets.service';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { Race } from '../database/entities/race.entity';
import { PredictionsService } from '../predictions/predictions.service';
import { KraService } from '../kra/kra.service';
import { GlobalConfigService } from '../config/config.service';
import { DiscordService } from '../discord/discord.service';
import { TicketStatus, TicketType } from '../database/db-enums';
import {
  createMockRepository,
  createMockDataSource,
  createMockQueryBuilder,
} from '../test/mock-factories';
import {
  createTestPredictionTicket,
  createTestPrediction,
} from '../test/test-entities';

describe('PredictionTicketsService', () => {
  let service: PredictionTicketsService;
  const ticketRepo = createMockRepository();
  const predictionRepo = createMockRepository();
  const raceRepo = createMockRepository();
  const dataSource = createMockDataSource();

  const mockPredictionsService = {
    generatePrediction: jest.fn().mockResolvedValue(createTestPrediction()),
  };

  const mockKraService = {
    refreshRaceDayRealtime: jest
      .fn()
      .mockResolvedValue({ refreshed: true, updated: ['track', 'weight'] }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Default: raceRepo.findOne returns a race
    raceRepo.findOne.mockResolvedValue({
      id: 1,
      rcDate: '20260308',
      meet: '서울',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionTicketsService,
        { provide: getRepositoryToken(PredictionTicket), useValue: ticketRepo },
        { provide: getRepositoryToken(Prediction), useValue: predictionRepo },
        { provide: getRepositoryToken(Race), useValue: raceRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: PredictionsService, useValue: mockPredictionsService },
        { provide: KraService, useValue: mockKraService },
        {
          provide: GlobalConfigService,
          useValue: { get: jest.fn().mockResolvedValue('1000') },
        },
        {
          provide: DiscordService,
          useValue: {
            notifyRaceTicketUsed: jest.fn().mockResolvedValue(undefined),
            notifyMatrixTicketUsed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<PredictionTicketsService>(PredictionTicketsService);
  });

  describe('useTicket', () => {
    it('should refresh KRA data, generate real-time prediction, and mark ticket USED', async () => {
      // No rate limit (no previous usage)
      ticketRepo.findOne.mockResolvedValueOnce(null);
      // Available ticket via transaction manager QB
      const ticket = createTestPredictionTicket();
      const managerRepo = dataSource._manager.getRepository();
      const managerQb = createMockQueryBuilder();
      managerQb.getOne.mockResolvedValue(ticket);
      managerRepo.createQueryBuilder.mockReturnValue(managerQb);
      managerRepo.update.mockResolvedValue({ affected: 1 });
      // Generated prediction
      const pred = createTestPrediction();
      mockPredictionsService.generatePrediction.mockResolvedValue(pred);
      // After linking prediction, return updated ticket
      ticketRepo.findOne
        .mockResolvedValueOnce(null) // rate limit check
        .mockResolvedValueOnce({
          ...ticket,
          status: TicketStatus.USED,
          predictionId: pred.id,
        }); // after link

      const result = await service.useTicket(1, { raceId: '1' });

      expect(mockKraService.refreshRaceDayRealtime).toHaveBeenCalledWith(
        '20260308',
      );
      expect(mockPredictionsService.generatePrediction).toHaveBeenCalledWith(
        1,
        {
          skipCache: true,
          realtime: true,
        },
      );
      // Ticket is consumed in transaction, then prediction is linked separately
      expect(ticketRepo.update).toHaveBeenCalledWith(
        ticket.id,
        expect.objectContaining({ predictionId: pred.id }),
      );
      expect(result.status).toBe('LINKED');
      expect(result.prediction).toBeDefined();
    });

    it('should throw when no available tickets', async () => {
      ticketRepo.findOne.mockResolvedValue(null); // no rate limit
      // Transaction manager's repo QB returns no ticket
      const managerRepo = dataSource._manager.getRepository();
      const managerQb = createMockQueryBuilder();
      managerQb.getOne.mockResolvedValue(null); // no available tickets
      managerRepo.createQueryBuilder.mockReturnValue(managerQb);

      await expect(service.useTicket(1, { raceId: '1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw within 60s of last use for same race (rate limit)', async () => {
      const recentUsage = {
        usedAt: new Date(Date.now() - 30_000), // 30 seconds ago
      };
      ticketRepo.findOne.mockResolvedValue(recentUsage);

      await expect(service.useTicket(1, { raceId: '1' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('grantTickets', () => {
    it('should create N tickets with correct type and expiry', async () => {
      const ticket = createTestPredictionTicket();
      ticketRepo.create.mockReturnValue(ticket);
      ticketRepo.save.mockResolvedValue([ticket, ticket, ticket]);

      const result = await service.grantTickets(1, 3, 30, 'RACE');

      expect(result.granted).toBe(3);
      expect(ticketRepo.save).toHaveBeenCalledTimes(1);
      expect(ticketRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: TicketType.RACE,
          status: TicketStatus.AVAILABLE,
        }),
      );
    });

    it('should throw when count < 1 or > 100', async () => {
      await expect(service.grantTickets(1, 0, 30)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.grantTickets(1, 101, 30)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('useMatrixTicket', () => {
    it('should return existing ticket if already used for same date (duplicate prevention)', async () => {
      const existing = createTestPredictionTicket({
        type: TicketType.MATRIX,
        status: TicketStatus.USED,
        matrixDate: '20250301',
        expiresAt: new Date(Date.now() + 86400000),
      });
      ticketRepo.findOne
        .mockResolvedValueOnce(existing) // existing check
        .mockResolvedValueOnce(existing); // re-fetch

      const result = await service.useMatrixTicket(1, '20250301');

      expect(result.alreadyUsed).toBe(true);
      expect(ticketRepo.update).not.toHaveBeenCalled();
    });

    it('should use FIFO selection (earliest expiry)', async () => {
      ticketRepo.findOne.mockResolvedValueOnce(null); // no existing
      const ticket = createTestPredictionTicket({ type: TicketType.MATRIX });
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(ticket);
      ticketRepo.createQueryBuilder.mockReturnValue(qb);
      ticketRepo.findOne.mockResolvedValueOnce({
        ...ticket,
        status: TicketStatus.USED,
      }); // after update

      const result = await service.useMatrixTicket(1, '20250301');

      expect(result.alreadyUsed).toBe(false);
      expect(ticketRepo.update).toHaveBeenCalledWith(
        ticket.id,
        expect.objectContaining({
          status: TicketStatus.USED,
          matrixDate: '20250301',
        }),
      );
    });

    it('should throw when no available MATRIX tickets', async () => {
      ticketRepo.findOne.mockResolvedValue(null); // no existing
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(null);
      ticketRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.useMatrixTicket(1, '20250301')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getBalance', () => {
    it('should count available, used, expired correctly', async () => {
      const availQb = createMockQueryBuilder();
      availQb.getCount.mockResolvedValue(5);
      const expiredQb = createMockQueryBuilder();
      expiredQb.getCount.mockResolvedValue(2);
      ticketRepo.createQueryBuilder
        .mockReturnValueOnce(availQb)
        .mockReturnValueOnce(expiredQb);
      ticketRepo.count.mockResolvedValue(3); // used count

      const result = await service.getBalance(1);

      expect(result.available).toBe(5);
      expect(result.used).toBe(3);
      expect(result.expired).toBe(2);
      expect(result.total).toBe(10);
    });
  });

  describe('checkMatrixAccess', () => {
    it('should return hasAccess=true when used ticket exists', async () => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue({
        expiresAt: new Date(Date.now() + 86400000),
      });
      ticketRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.checkMatrixAccess(1, '20250301');

      expect(result.hasAccess).toBe(true);
      expect(result.expiresAt).toBeDefined();
    });

    it('should return hasAccess=false otherwise', async () => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(null);
      ticketRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.checkMatrixAccess(1, '20250301');

      expect(result.hasAccess).toBe(false);
    });
  });
});
