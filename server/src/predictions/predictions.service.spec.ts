import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { Prediction } from '../database/entities/prediction.entity';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { Training } from '../database/entities/training.entity';
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
  const jockeyResultRepo = createMockRepository();
  const trainingRepo = createMockRepository();

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
        {
          provide: getRepositoryToken(JockeyResult),
          useValue: jockeyResultRepo,
        },
        {
          provide: getRepositoryToken(Training),
          useValue: trainingRepo,
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

  // ── Enrichment method tests ──────────────────────────────────

  describe('enrichEntriesWithRecentRanks (+ rest period)', () => {
    const callEnrich = (race: Record<string, unknown>) =>
      (service as unknown as Record<string, (...args: unknown[]) => unknown>)[
        'enrichEntriesWithRecentRanks'
      ](race);

    it('should return race unchanged when entries is empty', async () => {
      const race = { rcDate: '20260301', entries: [] };
      const result = await callEnrich(race);
      expect(result.entries).toEqual([]);
    });

    it('should populate recentRanks and daysSinceLastRace per horse', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { hrNo: 'H001', ord: '1', ordInt: 1, rcDate: '20260220' },
        { hrNo: 'H001', ord: '3', ordInt: 3, rcDate: '20260210' },
        { hrNo: 'H002', ord: '2', ordInt: 2, rcDate: '20260215' },
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        entries: [
          { hrNo: 'H001', hrName: 'Alpha' },
          { hrNo: 'H002', hrName: 'Beta' },
          { hrNo: 'H003', hrName: 'Gamma' },
        ],
      };
      const result = await callEnrich(race);

      // H001: last race 20260220 → 9 days ago
      const h1 = result.entries.find(
        (e: Record<string, unknown>) => e.hrNo === 'H001',
      );
      expect(h1.recentRanks).toEqual([1, 3]);
      expect(h1.daysSinceLastRace).toBe(9);

      // H002: last race 20260215 → 14 days ago
      const h2 = result.entries.find(
        (e: Record<string, unknown>) => e.hrNo === 'H002',
      );
      expect(h2.recentRanks).toEqual([2]);
      expect(h2.daysSinceLastRace).toBe(14);

      // H003: no past results
      const h3 = result.entries.find(
        (e: Record<string, unknown>) => e.hrNo === 'H003',
      );
      expect(h3.daysSinceLastRace).toBeUndefined();
    });

    it('should not set daysSinceLastRace when it would be negative', async () => {
      const qb = createMockQueryBuilder();
      // Future rcDate in result data (corrupted)
      qb.getRawMany.mockResolvedValue([
        { hrNo: 'H001', ord: '1', ordInt: 1, rcDate: '20260310' },
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      const h1 = result.entries[0];
      expect(h1.daysSinceLastRace).toBeUndefined();
    });

    it('should cap recentRanks to 5 most recent results', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue(
        [1, 2, 3, 4, 5, 6, 7].map((i) => ({
          hrNo: 'H001',
          ord: String(i),
          ordInt: i,
          rcDate: `2026020${i}`,
        })),
      );
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      // Sorted DESC by rcDate, takes at most 5
      expect(result.entries[0].recentRanks).toHaveLength(5);
    });
  });

  describe('enrichEntriesWithDistanceStats', () => {
    const callEnrich = (race: Record<string, unknown>) =>
      (service as unknown as Record<string, (...args: unknown[]) => unknown>)[
        'enrichEntriesWithDistanceStats'
      ](race);

    it('should return race unchanged when rcDist is missing', async () => {
      const race = { entries: [{ hrNo: 'H001' }] };
      const result = await callEnrich(race);
      expect(result.entries[0].distWinRate).toBeUndefined();
    });

    it('should compute win/place rates for matching distance bracket', async () => {
      const qb = createMockQueryBuilder();
      // 1400m race → mile bracket (1301-1600)
      // Return 5 results: 2 at 1400 (mile), 1 at 1000 (sprint, excluded)
      qb.getRawMany.mockResolvedValue([
        { hrNo: 'H001', ordInt: 1, rcDist: '1400' },
        { hrNo: 'H001', ordInt: 4, rcDist: '1400' },
        { hrNo: 'H001', ordInt: 2, rcDist: '1500' },
        { hrNo: 'H001', ordInt: 3, rcDist: '1400' },
        { hrNo: 'H001', ordInt: 1, rcDist: '1000' }, // sprint, different bracket
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        rcDist: '1400',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      const h1 = result.entries[0];

      // 4 mile-bracket results: 1 win (25%), 3 place (ord 1,2,3 all ≤3 → 75%)
      expect(h1.distRaceCount).toBe(4);
      expect(h1.distWinRate).toBe(25);
      expect(h1.distPlaceRate).toBe(75);
    });

    it('should not enrich horses with no matching bracket results', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { hrNo: 'H001', ordInt: 1, rcDist: '1000' },
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        rcDist: '1800', // middle bracket
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      expect(result.entries[0].distWinRate).toBeUndefined();
    });
  });

  describe('enrichEntriesWithClassChange', () => {
    const callEnrich = (race: Record<string, unknown>) =>
      (service as unknown as Record<string, (...args: unknown[]) => unknown>)[
        'enrichEntriesWithClassChange'
      ](race);

    it('should return race unchanged when rank is missing', async () => {
      const race = { rcDate: '20260301', entries: [{ hrNo: 'H001' }] };
      const result = await callEnrich(race);
      expect(result.entries[0].classChange).toBeUndefined();
    });

    it('should detect class drop (down)', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { hrNo: 'H001', rank: '국3', rcDate: '20260220' },
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        rank: '국5', // level 3 (lower class)
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      expect(result.entries[0].classChange).toBe('down');
      expect(result.entries[0].classChangeLevel).toBeLessThan(0);
    });

    it('should detect class rise (up)', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { hrNo: 'H001', rank: '국5', rcDate: '20260220' },
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        rank: '국3', // level 5 (higher class)
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      expect(result.entries[0].classChange).toBe('up');
      expect(result.entries[0].classChangeLevel).toBeGreaterThan(0);
    });

    it('should detect same class', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { hrNo: 'H001', rank: '국4', rcDate: '20260220' },
      ]);
      resultRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        rank: '국4',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      expect(result.entries[0].classChange).toBe('same');
      expect(result.entries[0].classChangeLevel).toBe(0);
    });
  });

  describe('enrichEntriesWithTrainingMetrics', () => {
    const callEnrich = (race: Record<string, unknown>) =>
      (service as unknown as Record<string, (...args: unknown[]) => unknown>)[
        'enrichEntriesWithTrainingMetrics'
      ](race);

    it('should return race unchanged when no training data', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([]);
      trainingRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      expect(result.entries[0].trainingMetrics).toBeUndefined();
    });

    it('should compute training metrics from sessions', async () => {
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([
        {
          horseNo: 'H001',
          trDate: '20260228',
          intensity: '강',
          trContent: null,
        },
        {
          horseNo: 'H001',
          trDate: '20260226',
          intensity: '중',
          trContent: null,
        },
        {
          horseNo: 'H001',
          trDate: '20260224',
          intensity: '상',
          trContent: null,
        },
        {
          horseNo: 'H001',
          trDate: '20260222',
          intensity: '하',
          trContent: null,
        },
      ]);
      trainingRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      const metrics = result.entries[0].trainingMetrics;

      expect(metrics).toBeDefined();
      expect(metrics.sessionCount).toBe(4);
      expect(metrics.highIntensityCount).toBe(2); // '강' and '상' match /강|상|고/
      expect(metrics.daysSinceLastTraining).toBe(1); // 20260228 → 20260301
      expect(metrics.avgSessionsPerWeek).toBe(2); // 4 sessions / 2 weeks
    });
  });

  describe('enrichEntriesWithSameDayFatigue', () => {
    const callEnrich = (race: Record<string, unknown>) =>
      (service as unknown as Record<string, (...args: unknown[]) => unknown>)[
        'enrichEntriesWithSameDayFatigue'
      ](race);

    it('should return race unchanged for race 1 (first race of the day)', async () => {
      const race = {
        rcDate: '20260301',
        meet: '서울',
        rcNo: '1',
        stTime: '11:00',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      expect(result.entries[0].sameDayRacesBefore).toBeUndefined();
    });

    it('should detect same-day fatigue for horse running multiple races', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([
        { e_hrNo: 'H001', r_rcNo: '2', r_stTime: '11:30' },
      ]);
      entryRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        meet: '서울',
        rcNo: '5',
        stTime: '14:00',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      const h1 = result.entries[0];

      expect(h1.sameDayRacesBefore).toBe(1);
      expect(h1.hoursSinceLastSameDayRace).toBeCloseTo(2.5, 1);
    });

    it('should not add fatigue for horse not in earlier races', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawMany.mockResolvedValue([]);
      entryRepo.createQueryBuilder.mockReturnValue(qb);

      const race = {
        rcDate: '20260301',
        meet: '서울',
        rcNo: '3',
        stTime: '12:00',
        entries: [{ hrNo: 'H001', hrName: 'Alpha' }],
      };
      const result = await callEnrich(race);
      expect(result.entries[0].sameDayRacesBefore).toBeUndefined();
    });
  });

  describe('rankToLevel', () => {
    const callRankToLevel = (rank: string) =>
      (service as unknown as Record<string, (...args: unknown[]) => unknown>)[
        'rankToLevel'
      ](rank);

    it('should map Korean class hierarchy correctly', () => {
      expect(callRankToLevel('국제')).toBe(7);
      expect(callRankToLevel('국1')).toBe(7);
      expect(callRankToLevel('국2')).toBe(6);
      expect(callRankToLevel('국3')).toBe(5);
      expect(callRankToLevel('국4')).toBe(4);
      expect(callRankToLevel('국5')).toBe(3);
      expect(callRankToLevel('국6')).toBe(2);
      expect(callRankToLevel('일반')).toBe(1);
      expect(callRankToLevel('비등급')).toBe(1);
    });

    it('should map numeric grades (N급)', () => {
      expect(callRankToLevel('1급')).toBe(7);
      expect(callRankToLevel('2급')).toBe(6);
      expect(callRankToLevel('3급')).toBe(5);
      expect(callRankToLevel('6급')).toBe(2);
    });

    it('should return 0 for unknown ranks', () => {
      expect(callRankToLevel('unknown')).toBe(0);
      expect(callRankToLevel('')).toBe(0);
    });
  });

  describe('generatePrediction', () => {
    beforeEach(() => {
      // Mock GlobalConfig for API key and AI config
      mockConfigService.get.mockImplementation(async (key: string) => {
        if (key === 'gemini_model') return 'gemini-2.0-flash';
        if (key === 'gemini_temperature') return '0.7';
        if (key === 'gemini_max_tokens') return '4096';
        return null;
      });
    });

    it('should throw when GEMINI_API_KEY is not set', async () => {
      // Ensure env is not set
      const original = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        await expect(service.generatePrediction(1)).rejects.toThrow();
      } finally {
        if (original) process.env.GEMINI_API_KEY = original;
      }
    });

    it('should return cached prediction when entriesHash matches (cache hit)', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      const cachedPrediction = createTestPrediction({
        id: 99,
        raceId: 1,
        entriesHash: 'abc123',
        status: PredictionStatus.COMPLETED,
      });

      // loadRaceWithEntries uses raceRepo.findOne + entryRepo.find + resultRepo.createQueryBuilder
      raceRepo.findOne.mockResolvedValue(createTestRace());
      entryRepo.find.mockResolvedValue([createTestRaceEntry()]);
      const resultQb = createMockQueryBuilder();
      resultQb.getMany.mockResolvedValue([]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      // Cache hit — findOne returns a COMPLETED prediction
      predictionRepo.findOne.mockResolvedValueOnce(cachedPrediction); // cache check

      const result = await service.generatePrediction(1);

      expect(result).toEqual(cachedPrediction);
      // Should NOT create a PROCESSING lock row
      expect(predictionRepo.save).not.toHaveBeenCalled();

      delete process.env.GEMINI_API_KEY;
    });

    it('should throw PredictionInProgressException when PROCESSING lock exists', async () => {
      process.env.GEMINI_API_KEY = 'test-key';
      const {
        PredictionInProgressException,
      } = require('./predictions.service');

      // loadRaceWithEntries
      raceRepo.findOne.mockResolvedValue(createTestRace());
      entryRepo.find.mockResolvedValue([createTestRaceEntry()]);
      const resultQb = createMockQueryBuilder();
      resultQb.getMany.mockResolvedValue([]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      predictionRepo.findOne
        .mockResolvedValueOnce(null) // no cache hit
        .mockResolvedValueOnce(
          createTestPrediction({
            // PROCESSING lock found
            id: 50,
            status: PredictionStatus.PROCESSING,
          }),
        );

      await expect(service.generatePrediction(1)).rejects.toThrow(
        PredictionInProgressException,
      );

      delete process.env.GEMINI_API_KEY;
    });

    it('should throw NotFoundException when race does not exist', async () => {
      process.env.GEMINI_API_KEY = 'test-key';

      // loadRaceWithEntries uses raceRepo.findOne (not QB)
      raceRepo.findOne.mockResolvedValue(null);

      await expect(service.generatePrediction(999)).rejects.toThrow(
        'Race not found',
      );

      delete process.env.GEMINI_API_KEY;
    });
  });
});
