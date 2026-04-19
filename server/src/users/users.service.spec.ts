import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../database/entities/user.entity';
import { Favorite } from '../database/entities/favorite.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { createMockRepository } from '../test/mock-factories';
import { createTestUser } from '../test/test-entities';
import { TicketStatus } from '../database/db-enums';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: ReturnType<typeof createMockRepository>;
  let favoriteRepo: ReturnType<typeof createMockRepository>;
  let ticketRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    userRepo = createMockRepository();
    favoriteRepo = createMockRepository();
    ticketRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Favorite), useValue: favoriteRepo },
        { provide: getRepositoryToken(PredictionTicket), useValue: ticketRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated user list', async () => {
      const mockUsers = [createTestUser({ id: 1 }), createTestUser({ id: 2 })];
      userRepo._qb.getManyAndCount.mockResolvedValue([mockUsers, 2]);
      ticketRepo._qb.getRawMany.mockResolvedValue([]);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('calculates totalPages correctly', async () => {
      userRepo._qb.getManyAndCount.mockResolvedValue([[], 50]);
      ticketRepo._qb.getRawMany.mockResolvedValue([]);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.totalPages).toBe(3);
    });

    it('applies search filter', async () => {
      userRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      ticketRepo._qb.getRawMany.mockResolvedValue([]);

      await service.findAll({ search: 'test@example.com' });
      expect(userRepo._qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.objectContaining({ term: '%test@example.com%' }),
      );
    });

    it('applies role filter', async () => {
      userRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      ticketRepo._qb.getRawMany.mockResolvedValue([]);

      await service.findAll({ role: 'ADMIN' });
      expect(userRepo._qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('role'),
        expect.objectContaining({ role: 'ADMIN' }),
      );
    });

    it('includes available ticket counts for each user', async () => {
      const mockUser = createTestUser({ id: 1 });
      userRepo._qb.getManyAndCount.mockResolvedValue([[mockUser], 1]);
      // First getRawMany: total tickets
      ticketRepo._qb.getRawMany
        .mockResolvedValueOnce([{ userId: 1, cnt: '5' }])
        .mockResolvedValueOnce([{ userId: 1, cnt: '3' }]);

      const result = await service.findAll({});
      expect(result.users[0].totalTickets).toBe(5);
      expect(result.users[0].availableTickets).toBe(3);
    });
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      const mockUser = createTestUser({ id: 1 });
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
    });

    it('throws NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates allowed fields and returns updated user', async () => {
      const mockUser = createTestUser({ id: 1, nickname: 'OldNick' });
      const updatedUser = { ...mockUser, nickname: 'NewNick' };
      userRepo.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      userRepo.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, { nickname: 'NewNick' });
      expect(result.nickname).toBe('NewNick');
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: 'NewNick' }),
      );
    });

    it('throws NotFoundException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { nickname: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates isActive field', async () => {
      const mockUser = createTestUser({ id: 1, isActive: true });
      userRepo.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, isActive: false });
      userRepo.save.mockResolvedValue({ ...mockUser, isActive: false });

      await service.update(1, { isActive: false });
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  describe('remove', () => {
    it('deactivates user instead of deleting', async () => {
      userRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);
      expect(userRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ isActive: false }),
      );
      expect(result.message).toContain('비활성화');
    });
  });

  describe('getStats', () => {
    it('returns ticket and favorite stats', async () => {
      ticketRepo.count
        .mockResolvedValueOnce(10) // totalTickets
        .mockResolvedValueOnce(3); // usedTickets
      // availableTickets now uses createQueryBuilder.getCount
      ticketRepo._qb.getCount.mockResolvedValue(6);
      favoriteRepo.count.mockResolvedValue(5);

      const result = await service.getStats(1);
      expect(result.totalTickets).toBe(10);
      expect(result.usedTickets).toBe(3);
      expect(result.availableTickets).toBe(6);
      expect(result.totalFavorites).toBe(5);
    });

    it('queries used tickets with USED status filter', async () => {
      ticketRepo.count.mockResolvedValue(0);
      favoriteRepo.count.mockResolvedValue(0);

      await service.getStats(1);
      expect(ticketRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, status: TicketStatus.USED },
        }),
      );
    });
  });
});
