import { Test, TestingModule } from '@nestjs/testing';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';

const mockService = {
  getRankings: jest.fn(),
  getMyRanking: jest.fn(),
};

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@example.com',
  role: UserRole.USER,
};

describe('RankingsController', () => {
  let controller: RankingsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RankingsController],
      providers: [{ provide: RankingsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RankingsController>(RankingsController);
  });

  describe('getRankings', () => {
    it('should delegate to service with type and limit', async () => {
      const rankings = [{ userId: 1, correctCount: 10, rank: 1 }];
      mockService.getRankings.mockResolvedValue(rankings);

      const response = await controller.getRankings('weekly', 10);

      expect(response).toEqual(rankings);
      expect(mockService.getRankings).toHaveBeenCalledWith('weekly', 10);
    });

    it('should pass undefined for optional params', async () => {
      mockService.getRankings.mockResolvedValue([]);

      await controller.getRankings();

      expect(mockService.getRankings).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('getMyRanking', () => {
    it('should delegate to service with user id and type', async () => {
      const myRank = { userId: 1, correctCount: 5, rank: 3 };
      mockService.getMyRanking.mockResolvedValue(myRank);

      const response = await controller.getMyRanking(mockUser, 'monthly');

      expect(response).toEqual(myRank);
      expect(mockService.getMyRanking).toHaveBeenCalledWith(1, 'monthly');
    });

    it('should pass undefined type when not provided', async () => {
      mockService.getMyRanking.mockResolvedValue(null);

      await controller.getMyRanking(mockUser);

      expect(mockService.getMyRanking).toHaveBeenCalledWith(1, undefined);
    });
  });
});
