import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoritesService } from './favorites.service';
import { Favorite } from '../database/entities/favorite.entity';
import { FavoriteType, FavoritePriority } from '../database/db-enums';

const mockRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
};

describe('FavoritesService', () => {
  let service: FavoritesService;
  let repo: Repository<Favorite>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    repo = module.get<Repository<Favorite>>(getRepositoryToken(Favorite));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a favorite with priority and tags', async () => {
      const dto = {
        type: 'RACE',
        targetId: '123',
        targetName: 'Thunder',
        priority: 'HIGH',
        tags: ['fast', 'winner'],
      };
      const created = {
        id: 1,
        userId: 1,
        type: FavoriteType.RACE,
        targetId: '123',
        targetName: 'Thunder',
        priority: FavoritePriority.HIGH,
        tags: ['fast', 'winner'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Favorite;
      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await service.create(
        1,
        dto as Parameters<FavoritesService['create']>[1],
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          type: 'RACE',
          targetId: '123',
          targetName: 'Thunder',
          priority: 'HIGH',
          tags: ['fast', 'winner'],
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('toggle', () => {
    it('should add a favorite if not exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const saved = { id: 1 } as Favorite;
      mockRepository.create.mockReturnValue(saved);
      mockRepository.save.mockResolvedValue(saved);

      const dto = {
        type: 'RACE',
        targetId: 'r1',
        targetName: 'Seoul Race 1',
        priority: 'MEDIUM',
        tags: ['weekend'],
      };

      const result = await service.toggle(
        1,
        dto as Parameters<FavoritesService['toggle']>[1],
      );

      expect(result).toEqual({ action: 'ADDED', favorite: saved });
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { userId: 1, type: 'RACE', targetId: 'r1' },
      });
      expect(repo.save).toHaveBeenCalled();
    });

    it('should remove a favorite if exists', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const dto = {
        type: 'RACE',
        targetId: 'r1',
        targetName: 'Seoul Race 1',
      };

      const result = await service.toggle(
        1,
        dto as Parameters<FavoritesService['toggle']>[1],
      );

      expect(result).toEqual({ action: 'REMOVED' });
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
