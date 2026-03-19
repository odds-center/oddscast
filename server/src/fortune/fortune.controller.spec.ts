import { Test, TestingModule } from '@nestjs/testing';
import { FortuneController } from './fortune.controller';
import { FortuneService } from './fortune.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';

const mockService = {
  getOrCreateToday: jest.fn(),
};

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@example.com',
  role: UserRole.USER,
};

describe('FortuneController', () => {
  let controller: FortuneController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FortuneController],
      providers: [{ provide: FortuneService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FortuneController>(FortuneController);
  });

  describe('getToday', () => {
    it('should delegate to fortuneService.getOrCreateToday with user id', async () => {
      const fortune = {
        id: 'uuid-1',
        userId: 1,
        fortuneDate: '20250315',
        content: 'Good luck today!',
      };
      mockService.getOrCreateToday.mockResolvedValue(fortune);

      const response = await controller.getToday(mockUser);

      expect(response).toEqual(fortune);
      expect(mockService.getOrCreateToday).toHaveBeenCalledWith(1);
    });
  });
});
