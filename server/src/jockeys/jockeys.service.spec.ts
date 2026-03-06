import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JockeysService } from './jockeys.service';
import { RaceResult } from '../database/entities/race-result.entity';
import { createMockRepository } from '../test/mock-factories';

describe('JockeysService', () => {
  let service: JockeysService;
  let resultRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    resultRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JockeysService,
        { provide: getRepositoryToken(RaceResult), useValue: resultRepo },
      ],
    }).compile();

    service = module.get<JockeysService>(JockeysService);
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    const jkNo = 'JK001';

    it('returns null when no results found', async () => {
      resultRepo._qb.getMany.mockResolvedValue([]);

      const result = await service.getProfile(jkNo);
      expect(result).toBeNull();
    });

    it('calculates win/place rates correctly', async () => {
      const mockResults = [
        {
          jkName: '김철수',
          ordInt: 1,
          ordType: 'NORMAL',
          ord: '1',
          race: { meet: '서울' },
        },
        {
          jkName: '김철수',
          ordInt: 2,
          ordType: 'NORMAL',
          ord: '2',
          race: { meet: '서울' },
        },
        {
          jkName: '김철수',
          ordInt: 5,
          ordType: 'NORMAL',
          ord: '5',
          race: { meet: '제주' },
        },
        {
          jkName: '김철수',
          ordInt: 1,
          ordType: 'NORMAL',
          ord: '1',
          race: { meet: '제주' },
        },
      ];
      resultRepo._qb.getMany.mockResolvedValue(mockResults);

      const result = await service.getProfile(jkNo);
      expect(result).not.toBeNull();
      expect(result!.jkNo).toBe(jkNo);
      expect(result!.totalRaces).toBe(4);
      expect(result!.winCount).toBe(2);
      expect(result!.placeCount).toBe(3); // ordInt 1,2,1
      expect(result!.winRate).toBe(50);
    });

    it('uses jkName from first result', async () => {
      resultRepo._qb.getMany.mockResolvedValue([
        {
          jkName: '박기수',
          ordInt: 1,
          ordType: 'NORMAL',
          ord: '1',
          race: { meet: '서울' },
        },
      ]);

      const result = await service.getProfile(jkNo);
      expect(result!.jkName).toBe('박기수');
    });

    it('builds byMeet breakdown correctly', async () => {
      const mockResults = [
        {
          jkName: '김철수',
          ordInt: 1,
          ordType: 'NORMAL',
          ord: '1',
          race: { meet: '서울' },
        },
        {
          jkName: '김철수',
          ordInt: 2,
          ordType: 'NORMAL',
          ord: '2',
          race: { meet: '서울' },
        },
        {
          jkName: '김철수',
          ordInt: 1,
          ordType: 'NORMAL',
          ord: '1',
          race: { meet: '제주' },
        },
      ];
      resultRepo._qb.getMany.mockResolvedValue(mockResults);

      const result = await service.getProfile(jkNo);
      expect(result!.byMeet).toHaveLength(2);
      const seoulEntry = result!.byMeet.find((m) => m.meet === '서울');
      expect(seoulEntry).toBeDefined();
      expect(seoulEntry!.count).toBe(2);
      expect(seoulEntry!.winRate).toBe(50);
    });

    it('excludes FALL/DQ from normal results', async () => {
      resultRepo._qb.getMany.mockResolvedValue([
        {
          jkName: '김철수',
          ordInt: null,
          ordType: 'FALL',
          ord: null,
          race: { meet: '서울' },
        },
        {
          jkName: '김철수',
          ordInt: 1,
          ordType: 'NORMAL',
          ord: '1',
          race: { meet: '서울' },
        },
      ]);

      const result = await service.getProfile(jkNo);
      expect(result!.totalRaces).toBe(1);
    });

    it('limits recentForm to 10 entries in ascending order', async () => {
      const mockResults = Array.from({ length: 15 }, (_, i) => ({
        jkName: '김철수',
        ordInt: i + 1,
        ordType: 'NORMAL',
        ord: String(i + 1),
        race: { meet: '서울' },
      }));
      resultRepo._qb.getMany.mockResolvedValue(mockResults);

      const result = await service.getProfile(jkNo);
      expect(result!.recentForm).toHaveLength(10);
    });
  });

  describe('getHistory', () => {
    const jkNo = 'JK001';

    it('returns empty history when no results', async () => {
      resultRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.getHistory(jkNo);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('maps history items correctly', async () => {
      const mockResult = {
        raceId: 1,
        ord: '1',
        ordInt: 1,
        hrName: '천리마',
        rcTime: '72.3',
        race: {
          rcDate: '20250301',
          meet: '서울',
          meetName: '서울경마공원',
          rcNo: '2',
          rcDist: '1400',
        },
      };
      resultRepo._qb.getManyAndCount.mockResolvedValue([[mockResult], 1]);

      const result = await service.getHistory(jkNo);
      expect(result.items[0].hrName).toBe('천리마');
      expect(result.items[0].rcDate).toBe('20250301');
      expect(result.items[0].ordInt).toBe(1);
    });

    it('applies pagination correctly', async () => {
      resultRepo._qb.getManyAndCount.mockResolvedValue([[], 30]);

      const result = await service.getHistory(jkNo, 2, 10);
      expect(result.totalPages).toBe(3);
      expect(resultRepo._qb.skip).toHaveBeenCalledWith(10);
      expect(resultRepo._qb.take).toHaveBeenCalledWith(10);
    });
  });
});
