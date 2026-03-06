import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FortuneService } from './fortune.service';
import { User } from '../database/entities/user.entity';
import { UserDailyFortune } from '../database/entities/user-daily-fortune.entity';
import { createMockRepository } from '../test/mock-factories';
import { createTestUser } from '../test/test-entities';

describe('FortuneService', () => {
  let service: FortuneService;
  let userRepo: ReturnType<typeof createMockRepository>;
  let fortuneRepo: ReturnType<typeof createMockRepository>;

  const mockFortune = {
    userId: 1,
    date: '20250301',
    messageOverall: '오늘은 행운이 따릅니다.',
    messageRace: '경마장에서 좋은 결과가 있을 것입니다.',
    messageAdvice: '긍정적인 마음가짐을 유지하세요.',
    luckyNumbers: [3, 7],
    luckyColor: '파랑',
    luckyColorHex: '#0000FF',
    keyword: '행운',
  };

  beforeEach(async () => {
    userRepo = createMockRepository();
    fortuneRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FortuneService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(UserDailyFortune),
          useValue: fortuneRepo,
        },
      ],
    }).compile();

    service = module.get<FortuneService>(FortuneService);
    jest.clearAllMocks();
  });

  describe('getOrCreateToday', () => {
    it('throws NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrCreateToday(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns existing fortune without creating a new one', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser({ id: 1 }));
      fortuneRepo.findOne.mockResolvedValue(mockFortune);

      const result = await service.getOrCreateToday(1);
      expect(result.messageOverall).toBe(mockFortune.messageOverall);
      expect(result.luckyNumbers).toEqual([3, 7]);
      expect(fortuneRepo.upsert).not.toHaveBeenCalled();
    });

    it('creates new fortune when none exists for today', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser({ id: 1 }));
      fortuneRepo.findOne
        .mockResolvedValueOnce(null) // First call: no existing fortune
        .mockResolvedValueOnce(mockFortune); // After upsert
      fortuneRepo.upsert.mockResolvedValue(undefined);

      const result = await service.getOrCreateToday(1);
      expect(fortuneRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
        expect.objectContaining({ conflictPaths: ['userId', 'date'] }),
      );
      expect(result).toBeDefined();
    });

    it('returns correct DTO structure', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser({ id: 1 }));
      fortuneRepo.findOne.mockResolvedValue(mockFortune);

      const result = await service.getOrCreateToday(1);
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('messageOverall');
      expect(result).toHaveProperty('messageRace');
      expect(result).toHaveProperty('messageAdvice');
      expect(result).toHaveProperty('luckyNumbers');
      expect(result).toHaveProperty('luckyColor');
    });

    it('handles null luckyColorHex gracefully', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser({ id: 1 }));
      fortuneRepo.findOne.mockResolvedValue({
        ...mockFortune,
        luckyColorHex: null,
      });

      const result = await service.getOrCreateToday(1);
      expect(result.luckyColorHex).toBeUndefined();
    });

    it('handles null keyword gracefully', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser({ id: 1 }));
      fortuneRepo.findOne.mockResolvedValue({ ...mockFortune, keyword: null });

      const result = await service.getOrCreateToday(1);
      expect(result.keyword).toBeUndefined();
    });

    it('handles non-array luckyNumbers gracefully', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser({ id: 1 }));
      fortuneRepo.findOne.mockResolvedValue({
        ...mockFortune,
        luckyNumbers: null,
      });

      const result = await service.getOrCreateToday(1);
      expect(result.luckyNumbers).toEqual([]);
    });
  });
});
