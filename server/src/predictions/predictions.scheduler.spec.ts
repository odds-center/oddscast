import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PredictionsScheduler } from './predictions.scheduler';
import { PredictionsService } from './predictions.service';
import { GlobalConfigService } from '../config/config.service';
import { Race } from '../database/entities/race.entity';
import { createMockQueryBuilder } from '../test/mock-factories';

/** QB mock with setParameter + subQuery support for scheduler's complex queries */
function makeQb(races: unknown[] = []) {
  const qb = createMockQueryBuilder();
  qb.getMany.mockResolvedValue(races);
  // setParameter is called after andWhere in scheduler
  (qb as Record<string, jest.Mock>).setParameter = jest.fn().mockReturnValue(qb);
  // subQuery returns a mini-builder that terminates with getQuery
  const subQb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('(sub)'),
  };
  qb.subQuery.mockReturnValue(subQb);
  return qb;
}

describe('PredictionsScheduler', () => {
  let scheduler: PredictionsScheduler;
  let raceCreateQb: jest.Mock;

  const mockPredictionsService = {
    generatePrediction: jest.fn().mockResolvedValue({ id: 1 }),
  };
  const mockConfigService = {
    get: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    raceCreateQb = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionsScheduler,
        {
          provide: getRepositoryToken(Race),
          useValue: { createQueryBuilder: raceCreateQb },
        },
        { provide: PredictionsService, useValue: mockPredictionsService },
        { provide: GlobalConfigService, useValue: mockConfigService },
      ],
    }).compile();

    scheduler = module.get<PredictionsScheduler>(PredictionsScheduler);
  });

  describe('generatePredictionsForToday', () => {
    it('should skip when enableBatchPrediction is false', async () => {
      mockConfigService.get.mockResolvedValue(
        JSON.stringify({ enableBatchPrediction: false }),
      );

      await scheduler.generatePredictionsForToday();

      expect(raceCreateQb).not.toHaveBeenCalled();
      expect(mockPredictionsService.generatePrediction).not.toHaveBeenCalled();
    });

    it('should do nothing when no races need prediction', async () => {
      mockConfigService.get.mockResolvedValue(null);
      raceCreateQb.mockReturnValue(makeQb([]));

      await scheduler.generatePredictionsForToday();

      expect(mockPredictionsService.generatePrediction).not.toHaveBeenCalled();
    });

    it('should generate predictions for each unpredicted race', async () => {
      mockConfigService.get.mockResolvedValue(null);
      raceCreateQb.mockReturnValue(
        makeQb([
          { id: 1, rcNo: '1', meet: '서울' },
          { id: 2, rcNo: '2', meet: '서울' },
        ]),
      );

      await scheduler.generatePredictionsForToday();

      expect(mockPredictionsService.generatePrediction).toHaveBeenCalledTimes(2);
      expect(mockPredictionsService.generatePrediction).toHaveBeenCalledWith(1);
      expect(mockPredictionsService.generatePrediction).toHaveBeenCalledWith(2);
    });

    it('should continue generating even when one race fails', async () => {
      mockConfigService.get.mockResolvedValue(null);
      raceCreateQb.mockReturnValue(
        makeQb([
          { id: 1, rcNo: '1', meet: '서울' },
          { id: 2, rcNo: '2', meet: '서울' },
          { id: 3, rcNo: '3', meet: '서울' },
        ]),
      );

      mockPredictionsService.generatePrediction
        .mockResolvedValueOnce({ id: 10 })
        .mockRejectedValueOnce(new Error('Gemini timeout'))
        .mockResolvedValueOnce({ id: 30 });

      await scheduler.generatePredictionsForToday();

      // All 3 should be attempted despite race 2 failing
      expect(mockPredictionsService.generatePrediction).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed ai_config gracefully', async () => {
      mockConfigService.get.mockResolvedValue('not valid json {{{');
      raceCreateQb.mockReturnValue(makeQb([]));

      // Should not throw
      await scheduler.generatePredictionsForToday();
    });
  });

  describe('generatePredictionsForCompletedRaces', () => {
    it('should skip when batch prediction disabled', async () => {
      mockConfigService.get.mockResolvedValue(
        JSON.stringify({ enableBatchPrediction: false }),
      );

      await scheduler.generatePredictionsForCompletedRaces();

      expect(mockPredictionsService.generatePrediction).not.toHaveBeenCalled();
    });

    it('should generate predictions for completed races without predictions', async () => {
      mockConfigService.get.mockResolvedValue(null);
      raceCreateQb.mockReturnValue(
        makeQb([{ id: 10, rcNo: '5', meet: '부산경남', rcDate: '20260318' }]),
      );

      await scheduler.generatePredictionsForCompletedRaces();

      expect(mockPredictionsService.generatePrediction).toHaveBeenCalledWith(10);
    });

    it('should do nothing when all completed races have predictions', async () => {
      mockConfigService.get.mockResolvedValue(null);
      raceCreateQb.mockReturnValue(makeQb([]));

      await scheduler.generatePredictionsForCompletedRaces();

      expect(mockPredictionsService.generatePrediction).not.toHaveBeenCalled();
    });
  });
});
