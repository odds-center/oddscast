import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrainersService } from './trainers.service';
import { RaceResult } from '../database/entities/race-result.entity';
import { createMockRepository } from '../test/mock-factories';

describe('TrainersService', () => {
  let service: TrainersService;
  let resultRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    resultRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainersService,
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
      ],
    }).compile();

    service = module.get<TrainersService>(TrainersService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    const trName = '박감독';

    it('returns null when no results found', async () => {
      resultRepo._qb.getMany.mockResolvedValue([]);

      const result = await service.getProfile(trName);
      expect(result).toBeNull();
    });

    it('returns profile with correct stats', async () => {
      const mockResults = [
        {
          trName: '박감독',
          ordInt: 1,
          ordType: 'NORMAL',
          ord: '1',
          race: { meet: '서울' },
        },
        {
          trName: '박감독',
          ordInt: 3,
          ordType: 'NORMAL',
          ord: '3',
          race: { meet: '서울' },
        },
        {
          trName: '박감독',
          ordInt: 5,
          ordType: 'NORMAL',
          ord: '5',
          race: { meet: '부산경남' },
        },
        {
          trName: '박감독',
          ordInt: 1,
          ordType: 'NORMAL',
          ord: '1',
          race: { meet: '부산경남' },
        },
      ];
      resultRepo._qb.getMany.mockResolvedValue(mockResults);

      const result = await service.getProfile(trName);
      expect(result).not.toBeNull();
      expect(result!.trName).toBe(trName);
      expect(result!.totalRaces).toBe(4);
      expect(result!.winCount).toBe(2);
      expect(result!.placeCount).toBe(3); // ordInt 1,3,1
      expect(result!.winRate).toBe(50);
      expect(result!.placeRate).toBe(75);
    });

    it('builds byMeet stats correctly', async () => {
      resultRepo._qb.getMany.mockResolvedValue([
        { ordInt: 1, ordType: 'NORMAL', ord: '1', race: { meet: '서울' } },
        { ordInt: 2, ordType: 'NORMAL', ord: '2', race: { meet: '서울' } },
        { ordInt: 1, ordType: 'NORMAL', ord: '1', race: { meet: '제주' } },
      ]);

      const result = await service.getProfile(trName);
      expect(result!.byMeet).toHaveLength(2);
      const seoulMeet = result!.byMeet.find((m) => m.meet === '서울');
      expect(seoulMeet!.count).toBe(2);
      expect(seoulMeet!.winRate).toBe(50);
    });

    it('excludes FALL results from normal stats', async () => {
      resultRepo._qb.getMany.mockResolvedValue([
        { ordInt: null, ordType: 'FALL', ord: null, race: { meet: '서울' } },
        { ordInt: 1, ordType: 'NORMAL', ord: '1', race: { meet: '서울' } },
      ]);

      const result = await service.getProfile(trName);
      expect(result!.totalRaces).toBe(1);
    });

    it('returns zero rates when totalRaces is 0 (all non-normal)', async () => {
      resultRepo._qb.getMany.mockResolvedValue([
        { ordInt: 99, ordType: 'DQ', ord: '99', race: { meet: '서울' } },
      ]);

      const result = await service.getProfile(trName);
      // Has results but all are non-normal, so totalRaces = 0, winRate = 0
      expect(result).not.toBeNull(); // Not null because results array is not empty
      expect(result!.winRate).toBe(0);
      expect(result!.placeRate).toBe(0);
    });
  });

  describe('getHistory', () => {
    const trName = '박감독';

    it('returns empty when no history', async () => {
      resultRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.getHistory(trName);
      expect(result.items).toHaveLength(0);
      expect(result.totalPages).toBe(0);
    });

    it('maps history items with race fields', async () => {
      const mockResult = {
        raceId: 5,
        ord: '2',
        ordInt: 2,
        hrName: '번개',
        rcTime: '71.8',
        race: {
          rcDate: '20250301',
          meet: '제주',
          meetName: null,
          rcNo: '1',
          rcDist: '1000',
        },
      };
      resultRepo._qb.getManyAndCount.mockResolvedValue([[mockResult], 1]);

      const result = await service.getHistory(trName);
      expect(result.items[0].raceId).toBe(5);
      expect(result.items[0].hrName).toBe('번개');
      expect(result.items[0].meet).toBe('제주');
    });

    it('calculates totalPages correctly', async () => {
      resultRepo._qb.getManyAndCount.mockResolvedValue([[], 25]);

      const result = await service.getHistory(trName, 1, 10);
      expect(result.totalPages).toBe(3);
    });
  });
});
