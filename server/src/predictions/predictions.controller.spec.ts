import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const mockPredictionsService = {
  findAll: jest.fn(),
  getDashboard: jest.fn(),
  getAccuracyHistory: jest.fn(),
  getAnalyticsDashboard: jest.fn(),
  getCostStats: jest.fn(),
  getAnalyticsFailures: jest.fn(),
  getPreview: jest.fn(),
  getByRaceHistory: jest.fn(),
  getByRace: jest.fn(),
  getMatrix: jest.fn(),
  getCommentary: jest.fn(),
  getHitRecords: jest.fn(),
  getAccuracyStats: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  generatePrediction: jest.fn(),
};

describe('PredictionsController', () => {
  let controller: PredictionsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PredictionsController],
      providers: [
        { provide: PredictionsService, useValue: mockPredictionsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PredictionsController>(PredictionsController);
  });

  describe('findAll', () => {
    it('should delegate to service.findAll with filters', async () => {
      const filters = { page: 1, limit: 20 };
      const expected = { data: [], total: 0 };
      mockPredictionsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(filters as never);

      expect(mockPredictionsService.findAll).toHaveBeenCalledWith(filters);
      expect(result).toBe(expected);
    });
  });

  describe('getDashboard', () => {
    it('should delegate to service.getDashboard', async () => {
      const expected = { totalPredictions: 100 };
      mockPredictionsService.getDashboard.mockResolvedValue(expected);

      const result = await controller.getDashboard();

      expect(mockPredictionsService.getDashboard).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('getAccuracyHistory', () => {
    it('should delegate to service.getAccuracyHistory with filters', async () => {
      const filters = { startDate: '20250101', endDate: '20250301' };
      const expected = [{ date: '20250101', accuracy: 0.8 }];
      mockPredictionsService.getAccuracyHistory.mockResolvedValue(expected);

      const result = await controller.getAccuracyHistory(filters as never);

      expect(mockPredictionsService.getAccuracyHistory).toHaveBeenCalledWith(
        filters,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getAccuracyStats', () => {
    it('should delegate to service.getDashboard', async () => {
      const expected = { avgAccuracy: 0.75 };
      mockPredictionsService.getDashboard.mockResolvedValue(expected);

      const result = await controller.getAccuracyStats();

      expect(mockPredictionsService.getDashboard).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('getAnalyticsDashboard', () => {
    it('should delegate to service.getAnalyticsDashboard', async () => {
      const expected = { totalRaces: 50 };
      mockPredictionsService.getAnalyticsDashboard.mockResolvedValue(expected);

      const result = await controller.getAnalyticsDashboard();

      expect(mockPredictionsService.getAnalyticsDashboard).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('getCost', () => {
    it('should delegate to service.getCostStats', async () => {
      const expected = { totalCost: 500 };
      mockPredictionsService.getCostStats.mockResolvedValue(expected);

      const result = await controller.getCost();

      expect(mockPredictionsService.getCostStats).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('getAnalyticsFailures', () => {
    it('should delegate to service.getAnalyticsFailures with date range', async () => {
      const expected = [{ reason: 'timeout', count: 3 }];
      mockPredictionsService.getAnalyticsFailures.mockResolvedValue(expected);

      const result = await controller.getAnalyticsFailures(
        '2025-01-01',
        '2025-03-01',
      );

      expect(mockPredictionsService.getAnalyticsFailures).toHaveBeenCalledWith({
        startDate: '2025-01-01',
        endDate: '2025-03-01',
      });
      expect(result).toBe(expected);
    });
  });

  describe('getPreview', () => {
    it('should delegate to service.getPreview with raceId', async () => {
      const expected = { preview: 'Top 3 horses...' };
      mockPredictionsService.getPreview.mockResolvedValue(expected);

      const result = await controller.getPreview(1);

      expect(mockPredictionsService.getPreview).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('getPreviewAlias', () => {
    it('should delegate to service.getPreview with raceId', async () => {
      const expected = { preview: 'Top 3 horses...' };
      mockPredictionsService.getPreview.mockResolvedValue(expected);

      const result = await controller.getPreviewAlias(1);

      expect(mockPredictionsService.getPreview).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('getByRaceHistory', () => {
    it('should delegate to service.getByRaceHistory with raceId', async () => {
      const expected = [{ id: 1 }, { id: 2 }];
      mockPredictionsService.getByRaceHistory.mockResolvedValue(expected);

      const result = await controller.getByRaceHistory(1);

      expect(mockPredictionsService.getByRaceHistory).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('getByRace', () => {
    it('should delegate to service.getByRace with raceId', async () => {
      const expected = { id: 1, scores: {} };
      mockPredictionsService.getByRace.mockResolvedValue(expected);

      const result = await controller.getByRace(1);

      expect(mockPredictionsService.getByRace).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('getMatrix', () => {
    it('should delegate to service.getMatrix with date and meet', async () => {
      const expected = { matrix: [] };
      mockPredictionsService.getMatrix.mockResolvedValue(expected);

      const result = await controller.getMatrix('20250301', 'SEOUL');

      expect(mockPredictionsService.getMatrix).toHaveBeenCalledWith(
        '20250301',
        'SEOUL',
      );
      expect(result).toBe(expected);
    });
  });

  describe('getCommentary', () => {
    it('should delegate to service.getCommentary with parsed params', async () => {
      const expected = { items: [] };
      mockPredictionsService.getCommentary.mockResolvedValue(expected);

      const result = await controller.getCommentary(
        '20250301',
        'SEOUL',
        '10',
        '5',
      );

      expect(mockPredictionsService.getCommentary).toHaveBeenCalledWith(
        '20250301',
        10,
        5,
        'SEOUL',
      );
      expect(result).toBe(expected);
    });

    it('should use default limit and offset when not provided', async () => {
      mockPredictionsService.getCommentary.mockResolvedValue({ items: [] });

      await controller.getCommentary('20250301', undefined, undefined, undefined);

      expect(mockPredictionsService.getCommentary).toHaveBeenCalledWith(
        '20250301',
        20,
        0,
        undefined,
      );
    });
  });

  describe('getHitRecords', () => {
    it('should delegate to service.getHitRecords with parsed limit', async () => {
      const expected = [{ id: 1, hit: true }];
      mockPredictionsService.getHitRecords.mockResolvedValue(expected);

      const result = await controller.getHitRecords('10');

      expect(mockPredictionsService.getHitRecords).toHaveBeenCalledWith(10);
      expect(result).toBe(expected);
    });

    it('should use default limit of 5 when not provided', async () => {
      mockPredictionsService.getHitRecords.mockResolvedValue([]);

      await controller.getHitRecords(undefined);

      expect(mockPredictionsService.getHitRecords).toHaveBeenCalledWith(5);
    });
  });

  describe('getAccuracyStatsDashboard', () => {
    it('should delegate to service.getAccuracyStats', async () => {
      const expected = { overall: 0.72, monthly: [] };
      mockPredictionsService.getAccuracyStats.mockResolvedValue(expected);

      const result = await controller.getAccuracyStatsDashboard();

      expect(mockPredictionsService.getAccuracyStats).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne with id', async () => {
      const expected = { id: 1, scores: {} };
      mockPredictionsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(mockPredictionsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('create', () => {
    it('should delegate to service.create with dto', async () => {
      const dto = { raceId: 1 };
      const expected = { id: 1, raceId: 1 };
      mockPredictionsService.create.mockResolvedValue(expected);

      const result = await controller.create(dto as never);

      expect(mockPredictionsService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('calculateDailyStats', () => {
    it('should delegate to service.getDashboard', async () => {
      const expected = { totalPredictions: 50 };
      mockPredictionsService.getDashboard.mockResolvedValue(expected);

      const result = await controller.calculateDailyStats();

      expect(mockPredictionsService.getDashboard).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });

  describe('updateStatus', () => {
    it('should delegate to service.updateStatus with id and dto', async () => {
      const dto = { status: 'COMPLETED' };
      const expected = { id: 1, status: 'COMPLETED' };
      mockPredictionsService.updateStatus.mockResolvedValue(expected);

      const result = await controller.updateStatus(1, dto as never);

      expect(mockPredictionsService.updateStatus).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe('generate', () => {
    it('should delegate to service.generatePrediction with raceId', async () => {
      const expected = { id: 1, status: 'COMPLETED' };
      mockPredictionsService.generatePrediction.mockResolvedValue(expected);

      const result = await controller.generate(1);

      expect(mockPredictionsService.generatePrediction).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });
});
