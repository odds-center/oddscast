import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ResultsService } from './results.service';
import { RaceResult } from '../database/entities/race-result.entity';
import { Race } from '../database/entities/race.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { PredictionsService } from '../predictions/predictions.service';
import { RaceStatus } from '../database/db-enums';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../test/mock-factories';
import {
  createTestRaceResult,
  createTestRace,
  createTestPrediction,
} from '../test/test-entities';

describe('ResultsService', () => {
  let service: ResultsService;
  const resultRepo = createMockRepository();
  const raceRepo = createMockRepository();
  const predictionRepo = createMockRepository();

  const mockPredictionsService = {
    generatePostRaceSummary: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
        { provide: getRepositoryToken(Race), useValue: raceRepo },
        { provide: getRepositoryToken(Prediction), useValue: predictionRepo },
        { provide: PredictionsService, useValue: mockPredictionsService },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
  });

  describe('bulkCreate', () => {
    const makeDto = (raceIds: number[]) => ({
      results: raceIds.map((raceId, i) => ({
        raceId,
        hrNo: String(i + 1),
        hrName: `Horse${i + 1}`,
        ord: String(i + 1),
      })),
    });

    it('should create all result rows in a single batch save', async () => {
      const dto = makeDto([1, 1, 1]);
      resultRepo.create.mockImplementation((e) => e);
      resultRepo.save.mockImplementation((entities: unknown) =>
        Promise.resolve(
          Array.isArray(entities)
            ? entities.map((e, i) => ({ id: i + 1, ...e }))
            : { id: 1, ...(entities as object) },
        ),
      );

      const result = await service.bulkCreate(dto);

      expect(result.count).toBe(3);
      // Now uses a single batch save call instead of one per row
      expect(resultRepo.save).toHaveBeenCalledTimes(1);
      expect(resultRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Object)]),
        { chunk: 100 },
      );
    });

    it('should mark ALL unique raceIds as COMPLETED (regression test)', async () => {
      // This is a regression test for the bug where only the first raceId was marked COMPLETED
      const dto = makeDto([10, 10, 20, 30, 30]);
      resultRepo.create.mockImplementation((e) => e);
      resultRepo.save.mockImplementation((e: unknown) =>
        Promise.resolve(
          Array.isArray(e) ? e : { id: Math.random(), ...(e as object) },
        ),
      );
      predictionRepo.findOne.mockResolvedValue(null);

      await service.bulkCreate(dto);

      // Should mark raceId 10, 20, and 30 as COMPLETED
      expect(raceRepo.update).toHaveBeenCalledTimes(3);
      expect(raceRepo.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ status: RaceStatus.COMPLETED }),
      );
      expect(raceRepo.update).toHaveBeenCalledWith(
        20,
        expect.objectContaining({ status: RaceStatus.COMPLETED }),
      );
      expect(raceRepo.update).toHaveBeenCalledWith(
        30,
        expect.objectContaining({ status: RaceStatus.COMPLETED }),
      );
    });

    it('should call updatePredictionAccuracy for each raceId', async () => {
      const prediction = createTestPrediction();
      predictionRepo.findOne.mockResolvedValue(prediction);
      const resultQb = createMockQueryBuilder();
      resultQb.getMany.mockResolvedValue([
        createTestRaceResult({ hrNo: '1', ordType: 'NORMAL', ordInt: 1 }),
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);
      resultRepo.create.mockImplementation((e) => e);
      resultRepo.save.mockImplementation((e: unknown) =>
        Promise.resolve(Array.isArray(e) ? e : { id: 1, ...(e as object) }),
      );

      const dto = makeDto([1]);
      await service.bulkCreate(dto);

      expect(predictionRepo.update).toHaveBeenCalledWith(
        prediction.id,
        expect.objectContaining({ accuracy: expect.any(Number) }),
      );
    });

    it('should call generatePostRaceSummary for each raceId (fire-and-forget)', async () => {
      const dto = makeDto([1, 2]);
      resultRepo.create.mockImplementation((e) => e);
      resultRepo.save.mockImplementation((e: unknown) =>
        Promise.resolve(Array.isArray(e) ? e : { id: 1, ...(e as object) }),
      );
      predictionRepo.findOne.mockResolvedValue(null);

      await service.bulkCreate(dto);

      expect(
        mockPredictionsService.generatePostRaceSummary,
      ).toHaveBeenCalledWith(1);
      expect(
        mockPredictionsService.generatePostRaceSummary,
      ).toHaveBeenCalledWith(2);
    });
  });

  describe('findAll', () => {
    it('should return flat paginated results with race join', async () => {
      const qb = createMockQueryBuilder();
      const mockResult = {
        ...createTestRaceResult(),
        race: createTestRace(),
      };
      qb.getManyAndCount.mockResolvedValue([[mockResult], 1]);
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const result = (await service.findAll({ page: 1, limit: 20 })) as {
        results: unknown[];
        total: number;
        page: number;
      };

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.results).toBeDefined();
    });

    it('should delegate to findAllGroupedByRace when groupByRace=true', async () => {
      const raceQb = createMockQueryBuilder();
      raceQb.getManyAndCount.mockResolvedValue([[], 0]);
      raceRepo.createQueryBuilder.mockReturnValue(raceQb);
      // Mock subQuery chain
      raceQb.subQuery.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('(EXISTS subquery)'),
      });

      const result = await service.findAll({
        page: 1,
        limit: 20,
        groupByRace: true,
      });

      expect(result).toHaveProperty('raceGroups');
    });
  });

  describe('onResultsSyncedForRace', () => {
    it('should call updatePredictionAccuracy and generatePostRaceSummary', async () => {
      predictionRepo.findOne.mockResolvedValue(null);

      await service.onResultsSyncedForRace(1);

      expect(
        mockPredictionsService.generatePostRaceSummary,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create single result', async () => {
      const mockResult = createTestRaceResult();
      resultRepo.create.mockReturnValue(mockResult);
      resultRepo.save.mockResolvedValue(mockResult);
      resultRepo.findOne.mockResolvedValue({
        ...mockResult,
        race: createTestRace(),
      });

      const result = await service.create({
        raceId: 1,
        hrNo: '1',
        hrName: 'Thunder',
      });

      expect(resultRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update result fields', async () => {
      const mockResult = createTestRaceResult();
      resultRepo.findOne.mockResolvedValue(mockResult);
      resultRepo.save.mockResolvedValue({ ...mockResult, ord: '2' });

      await service.update(1, { ord: '2' });

      expect(resultRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing result', async () => {
      resultRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { ord: '1' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
