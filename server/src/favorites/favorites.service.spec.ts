import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  favorite: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a favorite with priority and tags', async () => {
      const dto = {
        type: 'HORSE',
        targetId: '123',
        targetName: 'Thunder',
        priority: 'HIGH',
        tags: ['fast', 'winner'],
      };

      const expectedResult = { id: 1, ...dto, createdAt: new Date() };

      (prisma.favorite.create as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.create(1, dto as any);

      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          type: 'HORSE',
          targetId: '123',
          targetName: 'Thunder',
          targetData: undefined,
          memo: undefined,
          priority: 'HIGH',
          tags: ['fast', 'winner'],
        },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('toggle', () => {
    it('should add a favorite if not exists', async () => {
      (prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.favorite.create as jest.Mock).mockResolvedValue({ id: 1 });

      const dto = {
        type: 'RACE',
        targetId: 'r1',
        targetName: 'Seoul Race 1',
        priority: 'MEDIUM',
        tags: ['weekend'],
      };

      const result = await service.toggle(1, dto as any);

      expect(result).toEqual({ action: 'ADDED', favorite: { id: 1 } });
      expect(prisma.favorite.create).toHaveBeenCalled();
    });

    it('should remove a favorite if exists', async () => {
      (prisma.favorite.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.favorite.delete as jest.Mock).mockResolvedValue({ id: 1 });

      const dto = {
        type: 'RACE',
        targetId: 'r1',
        targetName: 'Seoul Race 1',
      };

      const result = await service.toggle(1, dto as any);

      expect(result).toEqual({ action: 'REMOVED' });
      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
