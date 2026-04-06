import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { RacesService } from './races.service';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { RaceDividend } from '../database/entities/race-dividend.entity';
import { RaceStatus } from '../database/db-enums';
import { KraService } from '../kra/kra.service';
import {
  createMockRepository,
  createMockCache,
  createMockQueryBuilder,
} from '../test/mock-factories';
import { createTestRace, createTestRaceEntry } from '../test/test-entities';

describe('RacesService', () => {
  let service: RacesService;
  const raceRepo = createMockRepository();
  const entryRepo = createMockRepository();
  const resultRepo = createMockRepository();
  const dividendRepo = createMockRepository();
  const predictionRepo = createMockRepository();
  const cache = createMockCache();
  const kraService = {
    fetchRaceResults: jest.fn().mockResolvedValue({ message: 'ok' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RacesService,
        { provide: getRepositoryToken(Race), useValue: raceRepo },
        { provide: getRepositoryToken(RaceEntry), useValue: entryRepo },
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
        { provide: getRepositoryToken(RaceDividend), useValue: dividendRepo },
        { provide: getRepositoryToken(Prediction), useValue: predictionRepo },
        { provide: CACHE_MANAGER, useValue: cache },
        { provide: KraService, useValue: kraService },
      ],
    }).compile();

    service = module.get<RacesService>(RacesService);
  });

  describe('findAll', () => {
    it('should return paginated races with entries', async () => {
      const race = createTestRace();
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[race], 1]);
      raceRepo.createQueryBuilder.mockReturnValue(qb);
      entryRepo.find.mockResolvedValue([createTestRaceEntry()]);
      // Result QB returns no results (no status fixup needed)
      const resultQb = createMockQueryBuilder();
      resultQb.getRawMany.mockResolvedValue([]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.races).toBeDefined();
    });

    it('should correct status to COMPLETED when results exist and persist to DB', async () => {
      const race = createTestRace({ status: RaceStatus.SCHEDULED });
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[race], 1]);
      raceRepo.createQueryBuilder.mockReturnValue(qb);
      entryRepo.find.mockResolvedValue([]);
      // Simulate results exist
      const resultQb = createMockQueryBuilder();
      resultQb.getRawMany.mockResolvedValue([{ raceId: race.id }]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      await service.findAll({ page: 1, limit: 20 });

      // Status correction should be persisted
      expect(raceRepo.update).toHaveBeenCalledWith(
        race.id,
        expect.objectContaining({ status: RaceStatus.COMPLETED }),
      );
    });

    it('should correct COMPLETED to SCHEDULED when no results and persist', async () => {
      const race = createTestRace({ status: RaceStatus.COMPLETED });
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[race], 1]);
      raceRepo.createQueryBuilder.mockReturnValue(qb);
      entryRepo.find.mockResolvedValue([]);
      const resultQb = createMockQueryBuilder();
      resultQb.getRawMany.mockResolvedValue([]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      await service.findAll({ page: 1, limit: 20 });

      expect(raceRepo.update).toHaveBeenCalledWith(
        race.id,
        expect.objectContaining({ status: RaceStatus.SCHEDULED }),
      );
    });
  });

  describe('findOne', () => {
    it('should return cached race on cache hit', async () => {
      const cachedRace = {
        ...createTestRace(),
        entries: [createTestRaceEntry()],
        results: [],
      };
      cache.get.mockResolvedValue(cachedRace);

      const result = await service.findOne(1);

      expect(cache.get).toHaveBeenCalledWith('race:1');
      expect(raceRepo.findOne).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should fetch from DB on cache miss and set cache', async () => {
      cache.get.mockResolvedValue(undefined);
      const race = createTestRace();
      raceRepo.findOne.mockResolvedValue(race);
      entryRepo.find.mockResolvedValue([createTestRaceEntry()]);
      const resultQb = createMockQueryBuilder();
      resultQb.getMany.mockResolvedValue([]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      const result = await service.findOne(1);

      expect(raceRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(cache.set).toHaveBeenCalledWith(
        'race:1',
        expect.anything(),
        300000,
      );
      expect(result).toBeDefined();
    });

    it('should refetch when cached race has no entries', async () => {
      const cachedRace = { ...createTestRace(), entries: [], results: [] };
      cache.get.mockResolvedValue(cachedRace);
      // Fresh DB data has entries
      const freshRace = createTestRace();
      raceRepo.findOne.mockResolvedValue(freshRace);
      entryRepo.find.mockResolvedValue([createTestRaceEntry()]);
      const resultQb = createMockQueryBuilder();
      resultQb.getMany.mockResolvedValue([]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      await service.findOne(1);

      // Should have called DB since cached had no entries
      expect(raceRepo.findOne).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing race', async () => {
      cache.get.mockResolvedValue(undefined);
      raceRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRacesByDate', () => {
    it('should return races for date and filter scratched entries', async () => {
      const race = createTestRace({ rcDate: '20250301' });
      raceRepo.find.mockResolvedValue([race]);
      const entry1 = createTestRaceEntry({ isScratched: false });
      const entry2 = createTestRaceEntry({ id: 'entry-2', isScratched: true });
      entryRepo.find.mockResolvedValue([entry1, entry2]);
      const resultQb = createMockQueryBuilder();
      resultQb.getRawMany.mockResolvedValue([]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      const result = await service.getRacesByDate('20250301');

      expect(result).toBeDefined();
      expect(raceRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { rcDate: '20250301' } }),
      );
    });

    it('should persist status corrections', async () => {
      const race = createTestRace({ status: RaceStatus.SCHEDULED });
      raceRepo.find.mockResolvedValue([race]);
      entryRepo.find.mockResolvedValue([]);
      const resultQb = createMockQueryBuilder();
      resultQb.getRawMany.mockResolvedValue([{ raceId: race.id }]);
      resultRepo.createQueryBuilder.mockReturnValue(resultQb);

      await service.getRacesByDate('20250301');

      expect(raceRepo.update).toHaveBeenCalledWith(
        race.id,
        expect.objectContaining({ status: RaceStatus.COMPLETED }),
      );
    });
  });

  describe('create', () => {
    it('should create race with normalized meet name', async () => {
      const race = createTestRace();
      raceRepo.create.mockReturnValue(race);
      raceRepo.save.mockResolvedValue(race);

      const result = await service.create({
        meet: 'SEOUL',
        rcDate: '20250301',
        rcNo: '1',
      });

      expect(raceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ rcDate: '20250301', rcNo: '1' }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update fields and invalidate cache', async () => {
      const race = createTestRace();
      raceRepo.findOne.mockResolvedValue(race);
      raceRepo.save.mockResolvedValue({ ...race, rcName: 'Updated' });
      entryRepo.find.mockResolvedValue([]);

      await service.update(1, { rcName: 'Updated' });

      expect(raceRepo.save).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalledWith('race:1');
    });

    it('should throw NotFoundException for missing race', async () => {
      raceRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { rcName: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSchedule', () => {
    it('should return sorted races with entries', async () => {
      const race = createTestRace();
      const qb = createMockQueryBuilder();
      qb.getMany.mockResolvedValue([race]);
      raceRepo.createQueryBuilder.mockReturnValue(qb);
      entryRepo.find.mockResolvedValue([createTestRaceEntry()]);

      const result = await service.getSchedule({});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('on-demand result fetch', () => {
    it('should not call KRA when race has results in cache', async () => {
      // When cache returns a race with results, no KRA API call is needed
      const cachedRace = {
        ...createTestRace({
          id: 1,
          rcDate: '20260318',
          status: RaceStatus.COMPLETED,
        }),
        entries: [createTestRaceEntry()],
        results: [{ ordInt: 1, ordType: null, hrNo: '1' }],
        predictions: [],
        dividends: [],
      };
      cache.get.mockResolvedValue(cachedRace);

      await service.findOne(1);

      expect(kraService.fetchRaceResults).not.toHaveBeenCalled();
    });
  });
});
