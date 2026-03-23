import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../database/db-enums';
import { User } from '../database/entities/user.entity';
import { Favorite } from '../database/entities/favorite.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { TicketStatus } from '../database/db-enums';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(PredictionTicket)
    private readonly ticketRepo: Repository<PredictionTicket>,
  ) {}

  async findAll(filters: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, role, search } = filters;
    const skip = (page - 1) * limit;

    const qb = this.userRepo
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.email',
        'u.name',
        'u.nickname',
        'u.avatar',
        'u.role',
        'u.isActive',
        'u.createdAt',
      ])
      .orderBy('u.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (role) {
      qb.andWhere('u.role = :role', { role: role as UserRole });
    }
    if (search) {
      const term = `%${search}%`;
      qb.andWhere(
        '(u.email ILIKE :term OR u.name ILIKE :term OR u.nickname ILIKE :term)',
        { term },
      );
    }

    const [usersRaw, total] = await qb.getManyAndCount();
    const userIds = usersRaw.map((u) => u.id);

    const availMap = new Map<number, number>();
    const totalMap = new Map<number, number>();
    if (userIds.length > 0) {
      const now = new Date();
      const totalRows = await this.ticketRepo
        .createQueryBuilder('pt')
        .select('pt.userId', 'userId')
        .addSelect('COUNT(*)', 'cnt')
        .where('pt.userId IN (:...ids)', { ids: userIds })
        .groupBy('pt.userId')
        .getRawMany<{ userId: number; cnt: string }>();
      totalRows.forEach((r) => totalMap.set(r.userId, parseInt(r.cnt, 10)));

      const availRows = await this.ticketRepo
        .createQueryBuilder('pt')
        .select('pt.userId', 'userId')
        .addSelect('COUNT(*)', 'cnt')
        .where('pt.userId IN (:...ids)', { ids: userIds })
        .andWhere('pt.status = :status', { status: TicketStatus.AVAILABLE })
        .andWhere('pt.expiresAt >= :now', { now })
        .groupBy('pt.userId')
        .getRawMany<{ userId: number; cnt: string }>();
      availRows.forEach((r) => availMap.set(r.userId, parseInt(r.cnt, 10)));
    }

    const users = usersRaw.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      nickname: u.nickname,
      avatar: u.avatar,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      availableTickets: availMap.get(u.id) ?? 0,
      totalTickets: totalMap.get(u.id) ?? 0,
    }));

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'nickname',
        'avatar',
        'role',
        'isActive',
        'createdAt',
        'lastLoginAt',
      ],
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    await this.userRepo.save(user);
    return this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'nickname', 'avatar', 'role', 'isActive'],
    }) as Promise<{
      id: number;
      email: string;
      name: string;
      nickname: string | null;
      avatar: string | null;
      role: string;
      isActive: boolean;
    }>;
  }

  async remove(id: number) {
    await this.userRepo.update(id, {
      isActive: false,
      updatedAt: new Date(),
    });
    return { message: '사용자가 비활성화되었습니다' };
  }

  async getStats(id: number) {
    const now = new Date();
    const [totalTickets, usedTickets, availableTickets, totalFavorites] = await Promise.all([
      this.ticketRepo.count({ where: { userId: id } }),
      this.ticketRepo.count({
        where: { userId: id, status: TicketStatus.USED },
      }),
      this.ticketRepo
        .createQueryBuilder('t')
        .where('t.userId = :id', { id })
        .andWhere('t.status = :status', { status: TicketStatus.AVAILABLE })
        .andWhere('t.expiresAt >= :now', { now })
        .getCount(),
      this.favoriteRepo.count({ where: { userId: id } }),
    ]);
    return {
      totalTickets,
      usedTickets,
      availableTickets,
      totalFavorites,
    };
  }
}
