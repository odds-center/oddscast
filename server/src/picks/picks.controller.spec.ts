import { Test, TestingModule } from '@nestjs/testing';
import { PicksController } from './picks.controller';
import { PicksService } from './picks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../common/decorators/current-user.decorator';

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@test.com',
  role: 'USER' as never,
};

const mockPicksService = {
  create: jest.fn(),
  findByUser: jest.fn(),
  findByRace: jest.fn(),
  delete: jest.fn(),
};

describe('PicksController', () => {
  let controller: PicksController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PicksController],
      providers: [{ provide: PicksService, useValue: mockPicksService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PicksController>(PicksController);
  });

  describe('create', () => {
    it('should create a pick for the current user', async () => {
      const dto = { raceId: 1, hrNo: '3', pickType: 'SINGLE' };
      const created = { id: 'pick-1', userId: 1, ...dto };
      mockPicksService.create.mockResolvedValue(created);

      const result = await controller.create(mockUser, dto as never);

      expect(mockPicksService.create).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(created);
    });
  });

  describe('findByUser', () => {
    it('should return picks for the current user with pagination', async () => {
      const expected = { data: [], total: 0 };
      mockPicksService.findByUser.mockResolvedValue(expected);

      const result = await controller.findByUser(mockUser, 1, 20);

      expect(mockPicksService.findByUser).toHaveBeenCalledWith(1, 1, 20);
      expect(result).toBe(expected);
    });

    it('should pass undefined when no pagination params', async () => {
      mockPicksService.findByUser.mockResolvedValue({ data: [], total: 0 });

      await controller.findByUser(mockUser);

      expect(mockPicksService.findByUser).toHaveBeenCalledWith(
        1,
        undefined,
        undefined,
      );
    });
  });

  describe('findByRace', () => {
    it('should return picks for a specific race', async () => {
      const picks = [{ id: 'pick-1', raceId: 5 }];
      mockPicksService.findByRace.mockResolvedValue(picks);

      const result = await controller.findByRace(5, mockUser);

      expect(mockPicksService.findByRace).toHaveBeenCalledWith(5, 1);
      expect(result).toBe(picks);
    });
  });

  describe('delete', () => {
    it('should delete pick for a race', async () => {
      mockPicksService.delete.mockResolvedValue({ affected: 1 });

      const result = await controller.delete(5, mockUser);

      expect(mockPicksService.delete).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual({ affected: 1 });
    });
  });
});
