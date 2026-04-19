import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RankingsService } from './rankings.service';
import { PicksService } from '../picks/picks.service';
import { User } from '../database/entities/user.entity';
import { createMockRepository } from '../test/mock-factories';
import { createTestUser } from '../test/test-entities';

const mockPicksService = {
  getCorrectCountByUser: jest.fn(),
  getCorrectCount: jest.fn(),
};

describe('RankingsService', () => {
  let service: RankingsService;
  let userRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    userRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingsService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: PicksService, useValue: mockPicksService },
      ],
    }).compile();

    service = module.get<RankingsService>(RankingsService);
    jest.clearAllMocks();
  });

  describe('getRankings', () => {
    it('returns empty rankings when no correct picks exist', async () => {
      mockPicksService.getCorrectCountByUser.mockResolvedValue(new Map());

      const result = await service.getRankings();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.type).toBe('overall');
    });

    it('returns ranked users sorted by correctCount descending', async () => {
      const countMap = new Map([
        [1, 25],
        [2, 10],
        [3, 15],
      ]);
      mockPicksService.getCorrectCountByUser.mockResolvedValue(countMap);

      const users = [
        createTestUser({
          id: 1,
          name: 'User A',
          nickname: null,
          isActive: true,
        }),
        createTestUser({
          id: 2,
          name: 'User B',
          nickname: null,
          isActive: true,
        }),
        createTestUser({
          id: 3,
          name: 'User C',
          nickname: null,
          isActive: true,
        }),
      ];
      userRepo.find.mockResolvedValue(users);

      const result = await service.getRankings();
      expect(result.data).toHaveLength(3);
      expect(result.data[0].correctCount).toBe(25);
      expect(result.data[1].correctCount).toBe(15);
      expect(result.data[2].correctCount).toBe(10);
      expect(result.data[0].rank).toBe(1);
      expect(result.data[1].rank).toBe(2);
      expect(result.data[2].rank).toBe(3);
    });

    it('uses nickname when available', async () => {
      const countMap = new Map([[1, 5]]);
      mockPicksService.getCorrectCountByUser.mockResolvedValue(countMap);
      userRepo.find.mockResolvedValue([
        createTestUser({
          id: 1,
          name: 'Real Name',
          nickname: '레이서1',
          isActive: true,
        }),
      ]);

      const result = await service.getRankings();
      expect(result.data[0].name).toBe('레이서1');
    });

    it('returns null name when nickname is null', async () => {
      const countMap = new Map([[1, 5]]);
      mockPicksService.getCorrectCountByUser.mockResolvedValue(countMap);
      userRepo.find.mockResolvedValue([
        createTestUser({
          id: 1,
          nickname: null,
          isActive: true,
        }),
      ]);

      const result = await service.getRankings();
      expect(result.data[0].name).toBeNull();
    });

    it('filters out users with 0 correctCount', async () => {
      const countMap = new Map([
        [1, 5],
        [2, 0],
      ]);
      mockPicksService.getCorrectCountByUser.mockResolvedValue(countMap);
      userRepo.find.mockResolvedValue([
        createTestUser({ id: 1, name: 'User A', isActive: true }),
        createTestUser({ id: 2, name: 'User B', isActive: true }),
      ]);

      const result = await service.getRankings();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].correctCount).toBe(5);
    });

    it('respects the limit parameter', async () => {
      const countMap = new Map(
        Array.from(
          { length: 10 },
          (_, i) => [i + 1, 10 - i] as [number, number],
        ),
      );
      mockPicksService.getCorrectCountByUser.mockResolvedValue(countMap);
      const users = Array.from({ length: 10 }, (_, i) =>
        createTestUser({ id: i + 1, name: `User ${i + 1}`, isActive: true }),
      );
      userRepo.find.mockResolvedValue(users);

      const result = await service.getRankings('overall', 3);
      expect(result.data).toHaveLength(3);
    });

    it('marks isCurrentUser as false for all entries', async () => {
      const countMap = new Map([[1, 5]]);
      mockPicksService.getCorrectCountByUser.mockResolvedValue(countMap);
      userRepo.find.mockResolvedValue([
        createTestUser({ id: 1, name: 'User A', isActive: true }),
      ]);

      const result = await service.getRankings();
      expect(result.data[0].isCurrentUser).toBe(false);
    });
  });

  describe('getMyRanking', () => {
    it('returns user ranking info with correctCount', async () => {
      const user = createTestUser({
        id: 1,
        name: 'Test User',
        nickname: '레이서',
      });
      userRepo.findOne.mockResolvedValue(user);
      mockPicksService.getCorrectCount.mockResolvedValue(12);

      const result = await service.getMyRanking(1);
      expect(result.data.id).toBe(1);
      expect(result.data.correctCount).toBe(12);
      expect(result.data.name).toBe('레이서');
      expect(result.data.isCurrentUser).toBe(true);
    });

    it('returns rank 0 (not calculated in myRanking)', async () => {
      userRepo.findOne.mockResolvedValue(createTestUser({ id: 1 }));
      mockPicksService.getCorrectCount.mockResolvedValue(5);

      const result = await service.getMyRanking(1);
      expect(result.data.rank).toBe(0);
    });

    it('handles missing user gracefully', async () => {
      userRepo.findOne.mockResolvedValue(null);
      mockPicksService.getCorrectCount.mockResolvedValue(0);

      const result = await service.getMyRanking(999);
      expect(result.data.name).toBe('');
      expect(result.data.correctCount).toBe(0);
    });
  });
});
