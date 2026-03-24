import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';

const mockRaceRepo = { findOne: jest.fn() };
const mockEntryRepo = { find: jest.fn() };
const mockResultRepo = {
  createQueryBuilder: jest.fn(),
};
const mockJockeyResultRepo = { find: jest.fn() };
const mockTrainerResultRepo = { find: jest.fn() };

// QueryBuilder chain mock
function buildQbMock(results: unknown[]) {
  const qb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(results),
  };
  return qb;
}

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        { provide: getRepositoryToken(Race), useValue: mockRaceRepo },
        { provide: getRepositoryToken(RaceEntry), useValue: mockEntryRepo },
        { provide: getRepositoryToken(RaceResult), useValue: mockResultRepo },
        {
          provide: getRepositoryToken(JockeyResult),
          useValue: mockJockeyResultRepo,
        },
        {
          provide: getRepositoryToken(TrainerResult),
          useValue: mockTrainerResultRepo,
        },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeJockey', () => {
    it('throws NotFoundException when race does not exist', async () => {
      mockRaceRepo.findOne.mockResolvedValue(null);

      await expect(service.analyzeJockey(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns analysis result with entries and weightRatio', async () => {
      mockRaceRepo.findOne.mockResolvedValue({
        id: 1,
        meet: '서울',
        meetName: '서울',
        rcDate: '20250301',
        rcNo: '1',
        rcDist: '1200',
        weather: '맑음',
        track: '良',
      });

      mockEntryRepo.find.mockResolvedValue([
        {
          hrNo: '1',
          hrName: '천리마',
          jkNo: 'J001',
          jkName: '김철수',
          rating: 85,
        },
        {
          hrNo: '2',
          hrName: '번개',
          jkNo: 'J002',
          jkName: '이기수',
          rating: 78,
        },
      ]);

      const qb = buildQbMock([]);
      mockResultRepo.createQueryBuilder.mockReturnValue(qb);
      mockJockeyResultRepo.find.mockResolvedValue([]);
      mockTrainerResultRepo.find.mockResolvedValue([]);

      // Mock the private runPythonScript method
      const expectedResult = {
        entriesWithScores: [
          {
            hrNo: '1',
            hrName: '천리마',
            jkNo: 'J001',
            jkName: '김철수',
            horseScore: 85,
            jockeyScore: 72,
            combinedScore: 81.1,
          },
        ],
        weightRatio: { horse: 0.7, jockey: 0.3 },
        topPickByJockey: {
          hrNo: '1',
          hrName: '천리마',
          jkNo: 'J001',
          jkName: '김철수',
          jockeyScore: 72,
        },
      };
      jest
        .spyOn(
          service as unknown as {
            runPythonScript: (i: unknown) => Promise<unknown>;
          },
          'runPythonScript',
        )
        .mockResolvedValue(expectedResult);

      const result = await service.analyzeJockey(1);

      expect(result.entriesWithScores).toHaveLength(1);
      expect(result.weightRatio).toEqual({ horse: 0.7, jockey: 0.3 });
      expect(result.topPickByJockey?.hrNo).toBe('1');
    });

    it('throws when Python script returns error field', async () => {
      mockRaceRepo.findOne.mockResolvedValue({
        id: 1,
        meet: '서울',
        meetName: '서울',
        rcDate: '20250301',
        rcNo: '1',
      });
      mockEntryRepo.find.mockResolvedValue([]);
      mockResultRepo.createQueryBuilder.mockReturnValue(buildQbMock([]));
      mockJockeyResultRepo.find.mockResolvedValue([]);
      mockTrainerResultRepo.find.mockResolvedValue([]);

      jest
        .spyOn(
          service as unknown as {
            runPythonScript: (i: unknown) => Promise<unknown>;
          },
          'runPythonScript',
        )
        .mockResolvedValue({ error: 'insufficient data' });

      await expect(service.analyzeJockey(1)).rejects.toThrow('Analysis error');
    });

    it('returns empty entriesWithScores and default weightRatio when Python returns empty result', async () => {
      mockRaceRepo.findOne.mockResolvedValue({
        id: 1,
        meet: '서울',
        meetName: '서울',
        rcDate: '20250301',
        rcNo: '1',
      });
      mockEntryRepo.find.mockResolvedValue([]);
      mockResultRepo.createQueryBuilder.mockReturnValue(buildQbMock([]));
      mockJockeyResultRepo.find.mockResolvedValue([]);
      mockTrainerResultRepo.find.mockResolvedValue([]);

      jest
        .spyOn(
          service as unknown as {
            runPythonScript: (i: unknown) => Promise<unknown>;
          },
          'runPythonScript',
        )
        .mockResolvedValue({});

      const result = await service.analyzeJockey(1);

      expect(result.entriesWithScores).toEqual([]);
      expect(result.weightRatio).toEqual({ horse: 0.7, jockey: 0.3 });
      expect(result.topPickByJockey).toBeNull();
    });

    it('maps meet name to KRA meet code correctly', async () => {
      mockRaceRepo.findOne.mockResolvedValue({
        id: 2,
        meet: '부산경남',
        meetName: '부산경남',
        rcDate: '20250301',
        rcNo: '1',
      });
      mockEntryRepo.find.mockResolvedValue([
        {
          hrNo: '1',
          hrName: '바람',
          jkNo: 'J003',
          jkName: '박선수',
          rating: 70,
        },
      ]);
      mockResultRepo.createQueryBuilder.mockReturnValue(buildQbMock([]));
      mockJockeyResultRepo.find.mockResolvedValue([]);
      mockTrainerResultRepo.find.mockResolvedValue([]);

      const spy = jest
        .spyOn(
          service as unknown as {
            runPythonScript: (i: unknown) => Promise<unknown>;
          },
          'runPythonScript',
        )
        .mockResolvedValue({
          entriesWithScores: [],
          weightRatio: { horse: 0.7, jockey: 0.3 },
        });

      await service.analyzeJockey(2);

      // jockeyResultRepo.find is called with meet='3' (부산경남 code)
      expect(mockJockeyResultRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ meet: '3' }),
        }),
      );
      spy.mockRestore();
    });
  });
});
