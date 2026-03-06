import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HorsesService } from './horses.service';
import { RaceResult } from '../database/entities/race-result.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { Race } from '../database/entities/race.entity';
import { createMockRepository } from '../test/mock-factories';

describe('HorsesService', () => {
  let service: HorsesService;
  let resultRepo: ReturnType<typeof createMockRepository>;
  let entryRepo: ReturnType<typeof createMockRepository>;
  let raceRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    resultRepo = createMockRepository();
    entryRepo = createMockRepository();
    raceRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HorsesService,
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
        { provide: getRepositoryToken(RaceEntry), useValue: entryRepo },
        { provide: getRepositoryToken(Race), useValue: raceRepo },
      ],
    }).compile();

    service = module.get<HorsesService>(HorsesService);
  });

  describe('getProfile', () => {
    const hrNo = 'H001';

    it('returns null when no results and no entry', async () => {
      resultRepo._qb.getMany.mockResolvedValue([]);
      entryRepo.findOne.mockResolvedValue(null);

      const result = await service.getProfile(hrNo);
      expect(result).toBeNull();
    });

    it('returns zero-stat profile when entry exists but no results', async () => {
      resultRepo._qb.getMany.mockResolvedValue([]);
      entryRepo.findOne.mockResolvedValue({
        hrName: '천리마',
        sex: '수',
        age: 4,
      });

      const result = await service.getProfile(hrNo);
      expect(result).not.toBeNull();
      expect(result!.hrName).toBe('천리마');
      expect(result!.totalRaces).toBe(0);
      expect(result!.winRate).toBe(0);
      expect(result!.recentForm).toEqual([]);
    });

    it('calculates win/place counts from results', async () => {
      const mockResults = [
        {
          hrName: '천리마',
          sex: '수',
          age: 4,
          ord: '1',
          ordInt: 1,
          ordType: 'NORMAL',
        },
        {
          hrName: '천리마',
          sex: '수',
          age: 4,
          ord: '2',
          ordInt: 2,
          ordType: 'NORMAL',
        },
        {
          hrName: '천리마',
          sex: '수',
          age: 4,
          ord: '4',
          ordInt: 4,
          ordType: 'NORMAL',
        },
        {
          hrName: '천리마',
          sex: '수',
          age: 4,
          ord: '1',
          ordInt: 1,
          ordType: 'NORMAL',
        },
      ];
      resultRepo._qb.getMany.mockResolvedValue(mockResults);

      const result = await service.getProfile(hrNo);
      expect(result).not.toBeNull();
      expect(result!.hrNo).toBe(hrNo);
      expect(result!.totalRaces).toBe(4);
      expect(result!.winCount).toBe(2);
      expect(result!.placeCount).toBe(3); // ordInt 1,2,1
      expect(result!.winRate).toBe(50);
      expect(result!.placeRate).toBe(75);
    });

    it('excludes non-NORMAL results from counts', async () => {
      const mockResults = [
        {
          hrName: '번개',
          sex: '암',
          age: 3,
          ord: null,
          ordInt: null,
          ordType: 'FALL',
        },
        {
          hrName: '번개',
          sex: '암',
          age: 3,
          ord: '1',
          ordInt: 1,
          ordType: 'NORMAL',
        },
      ];
      resultRepo._qb.getMany.mockResolvedValue(mockResults);

      const result = await service.getProfile(hrNo);
      expect(result!.totalRaces).toBe(1);
      expect(result!.winCount).toBe(1);
    });

    it('returns age as string from latest result', async () => {
      resultRepo._qb.getMany.mockResolvedValue([
        {
          hrName: '바람',
          sex: '수',
          age: 5,
          ord: '1',
          ordInt: 1,
          ordType: 'NORMAL',
        },
      ]);

      const result = await service.getProfile(hrNo);
      expect(result!.age).toBe('5');
    });

    it('returns recentForm limited to 10 entries', async () => {
      const mockResults = Array.from({ length: 15 }, (_, i) => ({
        hrName: '천리마',
        sex: '수',
        age: 4,
        ord: String(i + 1),
        ordInt: i + 1,
        ordType: 'NORMAL',
      }));
      resultRepo._qb.getMany.mockResolvedValue(mockResults);

      const result = await service.getProfile(hrNo);
      expect(result!.recentForm).toHaveLength(10);
    });
  });

  describe('getHistory', () => {
    const hrNo = 'H001';

    it('returns empty history when no results', async () => {
      resultRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.getHistory(hrNo);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('maps race history items correctly', async () => {
      const mockRace = {
        rcDate: '20250301',
        meet: '서울',
        meetName: '서울경마공원',
        rcNo: '3',
        rcDist: '1200',
      };
      const mockResult = {
        raceId: 1,
        ord: '1',
        ordInt: 1,
        chulNo: '5',
        jkName: '김철수',
        rcTime: '72.3',
        race: mockRace,
      };
      resultRepo._qb.getManyAndCount.mockResolvedValue([[mockResult], 1]);

      const result = await service.getHistory(hrNo);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].raceId).toBe(1);
      expect(result.items[0].rcDate).toBe('20250301');
      expect(result.items[0].meet).toBe('서울');
      expect(result.items[0].jkName).toBe('김철수');
    });

    it('calculates totalPages correctly', async () => {
      resultRepo._qb.getManyAndCount.mockResolvedValue([[], 45]);

      const result = await service.getHistory(hrNo, 1, 20);
      expect(result.total).toBe(45);
      expect(result.totalPages).toBe(3);
    });

    it('uses default page=1 and limit=20', async () => {
      resultRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      const qb = resultRepo._qb;

      await service.getHistory(hrNo);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
    });

    it('applies pagination offset correctly for page 2', async () => {
      resultRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      const qb = resultRepo._qb;

      await service.getHistory(hrNo, 2, 10);
      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
    });
  });
});
