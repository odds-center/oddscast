import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KraController } from './kra.controller';
import { KraService } from './kra.service';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockKraService = {
  getBatchSchedules: jest.fn(),
  syncEntrySheet: jest.fn(),
  fetchRaceResults: jest.fn(),
  syncAnalysisData: jest.fn(),
  fetchJockeyTotalResults: jest.fn(),
  fetchDividends: jest.fn(),
};

const mockQueryBuilder = {
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockKraSyncLogRepo = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

describe('KraController', () => {
  let controller: KraController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KraController],
      providers: [
        { provide: KraService, useValue: mockKraService },
        {
          provide: getRepositoryToken(KraSyncLog),
          useValue: mockKraSyncLogRepo,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<KraController>(KraController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBatchSchedules', () => {
    it('should delegate to kraService.getBatchSchedules', async () => {
      const expected = { schedules: [], total: 0 };
      mockKraService.getBatchSchedules.mockResolvedValue(expected);

      const result = await controller.getBatchSchedules('PENDING', 10);

      expect(mockKraService.getBatchSchedules).toHaveBeenCalledWith({
        status: 'PENDING',
        limit: 10,
      });
      expect(result).toEqual(expected);
    });

    it('should pass undefined params when not provided', async () => {
      mockKraService.getBatchSchedules.mockResolvedValue({ schedules: [] });

      await controller.getBatchSchedules();

      expect(mockKraService.getBatchSchedules).toHaveBeenCalledWith({
        status: undefined,
        limit: undefined,
      });
    });
  });

  describe('getSyncLogs', () => {
    it('should query sync logs with default limit', async () => {
      const logs = [{ id: '1', endpoint: '/test' }];
      mockQueryBuilder.getMany.mockResolvedValue(logs);

      const result = await controller.getSyncLogs();

      expect(mockKraSyncLogRepo.createQueryBuilder).toHaveBeenCalledWith('k');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'k.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
      expect(result).toEqual({ logs, total: 1 });
    });

    it('should filter by endpoint when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await controller.getSyncLogs('syncEntrySheet');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'k.endpoint = :endpoint',
        { endpoint: 'syncEntrySheet' },
      );
    });

    it('should filter by rcDate when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await controller.getSyncLogs(undefined, '20250101');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'k.rcDate = :rcDate',
        { rcDate: '20250101' },
      );
    });

    it('should cap limit at 100', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await controller.getSyncLogs(undefined, undefined, 500);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });
  });

  describe('syncSchedule', () => {
    it('should delegate to kraService.syncEntrySheet', async () => {
      const expected = { races: 5, entries: 40 };
      mockKraService.syncEntrySheet.mockResolvedValue(expected);

      const result = await controller.syncSchedule('20250301');

      expect(mockKraService.syncEntrySheet).toHaveBeenCalledWith('20250301');
      expect(result).toEqual(expected);
    });
  });

  describe('syncResults', () => {
    it('should delegate to kraService.fetchRaceResults', async () => {
      const expected = { totalResults: 10 };
      mockKraService.fetchRaceResults.mockResolvedValue(expected);

      const result = await controller.syncResults('20250301');

      expect(mockKraService.fetchRaceResults).toHaveBeenCalledWith('20250301');
      expect(result).toEqual(expected);
    });
  });

  describe('syncDetails', () => {
    it('should delegate to kraService.syncAnalysisData', async () => {
      const expected = { synced: 5 };
      mockKraService.syncAnalysisData.mockResolvedValue(expected);

      const result = await controller.syncDetails('20250301');

      expect(mockKraService.syncAnalysisData).toHaveBeenCalledWith('20250301');
      expect(result).toEqual(expected);
    });
  });

  describe('syncJockeys', () => {
    it('should delegate to kraService.fetchJockeyTotalResults with meet', async () => {
      const expected = { jockeys: 20 };
      mockKraService.fetchJockeyTotalResults.mockResolvedValue(expected);

      const result = await controller.syncJockeys('SEOUL');

      expect(mockKraService.fetchJockeyTotalResults).toHaveBeenCalledWith(
        'SEOUL',
      );
      expect(result).toEqual(expected);
    });

    it('should pass undefined meet when not provided', async () => {
      mockKraService.fetchJockeyTotalResults.mockResolvedValue({ jockeys: 0 });

      await controller.syncJockeys();

      expect(mockKraService.fetchJockeyTotalResults).toHaveBeenCalledWith(
        undefined,
      );
    });
  });

  describe('syncDividends', () => {
    it('should delegate to kraService.fetchDividends', async () => {
      const expected = { dividends: 7 };
      mockKraService.fetchDividends.mockResolvedValue(expected);

      const result = await controller.syncDividends('20250301');

      expect(mockKraService.fetchDividends).toHaveBeenCalledWith('20250301');
      expect(result).toEqual(expected);
    });
  });
});
