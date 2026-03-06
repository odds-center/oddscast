import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { KraService } from './kra.service';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Training } from '../database/entities/training.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import {
  BatchSchedule,
  BATCH_JOB_KRA_RESULT_FETCH,
} from '../database/entities/batch-schedule.entity';
import { BatchScheduleStatus, RaceStatus } from '../database/db-enums';
import { ResultsService } from '../results/results.service';
import { PredictionsService } from '../predictions/predictions.service';
import { GlobalConfigService } from '../config/config.service';
import {
  createMockRepository,
  createMockQueryBuilder,
  createMockConfigService,
  createMockCache,
} from '../test/mock-factories';

describe('KraService', () => {
  let service: KraService;

  const raceRepo = createMockRepository();
  const entryRepo = createMockRepository();
  const resultRepo = createMockRepository();
  const trainingRepo = createMockRepository();
  const jockeyResultRepo = createMockRepository();
  const trainerResultRepo = createMockRepository();
  const kraSyncLogRepo = createMockRepository();
  const batchScheduleRepo = createMockRepository();
  const cache = createMockCache();

  const mockConfigService = createMockConfigService({
    KRA_SERVICE_KEY: 'test-key',
  });
  const mockGlobalConfigService = { get: jest.fn().mockResolvedValue(null) };
  const mockHttpService = { get: jest.fn(), axiosRef: {} };
  const mockResultsService = {
    bulkCreate: jest.fn().mockResolvedValue({}),
  };
  const mockPredictionsService = {
    generatePrediction: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KraService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: GlobalConfigService, useValue: mockGlobalConfigService },
        { provide: getRepositoryToken(Race), useValue: raceRepo },
        { provide: getRepositoryToken(RaceEntry), useValue: entryRepo },
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
        { provide: getRepositoryToken(Training), useValue: trainingRepo },
        {
          provide: getRepositoryToken(JockeyResult),
          useValue: jockeyResultRepo,
        },
        {
          provide: getRepositoryToken(TrainerResult),
          useValue: trainerResultRepo,
        },
        { provide: getRepositoryToken(KraSyncLog), useValue: kraSyncLogRepo },
        {
          provide: getRepositoryToken(BatchSchedule),
          useValue: batchScheduleRepo,
        },
        { provide: ResultsService, useValue: mockResultsService },
        { provide: PredictionsService, useValue: mockPredictionsService },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<KraService>(KraService);
  });

  describe('ensureResultFetchJobsForEndedRaces (via processDueBatchSchedulesCron)', () => {
    it('should create a PENDING job when ended race date has no existing job', async () => {
      // Simulate race that ended (stTime in the past)
      const pastStTime = '08:00';
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' })
        .format(new Date())
        .replace(/-/g, '');
      raceRepo.find.mockResolvedValue([
        {
          id: 1,
          rcDate: today,
          stTime: pastStTime,
          status: RaceStatus.SCHEDULED,
        },
      ]);
      // No existing batch job
      batchScheduleRepo.findOne.mockResolvedValue(null);
      // processDueBatchSchedules: no due jobs
      const batchQb = createMockQueryBuilder();
      batchQb.getMany.mockResolvedValue([]);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(batchQb);

      await service.processDueBatchSchedulesCron();

      // Should have checked for existing job
      expect(batchScheduleRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({
              jobType: BATCH_JOB_KRA_RESULT_FETCH,
              targetRcDate: today,
              status: BatchScheduleStatus.PENDING,
            }),
          ]),
        }),
      );
      // Should have saved a new job
      expect(batchScheduleRepo.save).toHaveBeenCalled();
      expect(batchScheduleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobType: BATCH_JOB_KRA_RESULT_FETCH,
          targetRcDate: today,
          status: BatchScheduleStatus.PENDING,
        }),
      );
    });

    it('should skip creation when a PENDING job already exists for the date', async () => {
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' })
        .format(new Date())
        .replace(/-/g, '');
      raceRepo.find.mockResolvedValue([
        { id: 1, rcDate: today, stTime: '08:00', status: RaceStatus.SCHEDULED },
      ]);
      // Existing PENDING job
      batchScheduleRepo.findOne.mockResolvedValue({
        id: 10,
        jobType: BATCH_JOB_KRA_RESULT_FETCH,
        targetRcDate: today,
        status: BatchScheduleStatus.PENDING,
      });
      const batchQb = createMockQueryBuilder();
      batchQb.getMany.mockResolvedValue([]);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(batchQb);

      await service.processDueBatchSchedulesCron();

      // Should NOT create a new job
      expect(batchScheduleRepo.create).not.toHaveBeenCalled();
      expect(batchScheduleRepo.save).not.toHaveBeenCalled();
    });

    it('should skip COMPLETED races when checking ended dates', async () => {
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' })
        .format(new Date())
        .replace(/-/g, '');
      // Race is already COMPLETED — should be excluded from "should have ended"
      raceRepo.find.mockResolvedValue([
        { id: 1, rcDate: today, stTime: '08:00', status: RaceStatus.COMPLETED },
      ]);
      const batchQb = createMockQueryBuilder();
      batchQb.getMany.mockResolvedValue([]);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(batchQb);

      await service.processDueBatchSchedulesCron();

      // No dates returned → findOne not called → no job created
      expect(batchScheduleRepo.findOne).not.toHaveBeenCalled();
      expect(batchScheduleRepo.create).not.toHaveBeenCalled();
    });

    it('should do nothing when no races have ended yet', async () => {
      raceRepo.find.mockResolvedValue([]);
      const batchQb = createMockQueryBuilder();
      batchQb.getMany.mockResolvedValue([]);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(batchQb);

      await service.processDueBatchSchedulesCron();

      expect(batchScheduleRepo.findOne).not.toHaveBeenCalled();
      expect(batchScheduleRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('processDueBatchSchedulesCron', () => {
    it('should return early when KRA_SERVICE_KEY is not configured', async () => {
      // Override config to return empty key
      mockConfigService.get.mockReturnValue('');

      // Recreate service with empty key
      const moduleNoKey: TestingModule = await Test.createTestingModule({
        providers: [
          KraService,
          { provide: HttpService, useValue: mockHttpService },
          {
            provide: ConfigService,
            useValue: createMockConfigService({ KRA_SERVICE_KEY: '' }),
          },
          { provide: GlobalConfigService, useValue: mockGlobalConfigService },
          { provide: getRepositoryToken(Race), useValue: raceRepo },
          { provide: getRepositoryToken(RaceEntry), useValue: entryRepo },
          { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
          { provide: getRepositoryToken(Training), useValue: trainingRepo },
          {
            provide: getRepositoryToken(JockeyResult),
            useValue: jockeyResultRepo,
          },
          {
            provide: getRepositoryToken(TrainerResult),
            useValue: trainerResultRepo,
          },
          { provide: getRepositoryToken(KraSyncLog), useValue: kraSyncLogRepo },
          {
            provide: getRepositoryToken(BatchSchedule),
            useValue: batchScheduleRepo,
          },
          { provide: ResultsService, useValue: mockResultsService },
          { provide: PredictionsService, useValue: mockPredictionsService },
          { provide: CACHE_MANAGER, useValue: cache },
        ],
      }).compile();
      const serviceNoKey = moduleNoKey.get<KraService>(KraService);

      await serviceNoKey.processDueBatchSchedulesCron();

      // Should not touch repos when key is missing
      expect(raceRepo.find).not.toHaveBeenCalled();
      expect(batchScheduleRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('processDueBatchSchedules', () => {
    it('should mark due job as COMPLETED on success', async () => {
      const job = {
        id: 1,
        jobType: BATCH_JOB_KRA_RESULT_FETCH,
        targetRcDate: '20250301',
        status: BatchScheduleStatus.PENDING,
        scheduledAt: new Date(Date.now() - 1000),
      };
      // Spy on private methods before setting up the mock
      jest
        .spyOn(
          service as unknown as Record<string, jest.Mock>,
          'fetchRaceResults',
        )
        .mockResolvedValue(undefined);
      jest
        .spyOn(
          service as unknown as Record<string, jest.Mock>,
          'syncAnalysisData',
        )
        .mockResolvedValue(undefined);

      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([job]);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(qb);

      // Call processDueBatchSchedules directly (it's public)
      await service.processDueBatchSchedules();

      expect(batchScheduleRepo.update).toHaveBeenCalledWith(
        job.id,
        expect.objectContaining({ status: BatchScheduleStatus.RUNNING }),
      );
      expect(batchScheduleRepo.update).toHaveBeenCalledWith(
        job.id,
        expect.objectContaining({ status: BatchScheduleStatus.COMPLETED }),
      );
    });

    it('should mark due job as FAILED when fetchRaceResults throws', async () => {
      const job = {
        id: 2,
        jobType: BATCH_JOB_KRA_RESULT_FETCH,
        targetRcDate: '20250301',
        status: BatchScheduleStatus.PENDING,
        scheduledAt: new Date(Date.now() - 1000),
      };
      jest
        .spyOn(
          service as unknown as Record<string, jest.Mock>,
          'fetchRaceResults',
        )
        .mockRejectedValue(new Error('KRA API timeout'));

      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([job]);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(qb);

      await service.processDueBatchSchedules();

      expect(batchScheduleRepo.update).toHaveBeenCalledWith(
        job.id,
        expect.objectContaining({ status: BatchScheduleStatus.RUNNING }),
      );
      expect(batchScheduleRepo.update).toHaveBeenCalledWith(
        job.id,
        expect.objectContaining({
          status: BatchScheduleStatus.FAILED,
          errorMessage: expect.stringContaining('KRA API timeout'),
        }),
      );
    });

    it('should skip jobs with non-KRA_RESULT_FETCH jobType', async () => {
      const job = {
        id: 3,
        jobType: 'UNKNOWN_JOB',
        targetRcDate: '20250301',
        status: BatchScheduleStatus.PENDING,
        scheduledAt: new Date(Date.now() - 1000),
      };
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([job]);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(qb);

      await service.processDueBatchSchedules();

      // Unknown jobType → skipped, no update calls
      expect(batchScheduleRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('getBatchSchedules', () => {
    it('should return items with byStatus summary', async () => {
      const items = [
        { id: 1, status: BatchScheduleStatus.COMPLETED },
        { id: 2, status: BatchScheduleStatus.COMPLETED },
        { id: 3, status: BatchScheduleStatus.FAILED },
      ];
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue(items);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getBatchSchedules();

      expect(result.items).toHaveLength(3);
      expect(result.byStatus[BatchScheduleStatus.COMPLETED]).toBe(2);
      expect(result.byStatus[BatchScheduleStatus.FAILED]).toBe(1);
    });

    it('should apply status filter when provided', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      batchScheduleRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getBatchSchedules({ status: BatchScheduleStatus.PENDING });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.objectContaining({ status: BatchScheduleStatus.PENDING }),
      );
    });
  });
});
