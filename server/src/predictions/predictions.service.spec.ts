import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { Prediction } from '../database/entities/prediction.entity';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { AnalysisService } from '../analysis/analysis.service';
import { GlobalConfigService } from '../config/config.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PredictionStatus } from '../database/db-enums';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../test/mock-factories';
import {
  createTestPrediction,
  createTestRace,
  createTestRaceEntry,
} from '../test/test-entities';

describe('PredictionsService', () => {
  let service: PredictionsService;
  const predictionRepo = createMockRepository();
  const raceRepo = createMockRepository();
  const entryRepo = createMockRepository();
  const resultRepo = createMockRepository();
  const trainerResultRepo = createMockRepository();

  const mockAnalysisService = {
    calculateScore: jest.fn().mockResolvedValue({ scores: [] }),
  };
  const mockConfigService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  };
  const mockNotificationsService = {
    sendPredictionNotification: jest.fn().mockResolvedValue(undefined),
    sendToUsersByPreference: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionsService,
        { provide: getRepositoryToken(Prediction), useValue: predictionRepo },
        { provide: getRepositoryToken(Race), useValue: raceRepo },
        { provide: getRepositoryToken(RaceEntry), useValue: entryRepo },
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
        {
          provide: getRepositoryToken(TrainerResult),
          useValue: trainerResultRepo,
        },
        { provide: AnalysisService, useValue: mockAnalysisService },
        { provide: GlobalConfigService, useValue: mockConfigService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<PredictionsService>(PredictionsService);
  });

  describe('findAll', () => {
    it('should return paginated predictions filtered by status', async () => {
      const qb = createMockQueryBuilder();
      const pred = { ...createTestPrediction(), race: createTestRace() };
      qb.getManyAndCount.mockResolvedValue([[pred], 1]);
      predictionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        status: 'COMPLETED',
      });

      expect(result.total).toBe(1);
      expect(result.predictions).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith('p.status = :status', {
        status: 'COMPLETED',
      });
    });

    it('should return empty when no predictions match', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      predictionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.total).toBe(0);
      expect(result.predictions).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return prediction by id', async () => {
      const pred = { ...createTestPrediction(), race: createTestRace() };
      predictionRepo.findOne.mockResolvedValue(pred);
      entryRepo.find.mockResolvedValue([createTestRaceEntry()]);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.race).toBeDefined();
    });

    it('should throw NotFoundException', async () => {
      predictionRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAccuracyHistory', () => {
    it('should return accuracy for COMPLETED predictions', async () => {
      const predictions = [
        createTestPrediction({ accuracy: 66.7 }),
        createTestPrediction({ id: 2, accuracy: 33.3 }),
        createTestPrediction({ id: 3, accuracy: null }),
      ];
      predictionRepo.find.mockResolvedValue(predictions);

      const result = await service.getAccuracyHistory({ limit: 30 });

      // Should filter out null accuracy
      expect(result).toHaveLength(2);
      expect(result[0].accuracy).toBe(66.7);
    });
  });

  describe('getByRace', () => {
    it('should return latest prediction for raceId', async () => {
      const pred = createTestPrediction();
      predictionRepo.findOne.mockResolvedValue(pred);
      const race = createTestRace();
      raceRepo.findOne.mockResolvedValue(race);
      entryRepo.find.mockResolvedValue([createTestRaceEntry()]);

      const result = await service.getByRace(1);

      expect(result).toBeDefined();
      expect(result!.race).toBeDefined();
      expect(predictionRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { raceId: 1, status: PredictionStatus.COMPLETED },
        }),
      );
    });

    it('should return null when no prediction exists', async () => {
      predictionRepo.findOne.mockResolvedValue(null);

      const result = await service.getByRace(1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create prediction and return with race', async () => {
      const pred = createTestPrediction();
      predictionRepo.create.mockReturnValue(pred);
      predictionRepo.save.mockResolvedValue(pred);
      raceRepo.findOne.mockResolvedValue(createTestRace());

      const result = await service.create({ raceId: 1 });

      expect(result.race).toBeDefined();
      expect(predictionRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update prediction status and fields', async () => {
      const pred = createTestPrediction({ status: PredictionStatus.PENDING });
      predictionRepo.findOne.mockResolvedValue(pred);
      predictionRepo.save.mockResolvedValue({
        ...pred,
        status: PredictionStatus.COMPLETED,
      });

      const result = await service.updateStatus(1, {
        status: 'COMPLETED',
        accuracy: 85,
      });

      expect(result).toBeDefined();
      expect(predictionRepo.save).toHaveBeenCalled();
    });

    it('should return null when prediction not found', async () => {
      predictionRepo.findOne.mockResolvedValue(null);

      const result = await service.updateStatus(999, { status: 'COMPLETED' });

      expect(result).toBeNull();
    });
  });
});
