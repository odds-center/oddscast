import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FavoriteType } from '@prisma/client';
import {
  CreateFavoriteDto,
  UpdateFavoriteDto,
  ToggleFavoriteDto,
} from './dto/favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: number,
    filters: { type?: string; page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20, type = 'RACE' } = filters;
    const where: Prisma.FavoriteWhereInput = { userId };
    // 즐겨찾기 = 경주만. type 미지정 시 RACE 기본
    where.type = (type || 'RACE') as FavoriteType;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.favorite.count({ where }),
    ]);

    return { favorites, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const fav = await this.prisma.favorite.findUnique({ where: { id } });
    if (!fav) throw new NotFoundException('즐겨찾기를 찾을 수 없습니다');
    return fav;
  }

  async create(userId: number, dto: CreateFavoriteDto) {
    return this.prisma.favorite.create({
      data: {
        userId,
        type: dto.type as FavoriteType,
        targetId: dto.targetId,
        targetName: dto.targetName,
        targetData: dto.targetData as Prisma.InputJsonValue | undefined,
        memo: dto.memo,
        priority: dto.priority as any, // Cast to any to avoid enum issues, validated by DTO
        tags: dto.tags,
      },
    });
  }

  async update(id: number, dto: UpdateFavoriteDto) {
    return this.prisma.favorite.update({
      where: { id },
      data: {
        targetName: dto.targetName,
        targetData: dto.targetData as Prisma.InputJsonValue | undefined,
        memo: dto.memo,
        priority: dto.priority as any,
        tags: dto.tags,
      },
    });
  }

  async remove(id: number) {
    await this.prisma.favorite.delete({ where: { id } });
    return { message: '즐겨찾기가 삭제되었습니다' };
  }

  async toggle(userId: number, dto: ToggleFavoriteDto) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_type_targetId: {
          userId,
          type: dto.type as FavoriteType,
          targetId: dto.targetId,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { action: 'REMOVED' as const };
    } else {
      const fav = await this.prisma.favorite.create({
        data: {
          userId,
          type: dto.type as FavoriteType,
          targetId: dto.targetId,
          targetName: dto.targetName,
          targetData: dto.targetData as Prisma.InputJsonValue | undefined,
          priority: dto.priority as any,
          tags: dto.tags,
        },
      });
      return { action: 'ADDED' as const, favorite: fav };
    }
  }

  async check(userId: number, type: string, targetId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: {
        userId_type_targetId: {
          userId,
          type: type as FavoriteType,
          targetId,
        },
      },
    });
    return { isFavorite: !!fav, favorite: fav || undefined };
  }

  async getStatistics(userId: number) {
    const counts = await this.prisma.favorite.groupBy({
      by: ['type'],
      where: { userId },
      _count: true,
    });
    return {
      byType: counts,
      total: counts.reduce((sum, c) => sum + (c._count ?? 0), 0),
    };
  }

  async search(userId: number, query: string) {
    return this.prisma.favorite.findMany({
      where: {
        userId,
        type: 'RACE',
        OR: [
          { targetName: { contains: query, mode: 'insensitive' } },
          { memo: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async export(userId: number) {
    return this.prisma.favorite.findMany({
      where: { userId, type: 'RACE' },
    });
  }

  async bulkAdd(userId: number, items: CreateFavoriteDto[]) {
    // RACE만 허용 (DTO 검증 통과된 항목만)
    const raceItems = items.filter((item) => item.type === 'RACE');
    return this.prisma.favorite.createMany({
      data: raceItems.map((item) => ({
        userId,
        type: 'RACE' as FavoriteType,
        targetId: item.targetId,
        targetName: item.targetName,
        targetData: item.targetData as Prisma.InputJsonValue | undefined,
        memo: item.memo,
        priority: item.priority as any,
        tags: item.tags,
      })),
      skipDuplicates: true,
    });
  }

  async bulkDelete(userId: number, ids: number[]) {
    return this.prisma.favorite.deleteMany({
      where: {
        userId,
        id: { in: ids },
      },
    });
  }
}
