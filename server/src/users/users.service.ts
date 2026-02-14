import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, role, search } = filters;
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as UserRole;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [usersRaw, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { predictionTickets: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const now = new Date();
    const userIds = usersRaw.map((u) => u.id);
    const availableCounts =
      userIds.length > 0
        ? await this.prisma.predictionTicket.groupBy({
            by: ['userId'],
            where: {
              userId: { in: userIds },
              status: 'AVAILABLE',
              expiresAt: { gte: now },
            },
            _count: true,
          })
        : [];
    const availMap = new Map(availableCounts.map((c) => [c.userId, c._count]));

    const users = usersRaw.map(({ _count, ...u }) => ({
      ...u,
      availableTickets: availMap.get(u.id) ?? 0,
      totalTickets: _count.predictionTickets,
    }));

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        avatar: true,
        role: true,
        isActive: true,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: '사용자가 비활성화되었습니다' };
  }

  async getStats(id: number) {
    const [ticketCount, favCount] = await Promise.all([
      this.prisma.predictionTicket.count({ where: { userId: id } }),
      this.prisma.favorite.count({ where: { userId: id } }),
    ]);

    const usedTickets = await this.prisma.predictionTicket.count({
      where: { userId: id, status: 'USED' },
    });

    return {
      totalTickets: ticketCount,
      usedTickets,
      availableTickets: ticketCount - usedTickets,
      totalFavorites: favCount,
    };
  }
}
