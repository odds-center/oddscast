import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WeeklyPreviewService } from './weekly-preview.service';
import { WeeklyPreview } from '../database/entities/weekly-preview.entity';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { createMockRepository } from '../test/mock-factories';

describe('WeeklyPreviewService', () => {
  let service: WeeklyPreviewService;
  let previewRepo: ReturnType<typeof createMockRepository>;
  let raceRepo: ReturnType<typeof createMockRepository>;
  let entryRepo: ReturnType<typeof createMockRepository>;

  const mockPreview = {
    weekLabel: '2025-02-27',
    content: {
      highlights: '서울 경마장에서 특별경주',
      horsesToWatch: ['천리마', '번개'],
      trackConditions: '良馬場',
      raceDates: ['20250228', '20250301', '20250302'],
    },
  };

  beforeEach(async () => {
    previewRepo = createMockRepository();
    raceRepo = createMockRepository();
    entryRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyPreviewService,
        { provide: getRepositoryToken(WeeklyPreview), useValue: previewRepo },
        { provide: getRepositoryToken(Race), useValue: raceRepo },
        { provide: getRepositoryToken(RaceEntry), useValue: entryRepo },
      ],
    }).compile();

    service = module.get<WeeklyPreviewService>(WeeklyPreviewService);
    jest.clearAllMocks();
  });

  describe('getLatest', () => {
    it('returns null when no preview exists', async () => {
      previewRepo.find.mockResolvedValue([]);

      const result = await service.getLatest();
      expect(result).toBeNull();
    });

    it('returns latest preview with weekLabel and content', async () => {
      previewRepo.find.mockResolvedValue([mockPreview]);

      const result = await service.getLatest();
      expect(result).not.toBeNull();
      expect(result!.weekLabel).toBe('2025-02-27');
      expect(result!.content.highlights).toBe('서울 경마장에서 특별경주');
      expect(result!.content.horsesToWatch).toEqual(['천리마', '번개']);
    });

    it('returns empty content object when content is null', async () => {
      previewRepo.find.mockResolvedValue([
        { weekLabel: '2025-02-27', content: null },
      ]);

      const result = await service.getLatest();
      expect(result!.content).toEqual({});
    });
  });

  describe('getByWeek', () => {
    it('returns preview for specific week', async () => {
      previewRepo.findOne.mockResolvedValue(mockPreview);

      const result = await service.getByWeek('2025-02-27');
      expect(result).not.toBeNull();
      expect(result!.weekLabel).toBe('2025-02-27');
    });

    it('returns null when week not found', async () => {
      previewRepo.findOne.mockResolvedValue(null);

      const result = await service.getByWeek('2025-01-01');
      expect(result).toBeNull();
    });
  });

  describe('generate', () => {
    it('generates placeholder when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;
      raceRepo.find.mockResolvedValue([]);
      previewRepo.findOne.mockResolvedValue(null);
      previewRepo.create.mockImplementation((d: unknown) => d);
      previewRepo.save.mockResolvedValue(undefined);

      const result = await service.generate();
      expect(result.weekLabel).toBeDefined();
      expect(result.content.horsesToWatch).toEqual([]);
      expect(result.content.highlights).toContain('AI 요약');
      expect(previewRepo.save).toHaveBeenCalled();
    });

    it('uses fromDate option when provided', async () => {
      delete process.env.GEMINI_API_KEY;
      raceRepo.find.mockResolvedValue([]);
      previewRepo.findOne.mockResolvedValue(null);
      previewRepo.create.mockImplementation((d: unknown) => d);
      previewRepo.save.mockResolvedValue(undefined);

      // Monday 2025-02-24 → next fri = 2025-02-28
      const fromDate = new Date('2025-02-24');
      const result = await service.generate({ fromDate });
      expect(result.weekLabel).toBeDefined();
      expect(result.content.raceDates).toBeDefined();
      expect(result.content.raceDates).toHaveLength(3);
    });

    it('includes race count in placeholder highlights', async () => {
      delete process.env.GEMINI_API_KEY;
      const mockRaces = [
        {
          id: 1,
          rcNo: '1',
          rcDate: '20250228',
          meet: '서울',
          meetName: '서울',
          rcDist: '1200',
          rank: 'A',
        },
        {
          id: 2,
          rcNo: '2',
          rcDate: '20250301',
          meet: '서울',
          meetName: '서울',
          rcDist: '1400',
          rank: 'B',
        },
      ];
      raceRepo.find.mockResolvedValue(mockRaces);
      entryRepo.find.mockResolvedValue([]);
      previewRepo.findOne.mockResolvedValue(null);
      previewRepo.create.mockImplementation((d: unknown) => d);
      previewRepo.save.mockResolvedValue(undefined);

      const result = await service.generate({
        fromDate: new Date('2025-02-24'),
      });
      expect(result.content.highlights).toContain('2경주');
    });
  });
});
