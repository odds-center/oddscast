import { Test, TestingModule } from '@nestjs/testing';
import { AdminPredictionsController } from './admin-predictions.controller';
import { PredictionsService } from '../predictions/predictions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockPredictionsService = {
  getAnalyticsDashboard: jest.fn(),
  getDashboard: jest.fn(),
  getAnalyticsFailures: jest.fn(),
  getCostStats: jest.fn(),
  getTodayCreatedCount: jest.fn(),
  findAllForAdmin: jest.fn(),
  getByRaceHistory: jest.fn(),
  getByRace: jest.fn(),
  generatePrediction: jest.fn(),
  generatePredictionsForDate: jest.fn(),
  generateBatch: jest.fn(),
  generateBatchWithProgress: jest.fn(),
};

describe('AdminPredictionsController', () => {
  let controller: AdminPredictionsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPredictionsController],
      providers: [
        { provide: PredictionsService, useValue: mockPredictionsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminPredictionsController>(AdminPredictionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAnalyticsDashboard', () => {
    it('should delegate to predictionsService.getAnalyticsDashboard', () => {
      const expected = { totalPredictions: 100, accuracy: 0.72 };
      mockPredictionsService.getAnalyticsDashboard.mockReturnValue(expected);

      const result = controller.getAnalyticsDashboard();

      expect(mockPredictionsService.getAnalyticsDashboard).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('calculateDailyStats', () => {
    it('should delegate to predictionsService.getDashboard', () => {
      const expected = { daily: [] };
      mockPredictionsService.getDashboard.mockReturnValue(expected);

      const result = controller.calculateDailyStats();

      expect(mockPredictionsService.getDashboard).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('getAnalyticsFailures', () => {
    it('should delegate with date range params', () => {
      const expected = { failures: [] };
      mockPredictionsService.getAnalyticsFailures.mockReturnValue(expected);

      const result = controller.getAnalyticsFailures('20250101', '20250131');

      expect(mockPredictionsService.getAnalyticsFailures).toHaveBeenCalledWith({
        startDate: '20250101',
        endDate: '20250131',
      });
      expect(result).toEqual(expected);
    });

    it('should pass undefined dates when not provided', () => {
      mockPredictionsService.getAnalyticsFailures.mockReturnValue({ failures: [] });

      controller.getAnalyticsFailures();

      expect(mockPredictionsService.getAnalyticsFailures).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  describe('getAccuracyStats', () => {
    it('should delegate to predictionsService.getDashboard', () => {
      mockPredictionsService.getDashboard.mockReturnValue({ accuracy: 0.75 });

      const result = controller.getAccuracyStats();

      expect(mockPredictionsService.getDashboard).toHaveBeenCalled();
      expect(result).toEqual({ accuracy: 0.75 });
    });
  });

  describe('getCost', () => {
    it('should delegate to predictionsService.getCostStats', () => {
      const expected = { totalCost: 5000 };
      mockPredictionsService.getCostStats.mockReturnValue(expected);

      const result = controller.getCost();

      expect(mockPredictionsService.getCostStats).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('getTodayCount', () => {
    it('should delegate to predictionsService.getTodayCreatedCount', () => {
      mockPredictionsService.getTodayCreatedCount.mockReturnValue({ count: 12 });

      const result = controller.getTodayCount();

      expect(mockPredictionsService.getTodayCreatedCount).toHaveBeenCalled();
      expect(result).toEqual({ count: 12 });
    });
  });

  describe('list', () => {
    it('should delegate with parsed pagination params', () => {
      const expected = { data: [], total: 0 };
      mockPredictionsService.findAllForAdmin.mockReturnValue(expected);

      const result = controller.list('2', '10', 'COMPLETED', '5');

      expect(mockPredictionsService.findAllForAdmin).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: 'COMPLETED',
        raceId: 5,
      });
      expect(result).toEqual(expected);
    });

    it('should use defaults when params are not provided', () => {
      mockPredictionsService.findAllForAdmin.mockReturnValue({ data: [] });

      controller.list();

      expect(mockPredictionsService.findAllForAdmin).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: undefined,
        raceId: undefined,
      });
    });

    it('should cap limit at 100', () => {
      mockPredictionsService.findAllForAdmin.mockReturnValue({ data: [] });

      controller.list('1', '999');

      expect(mockPredictionsService.findAllForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 }),
      );
    });
  });

  describe('getByRaceHistory', () => {
    it('should delegate to predictionsService.getByRaceHistory', () => {
      const expected = [{ id: '1' }];
      mockPredictionsService.getByRaceHistory.mockReturnValue(expected);

      const result = controller.getByRaceHistory(42);

      expect(mockPredictionsService.getByRaceHistory).toHaveBeenCalledWith(42);
      expect(result).toEqual(expected);
    });
  });

  describe('getByRace', () => {
    it('should delegate to predictionsService.getByRace', () => {
      const expected = { id: '1', raceId: 42 };
      mockPredictionsService.getByRace.mockReturnValue(expected);

      const result = controller.getByRace(42);

      expect(mockPredictionsService.getByRace).toHaveBeenCalledWith(42);
      expect(result).toEqual(expected);
    });
  });

  describe('generateForRace', () => {
    it('should delegate to predictionsService.generatePrediction', () => {
      const expected = { id: '1', status: 'COMPLETED' };
      mockPredictionsService.generatePrediction.mockReturnValue(expected);

      const result = controller.generateForRace(42);

      expect(mockPredictionsService.generatePrediction).toHaveBeenCalledWith(42);
      expect(result).toEqual(expected);
    });
  });

  describe('generateForDate', () => {
    it('should delegate to predictionsService.generatePredictionsForDate', () => {
      const expected = { generated: 10 };
      mockPredictionsService.generatePredictionsForDate.mockReturnValue(expected);

      const result = controller.generateForDate({ date: '20250301', meet: 'SEOUL' });

      expect(mockPredictionsService.generatePredictionsForDate).toHaveBeenCalledWith(
        '20250301',
        'SEOUL',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('generateBatch', () => {
    it('should delegate to predictionsService.generateBatch', () => {
      const expected = { generated: 5, failed: 1 };
      mockPredictionsService.generateBatch.mockReturnValue(expected);

      const result = controller.generateBatch({
        dateFrom: '20250101',
        dateTo: '20250131',
      });

      expect(mockPredictionsService.generateBatch).toHaveBeenCalledWith({
        dateFrom: '20250101',
        dateTo: '20250131',
      });
      expect(result).toEqual(expected);
    });
  });

  describe('generateBatchStream', () => {
    it('should set SSE headers and stream progress', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      } as unknown as import('express').Response;

      mockPredictionsService.generateBatchWithProgress.mockResolvedValue({
        generated: 3,
        failed: 0,
      });

      await controller.generateBatchStream('20250101', '20250131', mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockPredictionsService.generateBatchWithProgress).toHaveBeenCalledWith(
        { dateFrom: '20250101', dateTo: '20250131' },
        expect.any(Function),
      );
      expect(mockRes.write).toHaveBeenCalledWith(
        expect.stringContaining('"done":true'),
      );
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should write error on failure', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      } as unknown as import('express').Response;

      mockPredictionsService.generateBatchWithProgress.mockRejectedValue(
        new Error('Generation failed'),
      );

      await controller.generateBatchStream('20250101', '20250131', mockRes);

      expect(mockRes.write).toHaveBeenCalledWith(
        expect.stringContaining('Generation failed'),
      );
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should return early when res is undefined', async () => {
      const result = await controller.generateBatchStream();

      expect(result).toBeUndefined();
    });
  });
});
