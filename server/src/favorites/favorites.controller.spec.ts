import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/db-enums';

const mockService = {
  findAll: jest.fn(),
  getStatistics: jest.fn(),
  check: jest.fn(),
  search: jest.fn(),
  export: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  toggle: jest.fn(),
  bulkAdd: jest.fn(),
  bulkDelete: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockUser: JwtPayload = {
  sub: 1,
  email: 'test@example.com',
  role: UserRole.USER,
};

describe('FavoritesController', () => {
  let controller: FavoritesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [{ provide: FavoritesService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FavoritesController>(FavoritesController);
  });

  describe('findAll', () => {
    it('should delegate to service with user id and filters', async () => {
      const result = { data: [], total: 0 };
      mockService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(mockUser, 'RACE', 1, 10);

      expect(response).toEqual(result);
      expect(mockService.findAll).toHaveBeenCalledWith(1, {
        type: 'RACE',
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getStatistics', () => {
    it('should delegate to service with user id', async () => {
      const result = { total: 5 };
      mockService.getStatistics.mockResolvedValue(result);

      const response = await controller.getStatistics(mockUser);

      expect(response).toEqual(result);
      expect(mockService.getStatistics).toHaveBeenCalledWith(1);
    });
  });

  describe('check', () => {
    it('should delegate to service with user id, type, and targetId', async () => {
      mockService.check.mockResolvedValue({ isFavorite: true });

      const response = await controller.check(mockUser, 'RACE', '42');

      expect(response).toEqual({ isFavorite: true });
      expect(mockService.check).toHaveBeenCalledWith(1, 'RACE', '42');
    });

    it('should default type to RACE when empty', async () => {
      mockService.check.mockResolvedValue({ isFavorite: false });

      await controller.check(mockUser, '', 'abc');

      expect(mockService.check).toHaveBeenCalledWith(1, 'RACE', 'abc');
    });
  });

  describe('search', () => {
    it('should delegate to service with user id and query', async () => {
      const result = [{ id: 1 }];
      mockService.search.mockResolvedValue(result);

      const response = await controller.search(mockUser, 'test');

      expect(response).toEqual(result);
      expect(mockService.search).toHaveBeenCalledWith(1, 'test');
    });
  });

  describe('export', () => {
    it('should delegate to service with user id', async () => {
      const result = { favorites: [] };
      mockService.export.mockResolvedValue(result);

      const response = await controller.export(mockUser);

      expect(response).toEqual(result);
      expect(mockService.export).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should delegate to service with id', async () => {
      const result = { id: 5, type: 'RACE' };
      mockService.findOne.mockResolvedValue(result);

      const response = await controller.findOne(5);

      expect(response).toEqual(result);
      expect(mockService.findOne).toHaveBeenCalledWith(5);
    });
  });

  describe('create', () => {
    it('should delegate to service with user id and dto', async () => {
      const dto = { type: 'RACE', targetId: '42' } as never;
      const result = { id: 1, type: 'RACE' };
      mockService.create.mockResolvedValue(result);

      const response = await controller.create(mockUser, dto);

      expect(response).toEqual(result);
      expect(mockService.create).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('toggle', () => {
    it('should delegate to service with user id and dto', async () => {
      const dto = { type: 'RACE', targetId: '42' } as never;
      const result = { isFavorite: true };
      mockService.toggle.mockResolvedValue(result);

      const response = await controller.toggle(mockUser, dto);

      expect(response).toEqual(result);
      expect(mockService.toggle).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('bulkAdd', () => {
    it('should delegate to service with user id and items', async () => {
      const items = [{ type: 'RACE', targetId: '1' }] as never;
      const result = { added: 1 };
      mockService.bulkAdd.mockResolvedValue(result);

      const response = await controller.bulkAdd(mockUser, items);

      expect(response).toEqual(result);
      expect(mockService.bulkAdd).toHaveBeenCalledWith(1, items);
    });
  });

  describe('bulkDelete', () => {
    it('should delegate to service with user id and parsed ids', async () => {
      const result = { deleted: 2 };
      mockService.bulkDelete.mockResolvedValue(result);

      const response = await controller.bulkDelete(mockUser, {
        ids: [1, '2'],
      });

      expect(response).toEqual(result);
      expect(mockService.bulkDelete).toHaveBeenCalledWith(1, [1, 2]);
    });
  });

  describe('update', () => {
    it('should delegate to service with id and dto', async () => {
      const dto = { priority: 'HIGH' } as never;
      const result = { id: 3, priority: 'HIGH' };
      mockService.update.mockResolvedValue(result);

      const response = await controller.update(mockUser, 3, dto);

      expect(response).toEqual(result);
      expect(mockService.update).toHaveBeenCalledWith(3, dto, 1);
    });
  });

  describe('remove', () => {
    it('should delegate to service with id', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove(mockUser as never, 7);

      expect(mockService.remove).toHaveBeenCalledWith(7, 1);
    });
  });
});
